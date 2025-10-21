require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkStats() {
    console.log('📊 Checking Reddit Database Stats...\n');

    // Total posts
    const { count: totalPosts, error: postsError } = await supabase
        .from('reddit_posts')
        .select('*', { count: 'exact', head: true });

    if (postsError) {
        console.error('❌ Error counting posts:', postsError);
    } else {
        console.log(`📝 Total Reddit Posts: ${totalPosts}`);
    }

    // Total vectorized
    const { count: totalVectorized, error: vectorError } = await supabase
        .from('reddit_rag_content')
        .select('*', { count: 'exact', head: true });

    if (vectorError) {
        console.error('❌ Error counting vectorized:', vectorError);
    } else {
        console.log(`🔢 Total Vectorized: ${totalVectorized}`);
    }

    // Recent posts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentPosts, error: recentError } = await supabase
        .from('reddit_posts')
        .select('created_at, title, upVotes')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

    if (recentError) {
        console.error('❌ Error fetching recent posts:', recentError);
    } else {
        console.log(`\n📅 Recent Posts (last 30 days): ${recentPosts.length}`);
        recentPosts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            console.log(`   ${date} - ${post.title.substring(0, 60)}... (${post.upVotes} upvotes)`);
        });
    }
}

checkStats();
