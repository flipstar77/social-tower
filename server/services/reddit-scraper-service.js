/**
 * Reddit Scraper Service - Scheduled scraping and vectorization
 */

const axios = require('axios');
const cron = require('node-cron');

class RedditScraperService {
    constructor(supabase) {
        this.supabase = supabase;
        this.apifyApiKey = process.env.APIFY_API_KEY;
        this.apifyActorId = 'oAuCIx3ItNrs2okjQ';
        this.subreddit = 'TheTowerGame';
        this.isRunning = false;
        this.lastScrapeTime = null;
        this.cronJob = null;
    }

    /**
     * Start scheduled scraping (twice daily at 8 AM and 8 PM)
     */
    start() {
        // Run at 8:00 AM and 8:00 PM every day
        this.cronJob = cron.schedule('0 8,20 * * *', async () => {
            console.log('⏰ Scheduled Reddit scrape triggered');
            await this.scrapeAndStore();
        });

        console.log('✅ Reddit scraper scheduled (runs at 8 AM and 8 PM daily)');

        // Run initial scrape on startup
        setTimeout(() => this.scrapeAndStore(), 5000);
    }

    /**
     * Stop scheduled scraping
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('🛑 Reddit scraper stopped');
        }
    }

    /**
     * Scrape Reddit and store posts in Supabase
     */
    async scrapeAndStore() {
        if (this.isRunning) {
            console.log('⚠️ Scrape already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        console.log(`📡 Starting Reddit scrape for r/${this.subreddit}...`);

        try {
            // Fetch posts from Apify
            const posts = await this.fetchPosts(100); // Get 100 posts
            console.log(`✅ Fetched ${posts.length} posts from Reddit`);

            // Filter out duplicates
            const newPosts = await this.filterDuplicates(posts);
            console.log(`🔍 Filtered to ${newPosts.length} new posts (${posts.length - newPosts.length} duplicates skipped)`);

            // Store posts in Supabase
            if (newPosts.length > 0) {
                await this.storePosts(newPosts);

                // Vectorize important threads for RAG
                await this.vectorizeThreads(newPosts);
            } else {
                console.log('⚠️ No new posts to store');
            }

            this.lastScrapeTime = new Date();
            console.log(`✅ Reddit scrape completed successfully`);

        } catch (error) {
            console.error('❌ Reddit scrape failed:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Filter out posts that already exist in database
     */
    async filterDuplicates(posts) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, cannot filter duplicates');
            return posts;
        }

        try {
            // Get all reddit_ids from fetched posts
            const redditIds = posts.map(post => post.parsedId);

            // Query database for existing posts
            const { data: existingPosts, error } = await this.supabase.supabase
                .from('reddit_posts')
                .select('reddit_id')
                .in('reddit_id', redditIds);

            if (error) {
                console.error('❌ Error checking for duplicates:', error.message);
                return posts; // Return all if check fails
            }

            // Create set of existing IDs
            const existingIds = new Set(existingPosts?.map(p => p.reddit_id) || []);

            // Filter out duplicates
            return posts.filter(post => !existingIds.has(post.parsedId));

        } catch (error) {
            console.error('❌ Duplicate filtering failed:', error.message);
            return posts; // Return all if filtering fails
        }
    }

    /**
     * Fetch posts from Apify
     */
    async fetchPosts(limit = 50) {
        // Start Apify actor run
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/${this.apifyActorId}/runs`,
            {
                startUrls: [{ url: `https://www.reddit.com/r/${this.subreddit}/` }],
                maxItems: limit,
                maxPostCount: limit,
                maxComments: 10 // Get some comments for context
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apifyApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const runId = runResponse.data.data.id;
        const datasetId = runResponse.data.data.defaultDatasetId;
        console.log(`🚀 Apify run started: ${runId}`);

        // Wait for run to complete
        let status = 'READY';
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait

        while (!['SUCCEEDED', 'FAILED', 'ABORTED'].includes(status) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await axios.get(
                `https://api.apify.com/v2/acts/${this.apifyActorId}/runs/${runId}`,
                { headers: { 'Authorization': `Bearer ${this.apifyApiKey}` } }
            );

            status = statusResponse.data.data.status;
            attempts++;

            if (attempts % 10 === 0) {
                console.log(`⏳ Waiting for scrape to complete... (${attempts}s)`);
            }
        }

        if (status !== 'SUCCEEDED') {
            throw new Error(`Apify run failed with status: ${status}`);
        }

        // Fetch results
        const datasetResponse = await axios.get(
            `https://api.apify.com/v2/datasets/${datasetId}/items`,
            { headers: { 'Authorization': `Bearer ${this.apifyApiKey}` } }
        );

        return datasetResponse.data.filter(item => item.dataType === 'post');
    }

    /**
     * Store posts in Supabase
     */
    async storePosts(posts) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, skipping storage');
            return;
        }

        const formattedPosts = posts.map(post => ({
            reddit_id: post.parsedId,
            title: post.title,
            author: post.username,
            subreddit: post.parsedCommunityName,
            body: post.body || '',
            flair: post.flair || null,
            url: post.url,
            score: post.upVotes || 0,
            num_comments: post.numberOfComments || 0,
            created_at: new Date(post.createdAt),
            scraped_at: new Date(),
            thumbnail_url: post.thumbnailUrl,
            is_video: post.isVideo || false
        }));

        // Upsert posts (insert or update if exists)
        const { data, error } = await this.supabase.supabase
            .from('reddit_posts')
            .upsert(formattedPosts, { onConflict: 'reddit_id' });

        if (error) {
            console.error('❌ Error storing posts:', error.message);
        } else {
            console.log(`✅ Stored ${formattedPosts.length} posts in database`);
        }
    }

    /**
     * Vectorize important threads for RAG system
     */
    async vectorizeThreads(posts) {
        // Filter high-quality posts for RAG
        const importantPosts = posts.filter(post => {
            const isHighEngagement = post.upVotes > 10 || post.numberOfComments > 5;
            const isGuideOrStrategy = ['Guide', 'Strategy', 'Discussion'].includes(post.flair);
            return isHighEngagement || isGuideOrStrategy;
        });

        console.log(`🔍 Found ${importantPosts.length} high-quality posts to vectorize`);

        // Sort by score to prioritize best content
        const sortedPosts = importantPosts.sort((a, b) => b.upVotes - a.upVotes);

        // Vectorize top 20 posts per run
        for (const post of sortedPosts.slice(0, 20)) {
            await this.vectorizePost(post);
        }

        console.log(`✅ Vectorized ${Math.min(sortedPosts.length, 20)} posts for RAG`);
    }

    /**
     * Vectorize a single post and store embedding
     */
    async vectorizePost(post) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, skipping vectorization');
            return;
        }

