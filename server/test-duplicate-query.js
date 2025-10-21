/**
 * Test script to debug the duplicate detection query
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testQuery() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    // These are the IDs from the latest scrape that should NOT be in the DB
    const testIds = ['1o9qity', '1o9qc4q', '1o9q9wf', '1hiufd4', '1lfswsk', '1j2bzrm', '1n98uhg', '1llubot'];

    console.log('🔍 Testing duplicate detection query with IDs:',  testIds);

    // Run the same query as the scraper
    const { data: existingPosts, error } = await supabase
        .from('reddit_posts')
        .select('reddit_id')
        .in('reddit_id', testIds);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`✅ Query returned ${existingPosts.length} posts`);
    console.log('📋 Returned IDs:', existingPosts.map(p => p.reddit_id));

    // Check which of our test IDs were found
    const foundIds = existingPosts.map(p => p.reddit_id);
    const missingIds = testIds.filter(id => !foundIds.includes(id));

    console.log(`\n✅ Found in DB: ${foundIds.length} posts`);
    console.log(`❌ Not found in DB: ${missingIds.length} posts`);
    console.log('Missing IDs:', missingIds);
}

testQuery();
