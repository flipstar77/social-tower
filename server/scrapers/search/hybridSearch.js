// Hybrid search functionality for Tower Wiki scraper
// Combines keyword and semantic search for enhanced results

const KeywordSearch = require('./keywordSearch');
const SemanticSearch = require('./semanticSearch');

class HybridSearch {
    constructor() {
        this.keywordSearch = new KeywordSearch();
        this.semanticSearch = new SemanticSearch();
    }

    /**
     * Initialize hybrid search with chunks (primarily for semantic search)
     * @param {Array} chunks - Array of searchable chunks
     */
    initialize(chunks) {
        this.semanticSearch.initialize(chunks);
    }

    /**
     * Perform hybrid search combining keyword and semantic search
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with combined scores
     */
    search(query, chunks, options = {}) {
        const {
            limit = 10,
            semanticWeight = 0.3,  // Weight for semantic vs keyword scores (0-1)
            semanticEnabled = true, // Enable/disable semantic search component
            ...searchOptions
        } = options;

        // Get keyword search results
        const keywordResults = this.keywordSearch.search(query, chunks, {
            ...searchOptions,
            limit: limit * 2  // Get more results for better combination
        });

        // Get semantic search results if enabled
        let semanticResults = [];
        if (semanticEnabled) {
            try {
                semanticResults = this.semanticSearch.search(query, chunks, {
                    limit: limit * 2
                });
            } catch (error) {
                console.warn('⚠️ Semantic search failed, using keyword search only:', error.message);
                return keywordResults.slice(0, limit);
            }
        }

        // If semantic search is disabled or failed, return keyword results
        if (!semanticEnabled || semanticResults.length === 0) {
            return keywordResults.slice(0, limit);
        }

        // Combine and rerank results
        const combinedResults = this.combineResults(
            keywordResults,
            semanticResults,
            semanticWeight
        );

        return combinedResults.slice(0, limit);
    }

    /**
     * Combine keyword and semantic search results
     * @param {Array} keywordResults - Results from keyword search
     * @param {Array} semanticResults - Results from semantic search
     * @param {number} semanticWeight - Weight for semantic scores (0-1)
     * @returns {Array} Combined and reranked results
     */
    combineResults(keywordResults, semanticResults, semanticWeight = 0.3) {
        const combinedResults = new Map();

        // Add keyword results
        for (const result of keywordResults) {
            combinedResults.set(result.id, {
                ...result,
                keywordScore: result.relevanceScore || 0,
                semanticScore: 0,
                hybridScore: result.relevanceScore || 0
            });
        }

        // Add/merge semantic results
        for (const result of semanticResults) {
            if (combinedResults.has(result.id)) {
                const existing = combinedResults.get(result.id);
                existing.semanticScore = result.semanticScore || 0;
                existing.hybridScore = this.calculateHybridScore(
                    existing.keywordScore,
                    result.semanticScore,
                    semanticWeight
                );
            } else {
                combinedResults.set(result.id, {
                    ...result,
                    keywordScore: 0,
                    semanticScore: result.semanticScore || 0,
                    hybridScore: this.calculateHybridScore(
                        0,
                        result.semanticScore,
                        semanticWeight
                    )
                });
            }
        }

        // Sort by hybrid score and return
        return Array.from(combinedResults.values())
            .sort((a, b) => b.hybridScore - a.hybridScore);
    }

    /**
     * Calculate hybrid score from keyword and semantic scores
     * @param {number} keywordScore - Keyword search score
     * @param {number} semanticScore - Semantic search score
     * @param {number} semanticWeight - Weight for semantic score (0-1)
     * @returns {number} Combined hybrid score
     */
    calculateHybridScore(keywordScore, semanticScore, semanticWeight) {
        // Normalize and combine scores
        const normalizedKeyword = keywordScore || 0;
        const normalizedSemantic = (semanticScore || 0) * 100; // Scale semantic score

        return (1 - semanticWeight) * normalizedKeyword + semanticWeight * normalizedSemantic;
    }

    /**
     * Search with automatic weight adjustment based on query characteristics
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with adjusted weights
     */
    adaptiveSearch(query, chunks, options = {}) {
        const semanticWeight = this.calculateOptimalSemanticWeight(query);

        return this.search(query, chunks, {
            ...options,
            semanticWeight
        });
    }

    /**
     * Calculate optimal semantic weight based on query characteristics
     * @param {string} query - Search query
     * @returns {number} Optimal semantic weight (0-1)
     */
    calculateOptimalSemanticWeight(query) {
        const words = query.trim().split(/\s+/);

        // More semantic weight for longer, more conceptual queries
        if (words.length >= 4) return 0.5;
        if (words.length === 3) return 0.4;
        if (words.length === 2) return 0.3;

        // Less semantic weight for single words or short queries
        return 0.2;
    }

    /**
     * Search with boosted results for specific content types
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Array<string>} boostedTypes - Content types to boost ['table', 'infobox', 'content']
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with type boosting
     */
    searchWithTypeBoost(query, chunks, boostedTypes = [], options = {}) {
        const results = this.search(query, chunks, options);

        // Apply type boosting
        return results.map(result => {
            if (boostedTypes.includes(result.type)) {
                return {
                    ...result,
                    hybridScore: result.hybridScore * 1.2, // 20% boost
                    boosted: true
                };
            }
            return result;
        }).sort((a, b) => b.hybridScore - a.hybridScore);
    }

    /**
     * Find related content using hybrid search
     * @param {Object} targetChunk - Chunk to find related content for
     * @param {Array} chunks - Array of all chunks
     * @param {Object} options - Search options
     * @returns {Array} Array of related chunks
     */
    findRelated(targetChunk, chunks, options = {}) {
        const { limit = 5 } = options;

        // Use the target chunk's content as the search query
        const query = targetChunk.content.substring(0, 200); // First 200 chars as query

        const results = this.search(query, chunks, {
            ...options,
            limit: limit + 1, // Get one extra to filter out self
            semanticWeight: 0.7 // Higher semantic weight for finding related content
        });

        // Filter out the target chunk itself
        return results.filter(result => result.id !== targetChunk.id).slice(0, limit);
    }

    /**
     * Get search statistics
     * @returns {Object} Statistics about search capabilities
     */
    getStats() {
        const semanticStats = this.semanticSearch.getStats();

        return {
            keywordSearchAvailable: true,
            semanticSearchAvailable: semanticStats.isInitialized,
            hybridSearchAvailable: semanticStats.isInitialized,
            semanticIndexStats: semanticStats
        };
    }

    /**
     * Test search performance with different configurations
     * @param {string} query - Test query
     * @param {Array} chunks - Array of searchable chunks
     * @returns {Object} Performance comparison results
     */
    performanceTest(query, chunks) {
        const startTime = Date.now();

        const keywordResults = this.keywordSearch.search(query, chunks, { limit: 10 });
        const keywordTime = Date.now() - startTime;

        const semanticStartTime = Date.now();
        const semanticResults = this.semanticSearch.search(query, chunks, { limit: 10 });
        const semanticTime = Date.now() - semanticStartTime;

        const hybridStartTime = Date.now();
        const hybridResults = this.search(query, chunks, { limit: 10 });
        const hybridTime = Date.now() - hybridStartTime;

        return {
            query,
            keyword: {
                results: keywordResults.length,
                timeMs: keywordTime
            },
            semantic: {
                results: semanticResults.length,
                timeMs: semanticTime
            },
            hybrid: {
                results: hybridResults.length,
                timeMs: hybridTime
            }
        };
    }
}

module.exports = HybridSearch;