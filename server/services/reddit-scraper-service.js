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
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    }

    /**
     * Start scheduled scraping (twice daily + nightly mega-scrape)
     */
    start() {
        // Light scrapes: Run at 8:00 AM and 6:00 PM every day (100 posts)
        this.lightScrapeJob = cron.schedule('0 8,18 * * *', async () => {
            console.log('⏰ Scheduled light Reddit scrape triggered (100 posts)');
            await this.scrapeAndStore(100);
        });

        // Mega scrape: Run at 2:00 AM every day (5000 posts)
        this.megaScrapeJob = cron.schedule('0 2 * * *', async () => {
            console.log('🌙 Scheduled MEGA Reddit scrape triggered (5000 posts)');
            await this.scrapeAndStore(5000, true);
        });

        console.log('✅ Reddit scraper scheduled (using free Reddit JSON API):');
        console.log('   📅 Light scrapes: 8 AM & 6 PM (100 posts)');
        console.log('   🌙 Mega scrape: 2 AM (5000 posts + comments)');

        // Run initial light scrape on startup
        setTimeout(() => this.scrapeAndStore(100), 5000);
    }

    /**
     * Stop scheduled scraping
     */
    stop() {
        if (this.lightScrapeJob) {
            this.lightScrapeJob.stop();
        }
        if (this.megaScrapeJob) {
            this.megaScrapeJob.stop();
        }
        console.log('🛑 Reddit scraper stopped');
    }

    /**
     * Scrape Reddit and store posts in Supabase
     * @param {number} limit - Number of posts to fetch (default 100)
     * @param {boolean} isMegaScrape - Whether this is a mega scrape (logs differently)
     */
    async scrapeAndStore(limit = 100, isMegaScrape = false) {
        if (this.isRunning) {
            console.log('⚠️ Scrape already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        const scrapeType = isMegaScrape ? '🌙 MEGA SCRAPE' : '📡 Light scrape';
        console.log(`${scrapeType} starting for r/${this.subreddit} (${limit} posts)...`);

        try {
            // Fetch posts using Reddit's free JSON API with pagination
            const { posts, comments } = await this.fetchPostsWithPagination(limit);
            console.log(`✅ Fetched ${posts.length} posts and ${comments.length} comments from Reddit`);

            // Filter out duplicates
            const newPosts = await this.filterDuplicates(posts);
            console.log(`🔍 Filtered to ${newPosts.length} new posts (${posts.length - newPosts.length} duplicates skipped)`);

            // Store posts and comments in Supabase
            if (newPosts.length > 0) {
                await this.storePosts(newPosts);

                // Store comments (filter to only comments for new posts)
                const newPostIds = new Set(newPosts.map(p => p.parsedId));
                const commentsForNewPosts = comments.filter(c => newPostIds.has(c.postId?.replace('t3_', '')));
                await this.storeComments(commentsForNewPosts);

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

            console.log(`🔍 DEBUG: Checking ${redditIds.length} post IDs for duplicates`);
            console.log(`🔍 DEBUG: First 5 IDs to check:`, redditIds.slice(0, 5));

            // Query database for existing posts
            const { data: existingPosts, error } = await this.supabase.supabase
                .from('reddit_posts')
                .select('reddit_id')
                .in('reddit_id', redditIds);

            if (error) {
                console.error('❌ Error checking for duplicates:', error.message);
                return posts; // Return all if check fails
            }

            console.log(`🔍 DEBUG: Found ${existingPosts?.length || 0} existing posts in DB`);
            if (existingPosts && existingPosts.length > 0) {
                console.log(`🔍 DEBUG: First 5 existing IDs:`, existingPosts.slice(0, 5).map(p => p.reddit_id));
                // Check if any of the IDs we're looking for are actually in the results
                const firstFiveToCheck = redditIds.slice(0, 5);
                const matchingIds = existingPosts.filter(p => firstFiveToCheck.includes(p.reddit_id));
                console.log(`🔍 DEBUG: Of the first 5 IDs to check, ${matchingIds.length} were found in DB:`, matchingIds.map(p => p.reddit_id));
            }

            // Create set of existing IDs
            const existingIds = new Set(existingPosts?.map(p => p.reddit_id) || []);

            // Filter out duplicates
            const newPosts = posts.filter(post => !existingIds.has(post.parsedId));

            console.log(`🔍 DEBUG: Filtered to ${newPosts.length} new posts`);
            if (newPosts.length > 0) {
                console.log(`🔍 DEBUG: First 5 new post IDs:`, newPosts.slice(0, 5).map(p => p.parsedId));
            }

            return newPosts;

        } catch (error) {
            console.error('❌ Duplicate filtering failed:', error.message);
            return posts; // Return all if filtering fails
        }
    }

    /**
     * Fetch posts using Reddit's JSON API (more reliable than Apify)
     */
    async fetchPostsDirectly(limit = 100, sort = 'hot', after = null) {
        try {
            const sortUrls = {
                hot: `https://www.reddit.com/r/${this.subreddit}/hot.json`,
                top: `https://www.reddit.com/r/${this.subreddit}/top.json?t=all`,
                new: `https://www.reddit.com/r/${this.subreddit}/new.json`
            };

            let url = sortUrls[sort] || sortUrls.hot;
            url += `${url.includes('?') ? '&' : '?'}limit=${Math.min(limit, 100)}`;
            if (after) {
                url += `&after=${after}`;
            }

            const response = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 10000
            });

            const posts = response.data.data.children
                .filter(child => child.kind === 't3')
                .map(child => {
                    const data = child.data;
                    return {
                        parsedId: data.id,
                        title: data.title,
                        username: data.author,
                        parsedCommunityName: data.subreddit,
                        body: data.selftext || '',
                        flair: data.link_flair_text || null,
                        url: `https://www.reddit.com${data.permalink}`,
                        upVotes: data.score,
                        numberOfComments: data.num_comments,
                        createdAt: new Date(data.created_utc * 1000).toISOString(),
                        thumbnailUrl: data.thumbnail && data.thumbnail.startsWith('http') ? data.thumbnail : null,
                        isVideo: data.is_video || false
                    };
                });

            const nextAfter = response.data.data.after;

            return { posts, comments: [], nextAfter };

        } catch (error) {
            console.error('❌ Direct Reddit API fetch failed:', error.message);
            return { posts: [], comments: [], nextAfter: null };
        }
    }

    /**
     * Fetch comments for a specific post using Reddit's JSON API
     */
    async fetchCommentsForPost(postId, limit = 150) {
        try {
            const url = `https://www.reddit.com/comments/${postId}.json?limit=${limit}&depth=10&sort=top`;

            const response = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 15000
            });

            if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
                return [];
            }

            // Reddit returns [post_data, comments_data]
            const commentsData = response.data[1];
            const comments = [];

            // Recursive function to extract all comments
            const extractComments = (children) => {
                if (!children) return;

                for (const child of children) {
                    if (child.kind === 't1' && child.data) {
                        const data = child.data;
                        comments.push({
                            parsedId: data.id,
                            postId: `t3_${postId}`,
                            parentId: data.parent_id,
                            username: data.author,
                            body: data.body || '',
                            upVotes: data.score,
                            createdAt: new Date(data.created_utc * 1000).toISOString()
                        });

                        // Recursively get replies
                        if (data.replies && data.replies.data && data.replies.data.children) {
                            extractComments(data.replies.data.children);
                        }
                    }
                }
            };

            if (commentsData.data && commentsData.data.children) {
                extractComments(commentsData.data.children);
            }

            return comments.slice(0, limit); // Limit to requested amount

        } catch (error) {
            console.error(`❌ Failed to fetch comments for post ${postId}:`, error.message);
            return [];
        }
    }

    /**
     * Fetch posts from Apify (legacy fallback)
     */
    async fetchPosts(limit = 50, sort = 'hot') {
        // Build Reddit URL with sorting
        const sortUrls = {
            hot: `https://www.reddit.com/r/${this.subreddit}/hot/`,
            top: `https://www.reddit.com/r/${this.subreddit}/top/?t=all`,
            new: `https://www.reddit.com/r/${this.subreddit}/new/`
        };

        const url = sortUrls[sort] || sortUrls.hot;

        // Start Apify actor run
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/${this.apifyActorId}/runs`,
            {
                startUrls: [{ url }],
                maxItems: limit,
                maxPostCount: limit,
                maxComments: 50, // Get more comments for better context
                scrollTimeout: 40 // Longer scroll timeout for more posts
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
        const maxAttempts = 120; // 120 seconds max wait (2 minutes)

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

        const posts = datasetResponse.data.filter(item => item.dataType === 'post');
        const comments = datasetResponse.data.filter(item => item.dataType === 'comment');

        return { posts, comments };
    }

    /**
     * Store posts in Supabase
     */
    async storePosts(posts) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, skipping storage');
            return;
        }

        // Deduplicate posts by reddit_id (same post can appear in top/hot/new)
        const uniquePosts = [];
        const seenIds = new Set();

        for (const post of posts) {
            if (!seenIds.has(post.parsedId)) {
                seenIds.add(post.parsedId);
                uniquePosts.push(post);
            }
        }

        console.log(`📦 Deduplicating posts: ${posts.length} → ${uniquePosts.length} unique`);

        const formattedPosts = uniquePosts.map(post => ({
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
     * Store comments in Supabase
     */
    async storeComments(comments) {
        if (!this.supabase || !this.supabase.supabase || comments.length === 0) {
            return;
        }

        const formattedComments = comments.map(comment => ({
            comment_id: comment.parsedId,
            post_id: comment.postId?.replace('t3_', ''), // Remove Reddit prefix
            parent_id: comment.parentId?.replace(/^t[13]_/, ''), // Remove prefix from parent
            author: comment.username,
            body: comment.body || '',
            score: comment.upVotes || 0,
            created_at: new Date(comment.createdAt)
        }));

        // Upsert comments
        const { data, error } = await this.supabase.supabase
            .from('reddit_comments')
            .upsert(formattedComments, { onConflict: 'comment_id' });

        if (error) {
            console.error('❌ Error storing comments:', error.message);
        } else {
            console.log(`✅ Stored ${formattedComments.length} comments in database`);
        }
    }

    /**
     * Vectorize important threads for RAG system
     * Now vectorizes ALL high-quality posts, not just top 20
     */
    async vectorizeThreads(posts) {
        // Filter high-quality posts for RAG (exclude memes)
        const importantPosts = posts.filter(post => {
            const isMeme = post.flair && (post.flair.toLowerCase().includes('meme') || post.flair.toLowerCase().includes('humor'));
            const isHighEngagement = post.upVotes > 5 || post.numberOfComments > 3;
            const isGuideOrStrategy = ['Guide', 'Strategy', 'Discussion', 'Help', 'Question'].includes(post.flair);
            return !isMeme && (isHighEngagement || isGuideOrStrategy);
        });

        console.log(`🔍 Found ${importantPosts.length} high-quality posts to vectorize`);

        if (importantPosts.length === 0) {
            console.log('⏭️ No posts to vectorize, skipping...');
            return;
        }

        // Sort by score to prioritize best content
        const sortedPosts = importantPosts.sort((a, b) => b.upVotes - a.upVotes);

        // Vectorize ALL posts in batches of 20 to respect rate limits
        let vectorized = 0;
        const batchSize = 20;

        for (let i = 0; i < sortedPosts.length; i += batchSize) {
            const batch = sortedPosts.slice(i, i + batchSize);

            for (const post of batch) {
                await this.vectorizePost(post);
                vectorized++;

                if (vectorized % 10 === 0) {
                    console.log(`   📊 Vectorized ${vectorized}/${sortedPosts.length} posts...`);
                }
            }

            // Pause between batches to respect OpenAI rate limits (3500 TPM)
            if (i + batchSize < sortedPosts.length) {
                console.log(`   ⏸️ Pausing 3 seconds before next batch...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log(`✅ Vectorized ${vectorized} posts for RAG`);
    }

    /**
     * Vectorize a single post with comments and store embedding
     * Skips if already vectorized to save API calls
     */
    async vectorizePost(post, comments = []) {
        if (!this.supabase || !this.supabase.supabase) {
            console.log('⚠️ Supabase not configured, skipping vectorization');
            return false;
        }

        try {
            // Check if already vectorized
            const { data: existing, error: checkError } = await this.supabase.supabase
                .from('reddit_rag_content')
                .select('reddit_id')
                .eq('reddit_id', post.parsedId)
                .single();

            if (existing && !checkError) {
                // Already vectorized, skip
                return false;
            }

            const { generateEmbedding } = require('./embeddings');

            // Create text content for embedding including top comments
            let content = `Title: ${post.title}\n\nBody: ${post.body || 'No content'}\n\nFlair: ${post.flair || 'None'}`;

            // Add top 10 comments for richer context (sorted by score)
            if (comments && comments.length > 0) {
                const topComments = comments
                    .filter(c => c.body && c.body.length > 10)
                    .sort((a, b) => b.upVotes - a.upVotes)
                    .slice(0, 10);

                if (topComments.length > 0) {
                    content += '\n\nTop Community Comments:\n';
                    topComments.forEach((comment, i) => {
                        content += `\n${i + 1}. ${comment.username} (${comment.upVotes} upvotes): ${comment.body.substring(0, 300)}`;
                    });
                }
            }

            // Generate embedding using OpenAI
            const embedding = await generateEmbedding(content);

            // Store in vector table for RAG
            const { data, error } = await this.supabase.supabase
                .from('reddit_rag_content')
                .upsert({
                    reddit_id: post.parsedId,
                    content: content,
                    title: post.title,
                    flair: post.flair,
                    score: post.upVotes,
                    url: post.url,
                    embedding: embedding,
                    created_at: new Date(post.createdAt),
                    indexed_at: new Date()
                }, { onConflict: 'reddit_id' });

            if (error && !error.message.includes('does not exist')) {
                console.error(`❌ Error vectorizing post ${post.parsedId}:`, error.message);
                return false;
            }

            return true; // Successfully vectorized
        } catch (error) {
            // Table might not exist yet, that's okay
            if (!error.message.includes('does not exist')) {
                console.error('❌ Vectorization error:', error.message);
            }
            return false;
        }
    }

    /**
     * Manual trigger for scraping
     */
    async triggerScrape() {
        return await this.scrapeAndStore();
    }

    /**
     * Mega scrape - initial knowledge base builder (1000 posts with 150 comments each)
     * Uses Reddit's JSON API directly with pagination
     */
    async megaScrape() {
        if (this.isRunning) {
            console.log('⚠️ Scrape already in progress, skipping...');
            return { success: false, message: 'Scrape already running' };
        }

        this.isRunning = true;
        console.log('🚀 Starting MEGA SCRAPE with COMMENTS using Reddit JSON API directly...');

        try {
            let allPosts = [];
            let allComments = [];
            const sortMethods = ['top', 'hot', 'new'];

            // PHASE 1: Fetch posts
            for (const sort of sortMethods) {
                console.log(`📦 Fetching posts from r/${this.subreddit}/${sort}...`);
                let after = null;
                let pagesForThisSort = 0;
                const maxPagesPerSort = 4; // 4 pages × 100 posts × 3 sorts = 1200 posts

                while (pagesForThisSort < maxPagesPerSort) {
                    const { posts, nextAfter } = await this.fetchPostsDirectly(100, sort, after);

                    if (posts.length === 0) {
                        console.log(`   ⚠️ No more posts available for ${sort}`);
                        break;
                    }

                    allPosts.push(...posts);
                    pagesForThisSort++;
                    console.log(`   ✅ Page ${pagesForThisSort}: Got ${posts.length} posts (total: ${allPosts.length})`);

                    after = nextAfter;
                    if (!after) {
                        console.log(`   ⚠️ Reached end of ${sort} listing`);
                        break;
                    }

                    // Small delay to respect Reddit's rate limits
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                console.log(`✅ Finished ${sort}: collected ${pagesForThisSort} pages`);
            }

            console.log(`✅ Total fetched: ${allPosts.length} posts`);

            // Filter duplicates
            const newPosts = await this.filterDuplicates(allPosts);
            console.log(`🔍 Filtered to ${newPosts.length} new posts`);

            if (newPosts.length > 0) {
                // Store all posts first
                await this.storePosts(newPosts);

                // Filter high-quality posts for comment fetching (exclude memes)
                const importantPosts = newPosts.filter(post => {
                    const isMeme = post.flair && (post.flair.toLowerCase().includes('meme') || post.flair.toLowerCase().includes('humor'));
                    const hasComments = post.numberOfComments > 0;
                    const isHighEngagement = post.upVotes > 5 || post.numberOfComments > 3;
                    const isGuideOrStrategy = ['Guide', 'Strategy', 'Discussion', 'Question'].includes(post.flair);
                    return !isMeme && hasComments && (isHighEngagement || isGuideOrStrategy);
                });

                console.log(`📝 Fetching comments for ${importantPosts.length} high-quality posts (up to 150 per post)...`);

                // PHASE 2: Fetch comments for important posts
                let commentsProcessed = 0;
                for (let i = 0; i < importantPosts.length; i++) {
                    const post = importantPosts[i];
                    console.log(`   💬 [${i + 1}/${importantPosts.length}] Fetching comments for: ${post.title.substring(0, 60)}...`);

                    const comments = await this.fetchCommentsForPost(post.parsedId, 150);

                    if (comments.length > 0) {
                        allComments.push(...comments);
                        commentsProcessed++;
                        console.log(`      ✅ Got ${comments.length} comments (Total: ${allComments.length})`);
                    }

                    // Delay between comment requests to respect rate limits
                    if ((i + 1) % 10 === 0) {
                        console.log(`   ⏸️  Pausing for 5 seconds after 10 requests...`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

                console.log(`✅ Fetched ${allComments.length} total comments from ${commentsProcessed} posts`);

                // Store all comments
                if (allComments.length > 0) {
                    await this.storeComments(allComments);
                }

                // PHASE 3: Vectorize posts with their comments
                console.log(`🔍 Vectorizing ${importantPosts.length} posts with comment context...`);

                // Create a map of post ID to comments for efficient lookup
                const commentsByPost = {};
                allComments.forEach(comment => {
                    const postId = comment.postId?.replace('t3_', '');
                    if (!commentsByPost[postId]) {
                        commentsByPost[postId] = [];
                    }
                    commentsByPost[postId].push(comment);
                });

                // Vectorize in batches of 20 to avoid rate limits
                for (let i = 0; i < importantPosts.length; i += 20) {
                    const batch = importantPosts.slice(i, i + 20);

                    for (const post of batch) {
                        const postComments = commentsByPost[post.parsedId] || [];
                        await this.vectorizePost(post, postComments);
                    }

                    console.log(`   ✅ Vectorized ${Math.min(i + 20, importantPosts.length)}/${importantPosts.length} posts`);

                    // Pause between batches to respect rate limits
                    if (i + 20 < importantPosts.length) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
            }

            this.lastScrapeTime = new Date();
            console.log('🎉 MEGA SCRAPE COMPLETE!');

            return {
                success: true,
                postsScraped: allPosts.length,
                newPosts: newPosts.length,
                commentsScraped: allComments.length,
                message: 'Mega scrape with comments completed successfully'
            };

        } catch (error) {
            console.error('❌ Mega scrape failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Fetch posts with pagination for mega scrapes
     * Uses Reddit's free JSON API with pagination to get as many posts as possible
     */
    async fetchPostsWithPagination(limit = 5000) {
        console.log(`📡 Fetching up to ${limit} posts using Reddit JSON API with pagination...`);

        let allPosts = [];

        // For light scrapes (< 200 posts), prioritize NEW posts to catch latest content
        // For mega scrapes, fetch from all sources
        const sortMethods = limit < 200 ? ['new'] : ['top', 'hot', 'new'];
        const postsPerPage = 100; // Reddit's max per request
        const pagesNeeded = Math.ceil(limit / sortMethods.length / postsPerPage);

        for (const sort of sortMethods) {
            console.log(`📦 Fetching ${sort} posts...`);
            let after = null;
            let pagesForThisSort = 0;

            while (pagesForThisSort < pagesNeeded && allPosts.length < limit) {
                const { posts, nextAfter } = await this.fetchPostsDirectly(100, sort, after);

                if (posts.length === 0) {
                    console.log(`   ⚠️ No more ${sort} posts available`);
                    break;
                }

                allPosts.push(...posts);
                pagesForThisSort++;
                console.log(`   ✅ Page ${pagesForThisSort}: Got ${posts.length} posts (total: ${allPosts.length})`);

                after = nextAfter;
                if (!after) {
                    console.log(`   ⚠️ Reached end of ${sort} listing`);
                    break;
                }

                // Small delay to respect Reddit's rate limits (~60 req/min)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`✅ ${sort}: ${pagesForThisSort} pages, total collected: ${allPosts.length}`);
        }

        // For mega scrapes, also fetch comments for high-quality posts
        console.log(`💬 Fetching comments for high-quality posts...`);
        const importantPosts = allPosts
            .filter(post => {
                const isMeme = post.flair && post.flair.toLowerCase().includes('meme');
                const hasComments = post.numberOfComments > 0;
                const isHighEngagement = post.upVotes > 5 || post.numberOfComments > 3;
                return !isMeme && hasComments && isHighEngagement;
            })
            .slice(0, 100); // Limit to top 100 posts for comments

        let allComments = [];
        for (let i = 0; i < importantPosts.length; i++) {
            const post = importantPosts[i];
            const comments = await this.fetchCommentsForPost(post.parsedId, 150);

            if (comments.length > 0) {
                allComments.push(...comments);
                if ((i + 1) % 10 === 0) {
                    console.log(`   💬 Fetched comments for ${i + 1}/${importantPosts.length} posts (${allComments.length} total)`);
                }
            }

            // Rate limit: 2 seconds between comment requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`✅ Total: ${allPosts.length} posts, ${allComments.length} comments`);
        return { posts: allPosts, comments: allComments };
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
