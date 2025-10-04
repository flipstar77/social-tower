// Semantic search functionality for Tower Wiki scraper
// Handles TF-IDF based semantic search with cosine similarity

const SearchBuilder = require('../wiki/searchBuilder');

class SemanticSearch {
    constructor() {
        this.searchBuilder = new SearchBuilder();
        this.semanticIndex = null;
        this.termFrequency = {};
        this.documentFrequency = {};
        this.totalDocs = 0;
    }

    /**
     * Initialize semantic search with chunks
     * @param {Array} chunks - Array of searchable chunks
     */
    initialize(chunks) {
        if (!chunks || chunks.length === 0) {
            console.log('⚠️ Cannot initialize semantic search - no chunks provided');
            return;
        }

        const index = this.searchBuilder.buildSemanticIndex(chunks);
        this.termFrequency = index.termFrequency;
        this.documentFrequency = index.documentFrequency;
        this.totalDocs = index.totalDocs;
        this.semanticIndex = true;
    }

    /**
     * Perform semantic search using TF-IDF and cosine similarity
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with semantic scores
     */
    search(query, chunks, options = {}) {
        if (!this.semanticIndex) {
            console.log('🧠 Building semantic index for first-time semantic search...');
            this.initialize(chunks);
        }

        const { limit = 10, minSimilarity = 0.1 } = options;

        // Create query vector
        const queryTerms = this.searchBuilder.extractTerms(query);
        const queryVector = {};

        for (const term of queryTerms) {
            const tf = queryTerms.filter(t => t === term).length / queryTerms.length;
            const idf = Math.log(this.totalDocs / (this.documentFrequency[term] || 1));
            queryVector[term] = tf * idf;
        }

        // Calculate similarities
        const results = [];

        for (const chunk of chunks) {
            const similarity = this.cosineSimilarity(queryVector, chunk.tfidfVector || {});

            if (similarity >= minSimilarity) {
                results.push({
                    ...chunk,
                    semanticScore: similarity,
                    preview: this.createPreview(chunk.content, queryTerms)
                });
            }
        }

        // Sort by semantic similarity
        return results
            .sort((a, b) => b.semanticScore - a.semanticScore)
            .slice(0, limit);
    }

    /**
     * Calculate cosine similarity between two TF-IDF vectors
     * @param {Object} vectorA - First TF-IDF vector
     * @param {Object} vectorB - Second TF-IDF vector
     * @returns {number} Cosine similarity score between 0 and 1
     */
    cosineSimilarity(vectorA, vectorB) {
        const keysA = Object.keys(vectorA);
        const keysB = Object.keys(vectorB);
        const allKeys = new Set([...keysA, ...keysB]);

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (const key of allKeys) {
            const valueA = vectorA[key] || 0;
            const valueB = vectorB[key] || 0;

            dotProduct += valueA * valueB;
            normA += valueA * valueA;
            normB += valueB * valueB;
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Create preview text with highlighted terms
     * @param {string} content - Content to create preview from
     * @param {Array<string>} queryTerms - Query terms to highlight
     * @param {number} maxLength - Maximum length of preview
     * @returns {string} Preview text
     */
    createPreview(content, queryTerms, maxLength = 200) {
        // Find best section that contains query terms
        let bestStart = 0;
        let bestScore = 0;

        for (let i = 0; i < content.length - maxLength; i += 50) {
            const section = content.slice(i, i + maxLength).toLowerCase();
            let score = 0;

            for (const term of queryTerms) {
                score += (section.match(new RegExp(term, 'g')) || []).length;
            }

            if (score > bestScore) {
                bestScore = score;
                bestStart = i;
            }
        }

        let preview = content.slice(bestStart, bestStart + maxLength);

        // Add ellipsis if truncated
        if (bestStart > 0) preview = '...' + preview;
        if (bestStart + maxLength < content.length) preview = preview + '...';

        return preview.trim();
    }

    /**
     * Get semantic search statistics
     * @returns {Object} Statistics about the semantic index
     */
    getStats() {
        return {
            isInitialized: !!this.semanticIndex,
            totalTerms: Object.keys(this.termFrequency).length,
            totalDocuments: this.totalDocs,
            avgTermsPerDoc: this.totalDocs > 0 ?
                Object.values(this.termFrequency).reduce((sum, freq) => sum + freq, 0) / this.totalDocs : 0
        };
    }

    /**
     * Find similar documents to a given chunk
     * @param {Object} targetChunk - Chunk to find similar documents for
     * @param {Array} chunks - Array of all chunks to search in
     * @param {Object} options - Search options
     * @returns {Array} Array of similar chunks
     */
    findSimilar(targetChunk, chunks, options = {}) {
        if (!this.semanticIndex) {
            this.initialize(chunks);
        }

        const { limit = 5, minSimilarity = 0.1 } = options;
        const results = [];

        for (const chunk of chunks) {
            // Skip the target chunk itself
            if (chunk.id === targetChunk.id) continue;

            const similarity = this.cosineSimilarity(
                targetChunk.tfidfVector || {},
                chunk.tfidfVector || {}
            );

            if (similarity >= minSimilarity) {
                results.push({
                    ...chunk,
                    semanticScore: similarity
                });
            }
        }

        return results
            .sort((a, b) => b.semanticScore - a.semanticScore)
            .slice(0, limit);
    }
}

module.exports = SemanticSearch;