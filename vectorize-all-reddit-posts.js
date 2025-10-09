/**
 * Vectorize all unvectorized Reddit posts for RAG system
 */

require('dotenv').config();
const { generateEmbedding } = require('./server/services/embeddings');
const SupabaseManager = require('./server/supabase-config');

async function vectorizeAllPosts() {
    console.log('🔍 Finding unvectorized Reddit posts...\n');

    const supabase = new SupabaseManager();

    // Get all posts that aren't in the RAG table yet
    const { data: allPosts, error: postsError } = await supabase.supabase
        .from('reddit_posts')
        .select('reddit_id, title, body, flair, score, url, created_at')
        .order('score', { ascending: false });

    if (postsError) {
        console.error('❌ Error fetching posts:', postsError.message);
        process.exit(1);
    }

    // Get already vectorized post IDs
    const { data: vectorized, error: ragError } = await supabase.supabase
        .from('reddit_rag_content')
        .select('reddit_id');

    if (ragError) {
        console.error('❌ Error fetching vectorized posts:', ragError.message);
        process.exit(1);
    }

    const vectorizedIds = new Set(vectorized.map(v => v.reddit_id));

    // Filter to only unvectorized posts
    const unvectorizedPosts = allPosts.filter(post => !vectorizedIds.has(post.reddit_id));

    // Filter high-quality posts (exclude memes, prioritize guides/discussions)
    const qualityPosts = unvectorizedPosts.filter(post => {
        const isMeme = post.flair && (post.flair.toLowerCase().includes('meme') || post.flair.toLowerCase().includes('humor'));
        const hasContent = post.body && post.body.length > 50;
        const isHighEngagement = post.score > 5 || hasContent;
        const isGuideOrStrategy = post.flair && ['Guide', 'Strategy', 'Discussion', 'Help', 'Question'].includes(post.flair);

        return !isMeme && (isHighEngagement || isGuideOrStrategy);
    });

    console.log(`📊 Stats:`);
    console.log(`   Total posts: ${allPosts.length}`);
    console.log(`   Already vectorized: ${vectorizedIds.size}`);
    console.log(`   Unvectorized: ${unvectorizedPosts.length}`);
    console.log(`   High-quality to vectorize: ${qualityPosts.length}\n`);

    if (qualityPosts.length === 0) {
        console.log('✅ All high-quality posts are already vectorized!');
        process.exit(0);
    }

    // Vectorize in batches to avoid rate limits
    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < qualityPosts.length; i += batchSize) {
        const batch = qualityPosts.slice(i, i + batchSize);

        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(qualityPosts.length / batchSize)} (${batch.length} posts)...`);

        for (const post of batch) {
            try {
                // Create content for embedding
                const content = `Title: ${post.title}\n\nBody: ${post.body || 'No content'}\n\nFlair: ${post.flair || 'None'}`;

                // Generate embedding
                const embedding = await generateEmbedding(content);

                // Store in RAG table
                const { error } = await supabase.supabase
                    .from('reddit_rag_content')
                    .upsert({
                        reddit_id: post.reddit_id,
                        title: post.title,
                        content: content,
                        flair: post.flair,
                        score: post.score,
                        url: post.url,
                        embedding: embedding,
                        created_at: post.created_at,
                        indexed_at: new Date().toISOString()
                    }, { onConflict: 'reddit_id' });

                if (error) {
                    console.error(`   ❌ Error vectorizing ${post.reddit_id}:`, error.message);
                } else {
                    processed++;
                    if (processed % 10 === 0) {
                        console.log(`   ✅ Vectorized ${processed}/${qualityPosts.length} posts...`);
                    }
                }

                // Rate limit: 500ms between requests (120 requests/min, well under OpenAI's limit)
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`   ❌ Failed to vectorize post ${post.reddit_id}:`, error.message);
            }
        }

        // Longer pause between batches
        if (i + batchSize < qualityPosts.length) {
            console.log(`   ⏸️  Pausing 5 seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log(`\n🎉 Vectorization complete!`);
    console.log(`   Successfully vectorized: ${processed}/${qualityPosts.length} posts`);
    console.log(`   Chatbot knowledge greatly expanded!\n`);

    process.exit(0);
}

vectorizeAllPosts().catch(error => {
    console.error('❌ Vectorization failed:', error);
    process.exit(1);
});
