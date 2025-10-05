const express = require('express');
const axios = require('axios');
const router = express.Router();

// Apify configuration
const APIFY_API_KEY = process.env.APIFY_API_KEY || 'apify_api_PNttwixh8cILCQi2ablqxObbHQNlml2FMQjZ';
const APIFY_ACTOR_ID = 'trudax/reddit-scraper-lite';

// In-memory cache for Reddit posts
let cachedPosts = null;
let lastFetchTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Reddit API endpoint using Apify
router.get('/', async (req, res) => {
    try {
        const subreddit = req.query.subreddit || 'TheTowerGame';
        const limit = Math.min(parseInt(req.query.limit) || 25, 100);

        // Check cache first
        const now = Date.now();
        if (cachedPosts && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
            console.log(`📦 Serving ${cachedPosts.length} Reddit posts from cache`);
            return res.json({
                success: true,
                posts: cachedPosts.slice(0, limit),
                subreddit: subreddit,
                count: Math.min(cachedPosts.length, limit),
                cached: true
            });
        }

        console.log(`📡 Fetching Reddit r/${subreddit} via Apify with limit ${limit}...`);

        // Start Apify actor run
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs`,
            {
                startUrls: [`https://www.reddit.com/r/${subreddit}/`],
                maxItems: limit,
                maxPostCount: limit,
                maxComments: 0, // Don't fetch comments for faster performance
                proxy: {
                    useApifyProxy: true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${APIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const runId = runResponse.data.data.id;
        console.log(`🚀 Apify run started: ${runId}`);

        // Wait for run to complete (with timeout)
        let status = 'RUNNING';
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait

        while (status === 'RUNNING' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await axios.get(
                `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}`,
                {
                    headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
                }
            );

            status = statusResponse.data.data.status;
            attempts++;
            console.log(`⏳ Run status: ${status} (${attempts}s)`);
        }

        if (status !== 'SUCCEEDED') {
            throw new Error(`Apify run did not complete successfully: ${status}`);
        }

        // Fetch results from dataset
        const datasetId = runResponse.data.data.defaultDatasetId;
        const datasetResponse = await axios.get(
            `https://api.apify.com/v2/datasets/${datasetId}/items`,
            {
                headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
            }
        );

        const posts = datasetResponse.data
            .filter(item => item.dataType === 'post')
            .map(post => ({
                id: post.parsedId,
                title: post.title,
                url: post.url,
                author: post.username,
                subreddit: post.parsedCommunityName,
                created_utc: Math.floor(new Date(post.createdAt).getTime() / 1000),
                score: post.upVotes,
                num_comments: post.numberOfComments,
                selftext: post.body || '',
                thumbnail: post.body?.match(/Thumbnail: (https?:\/\/[^\s]+)/)?.[1] || '',
                is_video: post.isVideo,
                over_18: post.over18
            }));

        console.log(`✅ Successfully fetched ${posts.length} Reddit posts via Apify`);

        // Update cache
        cachedPosts = posts;
        lastFetchTime = now;

        res.json({
            success: true,
            posts: posts,
            subreddit: subreddit,
            count: posts.length,
            cached: false
        });

    } catch (error) {
        console.error('❌ Error fetching Reddit data via Apify:', error.message);

        // Return cached data if available
        if (cachedPosts) {
            console.log(`📦 Returning stale cache due to error`);
            return res.json({
                success: true,
                posts: cachedPosts.slice(0, req.query.limit || 25),
                subreddit: req.query.subreddit || 'TheTowerGame',
                count: cachedPosts.length,
                cached: true,
                stale: true
            });
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;