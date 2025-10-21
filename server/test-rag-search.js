/**
 * Test the RAG search to see what's being returned
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateEmbedding } = require('./services/embeddings');

async function testRAGSearch() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    const question = "what are the most upvoted posts from last week";

    console.log(`🔍 Testing RAG search for: "${question}"\n`);

    // Generate embedding
    const queryEmbedding = await generateEmbedding(question);
    console.log('✅ Generated query embedding');

    // Call the semantic search function
    const { data, error } = await supabase
        .rpc('search_reddit_rag_semantic', {
            query_embedding: queryEmbedding,
            match_threshold: 0.2,
            match_count: 15
        });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`\n✅ Found ${data.length} results from vector search\n`);

    if (data.length > 0) {
        console.log('First 10 results:');
        data.slice(0, 10).forEach((result, i) => {
            const date = new Date(result.created_at);
            const daysAgo = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
            console.log(`${i + 1}. ${result.title.substring(0, 50)} | ${result.score} ⬆️ | ${date.toISOString().split('T')[0]} (${daysAgo} days ago) | similarity: ${(result.similarity * 100).toFixed(0)}%`);
        });

        // Apply time filtering (last 7 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const filtered = data.filter(post => {
            const postDate = new Date(post.created_at);
            return postDate >= cutoffDate;
        });

        console.log(`\n📅 After filtering for last 7 days:`);
        console.log(`   Before: ${data.length} posts`);
        console.log(`   After: ${filtered.length} posts`);
        console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);

        if (filtered.length > 0) {
            console.log(`\n   Filtered results:`);
            filtered.forEach((result, i) => {
                console.log(`   ${i + 1}. ${result.title.substring(0, 50)} | ${result.score} ⬆️ | ${result.created_at}`);
            });
        }
    }
}

testRAGSearch();
