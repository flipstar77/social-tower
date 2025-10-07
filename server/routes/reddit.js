const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const logger = require('../core/logger');
const { validate, schemas } = require('../middleware/validation');

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Reddit API endpoint - Returns scraped posts from Supabase database
 * The posts are automatically scraped twice daily by the RedditScraperService
 * Cached for 5 minutes to reduce database load
 */
router.get('/', validate(schemas.redditQuery, 'query'), async (req, res) => {
    try {
        const subreddit = req.query.subreddit || 'TheTowerGame';
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        // Check cache first
        const cacheKey = `reddit:${subreddit}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info('Reddit cache hit', { subreddit, limit });
            return res.json(cached);
        }

        logger.info('Reddit cache miss - fetching from database', { subreddit, limit });

        // Get Supabase client from app locals (set in server.js)
        const supabase = req.app.locals.supabase;

        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        // Fetch posts from database, ordered by creation date (newest first)
        const { data: dbPosts, error } = await supabase
            .from('reddit_posts')
            .select('*')
            .eq('subreddit', subreddit)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        // Transform database posts to match frontend expected format
        const posts = (dbPosts || []).map(post => ({
            id: post.post_id,
            title: post.title,
            url: post.url,
            author: post.author,
            subreddit: post.subreddit,
            created_utc: Math.floor(new Date(post.created_at).getTime() / 1000),
            score: post.score || 0,
            num_comments: post.num_comments || 0,
            selftext: post.body || '',
            thumbnail: post.thumbnail_url || '',
            is_video: post.is_video || false,
            over_18: false,
            link_flair_text: post.flair || ''
        }));

        logger.info('Successfully fetched Reddit posts', {
            count: posts.length,
            subreddit,
            source: 'database'
        });

        const response = {
            success: true,
            posts: posts,
            subreddit: subreddit,
            count: posts.length,
            source: 'database'
        };

        // Store in cache
        cache.set(cacheKey, response);

        res.json(response);

    } catch (error) {
        logger.logError(error, {
            route: '/api/reddit',
            subreddit: req.query.subreddit,
            limit: req.query.limit
        });

        res.status(500).json({
            success: false,
            error: 'Failed to fetch Reddit posts'
        });
    }
});

module.exports = router;