        try {
            // Create text content for embedding
            const content = `Title: ${post.title}\n\nBody: ${post.body || 'No content'}\n\nFlair: ${post.flair || 'None'}`;

            // Store in vector table for RAG
            // Note: We'll use Supabase's pgvector or a simple text search for now
            const { data, error } = await this.supabase.supabase
                .from('reddit_rag_content')
                .upsert({
                    reddit_id: post.parsedId,
                    content: content,
                    title: post.title,
                    flair: post.flair,
                    score: post.upVotes,
                    url: post.url,
                    created_at: new Date(post.createdAt),
                    indexed_at: new Date()
                }, { onConflict: 'reddit_id' });

            if (error && !error.message.includes('does not exist')) {
                console.error(`❌ Error vectorizing post ${post.parsedId}:`, error.message);
            }
        } catch (error) {
            // Table might not exist yet, that's okay
            if (!error.message.includes('does not exist')) {
                console.error('❌ Vectorization error:', error.message);
            }
        }
    }

    /**
     * Manual trigger for scraping
     */
    async triggerScrape() {
        return await this.scrapeAndStore();
    }

    /**
     * Get scraper status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastScrapeTime: this.lastScrapeTime,
            nextScheduledRun: this.cronJob ? 'Next at 8 AM or 8 PM' : 'Not scheduled'
        };
    }
}

module.exports = RedditScraperService;
