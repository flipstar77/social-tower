/**
 * ULTRA MEGA SCRAPE - Get as many posts as possible (10k-20k+)
 * Scrapes ALL time periods, sorts, and goes deep into pagination
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { generateEmbedding } = require('./services/embeddings');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const SUBREDDIT = 'TheTowerGame';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function fetchPostsDirectly(limit = 100, sort = 'hot', timeFilter = null, after = null) {
    try {
        let url;

        if (sort === 'top') {
            url = `https://www.reddit.com/r/${SUBREDDIT}/top.json?t=${timeFilter || 'all'}&limit=${limit}`;
        } else if (sort === 'controversial') {
            url = `https://www.reddit.com/r/${SUBREDDIT}/controversial.json?t=${timeFilter || 'all'}&limit=${limit}`;
        } else {
            url = `https://www.reddit.com/r/${SUBREDDIT}/${sort}.json?limit=${limit}`;
        }

        if (after) {
            url += `&after=${after}`;
        }

        const response = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 15000
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
        return { posts, nextAfter };

    } catch (error) {
        console.error(`❌ Failed to fetch ${sort}:`, error.message);
        return { posts: [], nextAfter: null };
    }
}

async function filterDuplicates(posts) {
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
    return posts.filter(post => !existingIds.has(post.parsedId));
}

async function storePosts(posts) {
    // Deduplicate within this batch
    const uniquePosts = [];
    const seenIds = new Set();

    for (const post of posts) {
        if (!seenIds.has(post.parsedId)) {
            seenIds.add(post.parsedId);
            uniquePosts.push(post);
        }
    }

    console.log(`   📦 Deduplicating: ${posts.length} → ${uniquePosts.length} unique`);

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

    const { error } = await supabase
        .from('reddit_posts')
        .upsert(formattedPosts, { onConflict: 'reddit_id' });

    if (error) {
        console.error('❌ Error storing posts:', error.message);
        return 0;
    }

    console.log(`   ✅ Stored ${formattedPosts.length} posts`);
    return formattedPosts.length;
}

async function vectorizeHighQualityPosts(posts) {
    const importantPosts = posts.filter(post => {
        const isMeme = post.flair && (post.flair.toLowerCase().includes('meme') || post.flair.toLowerCase().includes('humor'));
        const isHighEngagement = post.upVotes > 5 || post.numberOfComments > 3;
        const isGuideOrStrategy = ['Guide', 'Strategy', 'Discussion', 'Help', 'Question'].includes(post.flair);
        return !isMeme && (isHighEngagement || isGuideOrStrategy);
    });

    if (importantPosts.length === 0) {
        return 0;
    }

    console.log(`   🔍 Vectorizing ${importantPosts.length} high-quality posts...`);

    let vectorized = 0;
    for (const post of importantPosts) {
        try {
            // Check if already vectorized
            const { data: existing } = await supabase
                .from('reddit_rag_content')
                .select('reddit_id')
                .eq('reddit_id', post.parsedId)
                .single();

            if (existing) {
                continue; // Skip if already vectorized
            }

            const content = `Title: ${post.title}\n\nBody: ${post.body || 'No content'}\n\nFlair: ${post.flair || 'None'}`;
            const embedding = await generateEmbedding(content);

            await supabase
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

            vectorized++;

            // Rate limit pause
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`❌ Error vectorizing ${post.parsedId}:`, error.message);
        }
    }

    console.log(`   ✅ Vectorized ${vectorized} posts`);
    return vectorized;
}

async function ultraMegaScrape() {
    console.log('🚀🚀🚀 ULTRA MEGA SCRAPE STARTING 🚀🚀🚀');
    console.log('Target: Get as many posts as possible (10k-20k+)\n');

    let totalPosts = [];
    let totalStored = 0;
    let totalVectorized = 0;

    // Configuration for maximum scraping
    const scrapeConfigs = [
        // Top posts from different time periods
        { sort: 'top', timeFilter: 'all', pages: 100, desc: 'Top All-Time' },
        { sort: 'top', timeFilter: 'year', pages: 50, desc: 'Top This Year' },
        { sort: 'top', timeFilter: 'month', pages: 20, desc: 'Top This Month' },
        { sort: 'top', timeFilter: 'week', pages: 10, desc: 'Top This Week' },

        // Controversial from different periods
        { sort: 'controversial', timeFilter: 'all', pages: 50, desc: 'Controversial All-Time' },
        { sort: 'controversial', timeFilter: 'year', pages: 20, desc: 'Controversial Year' },

        // Hot & New
        { sort: 'hot', pages: 50, desc: 'Hot Posts' },
        { sort: 'new', pages: 100, desc: 'New Posts' },
        { sort: 'rising', pages: 20, desc: 'Rising Posts' }
    ];

    for (const config of scrapeConfigs) {
        console.log(`\n📡 Fetching ${config.desc} (up to ${config.pages} pages)...`);

        let after = null;
        let pagesScraped = 0;
        let postsFromThisConfig = 0;

        while (pagesScraped < config.pages) {
            const { posts, nextAfter } = await fetchPostsDirectly(
                100,
                config.sort,
                config.timeFilter,
                after
            );

            if (posts.length === 0) {
                console.log(`   ⚠️ No more posts available`);
                break;
            }

            totalPosts.push(...posts);
            postsFromThisConfig += posts.length;
            pagesScraped++;

            if (pagesScraped % 10 === 0 || !nextAfter) {
                console.log(`   📄 Page ${pagesScraped}: Got ${posts.length} posts (config total: ${postsFromThisConfig}, overall: ${totalPosts.length})`);
            }

            after = nextAfter;
            if (!after) {
                console.log(`   ⚠️ Reached end of listing after ${pagesScraped} pages`);
                break;
            }

            // Respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Every 50 pages, store what we have so far
            if (pagesScraped % 50 === 0) {
                console.log(`\n💾 CHECKPOINT: Storing posts so far...`);
                const newPosts = await filterDuplicates(totalPosts);
                console.log(`   🔍 ${totalPosts.length} total → ${newPosts.length} new`);

                if (newPosts.length > 0) {
                    const stored = await storePosts(newPosts);
                    totalStored += stored;

                    const vectorized = await vectorizeHighQualityPosts(newPosts);
                    totalVectorized += vectorized;
                }

                totalPosts = []; // Clear memory
                console.log(`   ✅ Checkpoint complete. Total stored: ${totalStored}, vectorized: ${totalVectorized}\n`);
            }
        }

        console.log(`✅ ${config.desc}: Scraped ${pagesScraped} pages, ${postsFromThisConfig} posts`);
    }

    // Final storage
    if (totalPosts.length > 0) {
        console.log(`\n💾 FINAL STORAGE: Processing remaining ${totalPosts.length} posts...`);
        const newPosts = await filterDuplicates(totalPosts);
        console.log(`   🔍 ${totalPosts.length} total → ${newPosts.length} new`);

        if (newPosts.length > 0) {
            const stored = await storePosts(newPosts);
            totalStored += stored;

            const vectorized = await vectorizeHighQualityPosts(newPosts);
            totalVectorized += vectorized;
        }
    }

    console.log('\n🎉🎉🎉 ULTRA MEGA SCRAPE COMPLETE 🎉🎉🎉');
    console.log(`📊 Total Stats:`);
    console.log(`   - Posts Stored: ${totalStored}`);
    console.log(`   - Posts Vectorized: ${totalVectorized}`);
    console.log(`   - Chatbot knowledge greatly expanded!`);
}

// Run it!
ultraMegaScrape().catch(console.error);
