/**
 * Check if the new posts are actually in the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkNewPosts() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    console.log('🔍 Checking for posts from today (Oct 18, 2025)...\n');

    // Check reddit_posts table
    const { data: recentPosts, error: postsError } = await supabase
        .from('reddit_posts')
        .select('reddit_id, title, created_at, score')
        .gte('created_at', '2025-10-18T00:00:00Z')
        .order('created_at', { ascending: false })
        .limit(20);

    if (postsError) {
        console.error('❌ Error querying reddit_posts:', postsError.message);
    } else {
        console.log(`✅ Found ${recentPosts.length} posts in reddit_posts table from Oct 18:`);
        recentPosts.forEach(p => {
            console.log(`  ${p.reddit_id} | ${p.score} ⬆️ | ${p.created_at} | ${p.title.substring(0, 50)}`);
        });
    }

    console.log('\n🔍 Checking reddit_rag_content table...\n');

    // Check reddit_rag_content table (the one used by RAG)
    const { data: ragPosts, error: ragError } = await supabase
        .from('reddit_rag_content')
        .select('reddit_id, title, created_at, score')
        .gte('created_at', '2025-10-18T00:00:00Z')
        .order('created_at', { ascending: false })
        .limit(20);

    if (ragError) {
        console.error('❌ Error querying reddit_rag_content:', ragError.message);
    } else {
        console.log(`✅ Found ${ragPosts.length} posts in reddit_rag_content table from Oct 18:`);
        ragPosts.forEach(p => {
            console.log(`  ${p.reddit_id} | ${p.score} ⬆️ | ${p.created_at} | ${p.title.substring(0, 50)}`);
        });
    }

    // Check for specific IDs we know should be there
    console.log('\n🔍 Checking for specific IDs we scraped (1o9qity, 1o9qc4q, 1o9qpkv)...\n');

    const testIds = ['1o9qity', '1o9qc4q', '1o9qpkv'];

    for (const id of testIds) {
        const { data: postData, error: postError } = await supabase
            .from('reddit_posts')
            .select('*')
            .eq('reddit_id', id)
            .single();

        const { data: ragData, error: ragCheckError } = await supabase
            .from('reddit_rag_content')
            .select('*')
            .eq('reddit_id', id)
            .single();

        console.log(`Post ${id}:`);
        console.log(`  reddit_posts: ${postData ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log(`  reddit_rag_content: ${ragData ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    }

    // Check total count in both tables
    console.log('\n📊 Total posts in database:\n');

    const { count: postsCount } = await supabase
        .from('reddit_posts')
        .select('*', { count: 'exact', head: true });

    const { count: ragCount } = await supabase
        .from('reddit_rag_content')
        .select('*', { count: 'exact', head: true });

    console.log(`  reddit_posts: ${postsCount} total posts`);
    console.log(`  reddit_rag_content: ${ragCount} total posts`);
}

checkNewPosts();
