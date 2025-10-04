const express = require('express');
const axios = require('axios');
const router = express.Router();

// Reddit API endpoint
router.get('/', async (req, res) => {
    try {
        const subreddit = req.query.subreddit || 'TheTowerGame';
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        console.log(`📡 Fetching Reddit r/${subreddit} with limit ${limit}...`);

        const redditUrl = `https://www.reddit.com/r/${subreddit}.json?limit=${limit}`;

        const response = await axios.get(redditUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        if (response.data && response.data.data && response.data.data.children) {
            const posts = response.data.data.children.map(item => item.data);
            console.log(`✅ Successfully fetched ${posts.length} Reddit posts`);

            res.json({
                success: true,
                posts: posts,
                subreddit: subreddit,
                count: posts.length
            });
        } else {
            throw new Error('Invalid Reddit API response structure');
        }
    } catch (error) {
        console.error('❌ Error fetching Reddit data:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: 'Consider using client-side CORS proxy'
        });
    }
});

module.exports = router;