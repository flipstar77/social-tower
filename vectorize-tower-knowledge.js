/**
 * Vectorize Tower mechanics knowledge document into RAG system
 */

require('dotenv').config();
const fs = require('fs');
const { generateEmbedding } = require('./server/services/embeddings');
const SupabaseManager = require('./server/supabase-config');

async function vectorizeKnowledge() {
    console.log('📚 Vectorizing Tower Game mechanics knowledge...\n');

    // Initialize Supabase
    const supabase = new SupabaseManager();

    // Read the knowledge document
    const knowledgeDoc = fs.readFileSync('./tower-mechanics-knowledge.md', 'utf8');

    // Split into sections for better retrieval
    const sections = knowledgeDoc.split('## ').filter(s => s.trim());

    console.log(`📄 Found ${sections.length} knowledge sections to vectorize\n`);

    for (let i = 0; i < sections.length; i++) {
        const section = '## ' + sections[i];
        const title = section.split('\n')[0].replace('## ', '').trim();

        console.log(`[${i + 1}/${sections.length}] Vectorizing: ${title}...`);

        try {
            // Generate embedding
            const embedding = await generateEmbedding(section);

            // Store in reddit_rag_content table (reusing for game mechanics)
            const { error } = await supabase.supabase
                .from('reddit_rag_content')
                .upsert({
                    reddit_id: `tower_mechanics_${i}`,
                    title: `Tower Mechanics: ${title}`,
                    content: section,
                    flair: 'Game Mechanics',
                    score: 999, // High score to prioritize in search
                    url: 'https://thetower.lol/mechanics',
                    embedding: embedding,
                    created_at: new Date().toISOString(),
                    indexed_at: new Date().toISOString()
                }, { onConflict: 'reddit_id' });

            if (error) {
                console.error(`   ❌ Error: ${error.message}`);
            } else {
                console.log(`   ✅ Vectorized successfully`);
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        }
    }

    console.log('\n🎉 Knowledge vectorization complete!');
    console.log('\nThe chatbot can now answer questions about:');
    console.log('  • Damage formulas and mechanics');
    console.log('  • Lab upgrade priorities');
    console.log('  • Crit factor vs damage optimization');
    console.log('  • SuperCrit mechanics');
    console.log('  • Time-efficiency calculations');

    process.exit(0);
}

vectorizeKnowledge().catch(error => {
    console.error('❌ Vectorization failed:', error);
    process.exit(1);
});
