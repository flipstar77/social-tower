/**
 * Vectorize Kairos UW Guide - Add to RAG system
 *
 * This script processes the kairos-guide-payload.json file and adds it
 * to the vector database for chatbot RAG with proper chunking.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fs = require('fs').promises;
const { generateEmbedding } = require('../services/embeddings');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Split Kairos guide content into semantic chunks based on steps
 */
function splitKairosGuideIntoChunks(guideData) {
    const chunks = [];
    const content = guideData.content;

    // Split by major sections (STEP 1, STEP 2, etc.)
    const stepPattern = /STEP \d+ - [^:]+:/g;
    const matches = [...content.matchAll(stepPattern)];

    // Add intro chunk (everything before first STEP)
    const firstStepIndex = matches[0]?.index || content.length;
    const intro = content.substring(0, firstStepIndex).trim();

    if (intro.length > 100) {
        chunks.push({
            title: 'Kairos UW Guide - Introduction',
            content: intro,
            section: 'Introduction'
        });
    }

    // Add each STEP as a separate chunk
    for (let i = 0; i < matches.length; i++) {
        const stepMatch = matches[i];
        const stepTitle = stepMatch[0].replace(':', '').trim();
        const stepStart = stepMatch.index;
        const stepEnd = matches[i + 1]?.index || content.length;
        const stepContent = content.substring(stepStart, stepEnd).trim();

        chunks.push({
            title: `Kairos UW Guide - ${stepTitle}`,
            content: stepContent,
            section: stepTitle
        });
    }

    // Also add key concept chunks for better retrieval
    const keyConcepts = [
        {
            title: 'Unlock Order & Sync Concept',
            pattern: /UNLOCK ORDER:.*?CRITICAL: Don't upgrade cooldowns/s,
            section: 'Core Concepts'
        },
        {
            title: 'Lab Priorities',
            pattern: /LAB PRIORITY:.*?(?=STEP|$)/s,
            section: 'Labs'
        },
        {
            title: 'Card Masteries',
            pattern: /CARD MASTERIES.*?(?=4TH SPOTLIGHT|$)/s,
            section: 'Masteries'
        },
        {
            title: 'Permanent Black Hole',
            pattern: /PERMANENT BH.*?(?=CARD MASTERIES|$)/s,
            section: 'Endgame'
        }
    ];

    for (const concept of keyConcepts) {
        const match = content.match(concept.pattern);
        if (match) {
            chunks.push({
                title: `Kairos UW Guide - ${concept.title}`,
                content: match[0].trim(),
                section: concept.section
            });
        }
    }

    return chunks;
}

/**
 * Vectorize Kairos guide and store chunks in database
 */
async function vectorizeKairosGuide() {
    console.log('\n📄 Processing Kairos UW Guide...');

    try {
        // Read the JSON payload
        const filePath = path.join(__dirname, '../../kairos-guide-payload.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const guideData = JSON.parse(fileContent);

        console.log(`   📝 Document title: ${guideData.title}`);
        console.log(`   👤 Author: ${guideData.author}`);
        console.log(`   📏 Content length: ${guideData.content.length} characters`);

        // Split into semantic chunks
        const chunks = splitKairosGuideIntoChunks(guideData);
        console.log(`   ✂️  Split into ${chunks.length} chunks`);

        // Process chunks in batches
        const batchSize = 5;
        let successCount = 0;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            // Process batch in parallel
            await Promise.all(batch.map(async (chunk, batchIndex) => {
                const chunkIndex = i + batchIndex;

                try {
                    // Generate embedding
                    const embedding = await generateEmbedding(chunk.content);

                    // Store in vector table
                    const { error } = await supabase
                        .from('game_knowledge_base')
                        .upsert({
                            doc_type: 'uw_guide',
                            doc_title: guideData.title,
                            section_title: chunk.title,
                            content: chunk.content,
                            embedding: embedding,
                            chunk_index: chunkIndex,
                            total_chunks: chunks.length,
                            indexed_at: new Date().toISOString()
                        }, {
                            onConflict: 'doc_type,doc_title,chunk_index'
                        });

                    if (error) {
                        console.error(`   ❌ Error storing chunk ${chunkIndex}:`, error.message);
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    console.error(`   ❌ Error processing chunk ${chunkIndex}:`, err.message);
                }
            }));

            console.log(`   ✅ Processed ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);

            // Rate limit pause between batches
            if (i + batchSize < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`   🎉 Successfully vectorized ${successCount}/${chunks.length} chunks`);
        return { success: true, chunks: successCount };

    } catch (error) {
        console.error(`   ❌ Failed to process guide:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Starting Kairos UW Guide Vectorization\n');
    console.log('This will add Kairos\'s comprehensive UW guide to the chatbot\'s knowledge base.');
    console.log('The chatbot will then be able to answer questions about UW strategy!\n');
    console.log('='.repeat(80));

    const result = await vectorizeKairosGuide();

    console.log('\n' + '='.repeat(80));
    console.log('📊 VECTORIZATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    if (result.success) {
        console.log(`✅ Kairos UW Guide: ${result.chunks} chunks added`);
        console.log('\n✨ The chatbot can now answer questions from Kairos\'s guide!');
        console.log('   Try asking: "According to Kairos, what should be my first big save?"');
        console.log('   Or: "What is the UW unlock order?"');
        console.log('   Or: "How do I sync GT and BH?"\n');
    } else {
        console.log(`❌ Failed to vectorize guide: ${result.error}\n`);
    }
}

// Run the script
main().catch(console.error);
