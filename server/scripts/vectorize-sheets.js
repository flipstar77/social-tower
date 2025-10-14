/**
 * Vectorize Sheet Documentation - Add game guides to RAG system
 *
 * This script processes the complete-labs-guide.md, tobi-calculator-guide.md,
 * and modules-guide.md files and adds them to the vector database for chatbot RAG.
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
 * Split markdown into semantic chunks
 * - Each section (## or ### header) becomes a separate chunk for better retrieval
 * - Maintains context by including the main title
 * - Filters out tiny chunks (< 100 chars)
 */
function splitMarkdownIntoChunks(content, docTitle) {
    const chunks = [];
    // Remove Windows line endings before splitting
    const lines = content.replace(/\r/g, '').split('\n');

    let currentChunk = {
        title: '',
        content: '',
        level: 0
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect markdown headers (## or ### - split on both for better granularity)
        const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);

        if (headerMatch) {
            const headerLevel = headerMatch[1].length;
            const headerText = headerMatch[2];

            // Save previous chunk if it has substantial content OR if it's a lab entry (has a table)
            const hasTable = currentChunk.content.includes('| Level | Duration | Cost | Gems |');
            const isSubstantial = currentChunk.content.length > 100;

            if (currentChunk.content.trim() && (isSubstantial || hasTable)) {
                chunks.push({
                    title: currentChunk.title || docTitle,
                    content: currentChunk.content.trim(),
                    level: currentChunk.level,
                    docTitle: docTitle
                });
            }

            // Start new chunk
            currentChunk = {
                title: headerText,
                content: `# ${docTitle}\n\n${headerMatch[0]}\n\n`,
                level: headerLevel
            };
        } else {
            // Add line to current chunk
            currentChunk.content += line + '\n';
        }
    }

    // Add final chunk (if substantial or has table)
    const hasTable = currentChunk.content.includes('| Level | Duration | Cost | Gems |');
    const isSubstantial = currentChunk.content.length > 100;

    if (currentChunk.content.trim() && (isSubstantial || hasTable)) {
        chunks.push({
            title: currentChunk.title || docTitle,
            content: currentChunk.content.trim(),
            level: currentChunk.level,
            docTitle: docTitle
        });
    }

    return chunks;
}

/**
 * Vectorize a document and store chunks in database
 */
async function vectorizeDocument(filePath, docType) {
    console.log(`\n📄 Processing ${path.basename(filePath)}...`);

    try {
        // Read the markdown file
        const content = await fs.readFile(filePath, 'utf-8');
        const docTitle = path.basename(filePath, '.md').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        console.log(`   📝 Document title: ${docTitle}`);
        console.log(`   📏 Total length: ${content.length} characters`);

        // Split into semantic chunks
        const chunks = splitMarkdownIntoChunks(content, docTitle);
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
                            doc_type: docType,
                            doc_title: docTitle,
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
        console.error(`   ❌ Failed to process document:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main function - Process all sheet documentation
 */
async function main() {
    console.log('🚀 Starting Sheet Documentation Vectorization\n');
    console.log('This will add comprehensive game guides to the chatbot\'s knowledge base.');
    console.log('The chatbot will then be able to answer questions from the sheets!\n');

    const docs = [
        {
            path: path.join(__dirname, '../../complete-labs-guide.md'),
            type: 'labs_guide',
            description: 'Lab Research Guide (137 labs with durations, costs, strategies)'
        },
        {
            path: path.join(__dirname, '../../tobi-calculator-guide.md'),
            type: 'calculator_guide',
            description: 'Tobi Calculator System (RoI calculations, optimization strategies)'
        },
        {
            path: path.join(__dirname, '../../modules-guide.md'),
            type: 'modules_guide',
            description: 'Modules Guide (types, rarities, substats, scaling)'
        }
    ];

    const results = [];

    for (const doc of docs) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📚 ${doc.description}`);
        console.log(`${'='.repeat(80)}`);

        // Check if file exists
        try {
            await fs.access(doc.path);
        } catch (err) {
            console.log(`   ⚠️  File not found, skipping: ${doc.path}`);
            continue;
        }

        const result = await vectorizeDocument(doc.path, doc.type);
        results.push({ ...doc, result });

        // Pause between documents
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 VECTORIZATION SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    let totalChunks = 0;
    for (const { description, result } of results) {
        const status = result.success ? '✅' : '❌';
        const chunks = result.chunks || 0;
        totalChunks += chunks;
        console.log(`${status} ${description}: ${chunks} chunks`);
    }

    console.log(`\n🎯 Total: ${totalChunks} knowledge chunks added to RAG system`);
    console.log('\n✨ The chatbot can now answer questions from the sheet data!');
    console.log('   Try asking: "How long does Lab Coin Discount take?"');
    console.log('   Or: "What modules should I use for pushing?"');
    console.log('   Or: "How do I calculate RoI for lab upgrades?"\n');
}

// Run the script
main().catch(console.error);
