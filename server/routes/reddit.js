const express = require('express');
const router = express.Router();

/**
 * Reddit API endpoint - Returns scraped posts from Supabase database
 * The posts are automatically scraped twice daily by the RedditScraperService
 */
router.get('/', async (req, res) => {
    try {
        const subreddit = req.query.subreddit || 'TheTowerGame';
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        console.log(`📡 Fetching Reddit r/${subreddit} from Supabase with limit ${limit}...`);

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

        console.log(`✅ Successfully fetched ${posts.length} Reddit posts from Supabase`);

        res.json({
            success: true,
            posts: posts,
            subreddit: subreddit,
            count: posts.length,
            source: 'database'
        });

    } catch (error) {
        console.error('❌ Error fetching Reddit data from Supabase:', error.message);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
