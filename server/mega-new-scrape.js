/**
 * MEGA NEW POSTS SCRAPER
 * Fetches ONLY from /new endpoint to get as many recent posts as possible
 * Goes back as far as Reddit allows (typically ~1000 posts)
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { generateEmbedding } = require('./services/embeddings');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

class MegaNewScraper {
    constructor() {
        this.baseUrl = 'https://www.reddit.com';
        this.subreddit = 'TheTowerGame';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        this.allPosts = [];
        this.allComments = [];
    }

    async fetchNewPosts(limit = 10000) {
        console.log(`🚀 MEGA NEW SCRAPE: Fetching up to ${limit} NEW posts...\n`);

        let after = null;
        let totalFetched = 0;
        let pageNum = 0;
        const postsPerPage = 100;

        while (totalFetched < limit) {
            pageNum++;

            try {
                const url = after
                    ? `${this.baseUrl}/r/${this.subreddit}/new.json?limit=${postsPerPage}&after=${after}`
                    : `${this.baseUrl}/r/${this.subreddit}/new.json?limit=${postsPerPage}`;

                const response = await axios.get(url, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: 15000
                });

                const posts = response.data.data.children
                    .filter(child => child.kind === 't3')
                    .map(child => this.parsePost(child.data));

                if (posts.length === 0) {
                    console.log(`\n   ⚠️ No more posts available on page ${pageNum}`);
                    break;
                }

                this.allPosts.push(...posts);
                totalFetched += posts.length;

                const oldestPost = posts[posts.length - 1];
                const oldestDate = new Date(oldestPost.createdAt).toISOString().split('T')[0];

                console.log(`   ✅ Page ${pageNum}: Got ${posts.length} posts (Total: ${totalFetched}, Oldest: ${oldestDate})`);

                after = response.data.data.after;
                if (!after) {
                    console.log(`\n   🏁 Reached end of /new listing`);
                    break;
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    console.log(`   ⚠️ Timeout on page ${pageNum}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                } else if (error.response?.status === 429) {
                    console.log(`   ⚠️ Rate limited on page ${pageNum}, waiting 10 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    continue;
                } else {
                    console.error(`   ❌ Error on page ${pageNum}:`, error.message);
                    break;
                }
            }
        }

        console.log(`\n✅ Fetched ${this.allPosts.length} total NEW posts\n`);
        return this.allPosts;
    }

    parsePost(data) {
        return {
            parsedId: data.id,
            title: data.title || 'No title',
            subreddit: data.subreddit || this.subreddit,
            username: data.author || 'unknown',
            upVotes: data.score || 0,
            numberOfComments: data.num_comments || 0,
            createdAt: new Date(data.created_utc * 1000).toISOString(),
            flair: data.link_flair_text || null,
            url: `https://www.reddit.com${data.permalink}`,
            body: data.selftext || null,
            isNSFW: data.over_18 || false
        };
    }

    async filterDuplicates(posts) {
        console.log(`🔍 Checking for duplicates in database...`);

        const redditIds = posts.map(post => post.parsedId);
        const { data: existingPosts, error } = await supabase
            .from('reddit_posts')
            .select('reddit_id')
            .in('reddit_id', redditIds);

        if (error) {
            console.error('❌ Error checking duplicates:', error.message);
            return posts;
        }

        const existingIds = new Set(existingPosts?.map(p => p.reddit_id) || []);
        const newPosts = posts.filter(post => !existingIds.has(post.parsedId));

        console.log(`   Found ${existingPosts.length} existing posts`);
        console.log(`   Filtered to ${newPosts.length} NEW posts\n`);

        return newPosts;
    }

    async storePosts(posts) {
        if (posts.length === 0) return;

        console.log(`💾 Storing ${posts.length} posts in database...`);

        const postsToStore = posts.map(post => ({
            reddit_id: post.parsedId,
            title: post.title,
            subreddit: post.subreddit,
            author: post.username,
            score: post.upVotes,
            num_comments: post.numberOfComments,
            created_at: post.createdAt,
            flair: post.flair,
            url: post.url,
            body: post.body
        }));

        const { error } = await supabase
            .from('reddit_posts')
            .upsert(postsToStore, { onConflict: 'reddit_id' });

        if (error) {
            console.error('❌ Error storing posts:', error.message);
            return;
        }

        console.log(`✅ Stored ${posts.length} posts\n`);
    }

    async fetchCommentsForPost(postId, limit = 150) {
        try {
            const url = `${this.baseUrl}/r/${this.subreddit}/comments/${postId}.json?limit=${limit}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 15000
            });

            if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
                return [];
            }

            const commentsData = response.data[1];
            const comments = [];

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

                        if (data.replies && data.replies.data && data.replies.data.children) {
                            extractComments(data.replies.data.children);
                        }
                    }
                }
            };

            if (commentsData.data && commentsData.data.children) {
                extractComments(commentsData.data.children);
            }

            return comments.slice(0, limit);
        } catch (error) {
            return [];
        }
    }

    async fetchAllComments(posts) {
        console.log(`💬 Fetching comments for ${posts.length} posts...\n`);

        let commentsFetched = 0;
        const batchSize = 10;

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];

            if (post.numberOfComments === 0) continue;

            const comments = await this.fetchCommentsForPost(post.parsedId, 150);

            if (comments.length > 0) {
                this.allComments.push(...comments);
                commentsFetched++;
            }

            if ((i + 1) % 50 === 0) {
                console.log(`   💬 Processed ${i + 1}/${posts.length} posts (${this.allComments.length} comments so far)`);
            }

            // Batch pause every 10 requests
            if ((i + 1) % batchSize === 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n✅ Fetched ${this.allComments.length} total comments from ${commentsFetched} posts\n`);
    }

    async storeComments(comments) {
        if (comments.length === 0) return;

        console.log(`💾 Storing ${comments.length} comments...`);

        const commentsToStore = comments.map(comment => ({
            comment_id: comment.parsedId,
            post_id: comment.postId,
            parent_id: comment.parentId,
            author: comment.username,
            body: comment.body,
            score: comment.upVotes,
            created_at: comment.createdAt
        }));

        const { error } = await supabase
            .from('reddit_comments')
            .upsert(commentsToStore, { onConflict: 'comment_id' });

        if (error) {
            console.error('❌ Error storing comments:', error.message);
            return;
        }

        console.log(`✅ Stored ${comments.length} comments\n`);
    }

    async vectorizePost(post) {
        try {
            const contentToVectorize = `${post.title}\n\n${post.body || ''}`.trim();
            const embedding = await generateEmbedding(contentToVectorize);

            const { error } = await supabase
                .from('reddit_rag_content')
                .upsert({
                    reddit_id: post.parsedId,
                    title: post.title,
                    content: contentToVectorize,
                    score: post.upVotes,
                    created_at: post.createdAt,
                    url: post.url,
                    flair: post.flair,
                    embedding: embedding
                }, { onConflict: 'reddit_id' });

            return !error;
        } catch (error) {
            return false;
        }
    }

    async vectorizeAllPosts(posts) {
        console.log(`🔍 Vectorizing ${posts.length} posts for RAG...\n`);

        let vectorized = 0;
        const batchSize = 10;

        for (let i = 0; i < posts.length; i++) {
            const success = await this.vectorizePost(posts[i]);
            if (success) vectorized++;

            if ((i + 1) % 50 === 0) {
                console.log(`   📊 Vectorized ${i + 1}/${posts.length} posts...`);
            }

            // Pause every batch to avoid rate limits
            if ((i + 1) % batchSize === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n✅ Vectorized ${vectorized}/${posts.length} posts\n`);
    }

    async run() {
        console.log('🚀 MEGA NEW SCRAPER STARTING...\n');
        console.log('=' .repeat(60));
        console.log('\n');

        const startTime = Date.now();

        try {
            // PHASE 1: Fetch ALL new posts
            await this.fetchNewPosts(10000);

            if (this.allPosts.length === 0) {
                console.log('❌ No posts fetched. Exiting.');
                return;
            }

            // PHASE 2: Filter duplicates
            const newPosts = await this.filterDuplicates(this.allPosts);

            if (newPosts.length === 0) {
                console.log('✅ No new posts to store. All posts already in database.');
                return;
            }

            // PHASE 3: Store posts
            await this.storePosts(newPosts);

            // PHASE 4: Fetch comments for high-quality posts
            const importantPosts = newPosts.filter(post => {
                const isMeme = post.flair && (post.flair.toLowerCase().includes('meme') || post.flair.toLowerCase().includes('humor'));
                return !isMeme && (post.upVotes > 3 || post.numberOfComments > 2);
            });

            console.log(`📝 Fetching comments for ${importantPosts.length} high-quality posts...\n`);
            await this.fetchAllComments(importantPosts);

            // PHASE 5: Store comments
            if (this.allComments.length > 0) {
                await this.storeComments(this.allComments);
            }

            // PHASE 6: Vectorize posts
            await this.vectorizeAllPosts(newPosts);

            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

            console.log('=' .repeat(60));
            console.log('\n🎉 MEGA NEW SCRAPE COMPLETE!\n');
            console.log(`📊 Summary:`);
            console.log(`   Total posts fetched: ${this.allPosts.length}`);
            console.log(`   New posts stored: ${newPosts.length}`);
            console.log(`   Comments fetched: ${this.allComments.length}`);
            console.log(`   Time elapsed: ${elapsed} minutes\n`);

        } catch (error) {
            console.error('❌ MEGA SCRAPE FAILED:', error.message);
            console.error(error.stack);
        }
    }
}

// Run the scraper
const scraper = new MegaNewScraper();
scraper.run();
