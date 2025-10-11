/**
 * Embeddings Service - Generate vector embeddings using OpenAI
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text) {
    try {
        if (!text || !text.trim()) {
            throw new Error('Text is required for embedding generation');
        }

        const response = await fetch(OPENAI_EMBEDDINGS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: text.substring(0, 8000) // OpenAI limit
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        return data.data[0].embedding;

    } catch (error) {
        console.error('❌ Embedding generation failed:', error.message);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
async function generateEmbeddings(texts) {
    try {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Array of texts is required');
        }

        // OpenAI supports batching
        const response = await fetch(OPENAI_EMBEDDINGS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: texts.map(t => t.substring(0, 8000))
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        return data.data.map(item => item.embedding);

    } catch (error) {
        console.error('❌ Batch embedding generation failed:', error.message);
        throw error;
    }
}

/**
 * Generate embedding for search query
 * Combines title and content for better semantic search
 */
async function generateContentEmbedding(title, content) {
    const combined = `${title}\n\n${content}`;
    return generateEmbedding(combined);
}

module.exports = {
    generateEmbedding,
    generateEmbeddings,
    generateContentEmbedding
};
