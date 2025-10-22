const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const logger = require('../core/logger');
const SecureLogger = require('../core/secure-logger');
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
            SecureLogger.dev('Reddit cache hit:', subreddit, limit);
            return res.json(cached);
        }

        SecureLogger.dev('Reddit cache miss - fetching from database');

        // Get database client from app locals
        const supabase = req.app.locals.supabase;

        if (!supabase) {
            throw new Error('Database client not available');
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

        SecureLogger.api('GET', '/api/reddit', 200);

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

/**
 * Get top Reddit posts from today/yesterday grouped by flair
 * Used by Content Hub to display posts organized by categories
 */
router.get('/by-flair', validate(schemas.redditQuery, 'query'), async (req, res) => {
    try {
        const subreddit = req.query.subreddit || 'TheTowerGame';
        const limit = Math.min(parseInt(req.query.limit) || 5, 20); // Posts per flair
        const daysBack = parseInt(req.query.days) || 2; // Default: last 2 days (today + yesterday)

        // Check cache first
        const cacheKey = `reddit:by-flair:${subreddit}:${limit}:${daysBack}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            SecureLogger.dev('Reddit flair cache hit');
            return res.json(cached);
        }

        SecureLogger.dev('Reddit flair cache miss - fetching from database');

        // Get database client from app locals
        const supabase = req.app.locals.supabase;

        if (!supabase) {
            throw new Error('Database client not available');
        }

        // Calculate cutoff date (e.g., 2 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        // Fetch posts from the last N days, grouped by flair
        const { data: dbPosts, error } = await supabase
            .from('reddit_posts')
            .select('*')
            .eq('subreddit', subreddit)
            .gte('created_at', cutoffDate.toISOString())
            .order('score', { ascending: false });

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        // Group posts by flair
        const postsByFlair = {};
        const flairOrder = ['Guide', 'Strategy', 'Discussion', 'Question', 'Showcase', 'Humor', 'Other'];

        dbPosts.forEach(post => {
            const flair = post.flair || 'Other';
            if (!postsByFlair[flair]) {
                postsByFlair[flair] = [];
            }
            postsByFlair[flair].push(post);
        });

        // Get top N posts per flair
        const groupedPosts = {};
        Object.keys(postsByFlair).forEach(flair => {
            groupedPosts[flair] = postsByFlair[flair]
                .slice(0, limit)
                .map(post => ({
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
                    link_flair_text: post.flair || '',
                    permalink: `/r/${post.subreddit}/comments/${post.reddit_id}`
                }));
        });

        // Sort flairs by predefined order, then alphabetically
        const sortedFlairs = Object.keys(groupedPosts).sort((a, b) => {
            const aIndex = flairOrder.indexOf(a);
            const bIndex = flairOrder.indexOf(b);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });

        SecureLogger.api('GET', '/api/reddit/by-flair', 200);

        const response = {
            success: true,
            postsByFlair: groupedPosts,
            flairs: sortedFlairs,
            totalPosts: dbPosts.length,
            subreddit: subreddit,
            daysBack: daysBack,
            source: 'database'
        };

        // Store in cache
        cache.set(cacheKey, response);

        res.json(response);

    } catch (error) {
        logger.logError(error, {
            route: '/api/reddit/by-flair',
            subreddit: req.query.subreddit,
            limit: req.query.limit
        });

        res.status(500).json({
            success: false,
            error: 'Failed to fetch Reddit posts by flair'
        });
    }
});

module.exports = router;
