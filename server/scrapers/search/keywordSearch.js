// Keyword search functionality for Tower Wiki scraper
// Handles traditional keyword-based search with category filtering

class KeywordSearch {
    /**
     * Perform keyword-based search with advanced filtering options
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with relevance scores
     */
    search(query, chunks, options = {}) {
        if (!chunks || chunks.length === 0) {
            console.log('❌ No searchable data available for keyword search.');
            return [];
        }

        // Parse options with defaults
        const {
            limit = 10,
            categories = [],        // Filter by specific categories
            contentType = 'all',    // 'content', 'table', 'infobox', 'all'
            minScore = 0,          // Minimum relevance score
            sortBy = 'relevance'   // 'relevance', 'title', 'length'
        } = options;

        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        const results = [];

        for (const chunk of chunks) {
            // Apply content type filter
            if (contentType !== 'all' && chunk.type !== contentType) {
                continue;
            }

            // Apply category filter
            if (categories.length > 0) {
                const hasMatchingCategory = categories.some(filterCat =>
                    chunk.categories.some(chunkCat =>
                        chunkCat.toLowerCase().includes(filterCat.toLowerCase())
                    )
                );
                if (!hasMatchingCategory) {
                    continue;
                }
            }

            const score = this.calculateRelevanceScore(chunk, query, queryTerms);

            // Apply minimum score filter
            if (score >= minScore) {
                results.push({
                    ...chunk,
                    relevanceScore: score,
                    preview: this.createPreview(chunk.content, queryTerms)
                });
            }
        }

        // Sort results based on chosen method
        const sortedResults = this.sortSearchResults(results, sortBy);

        return sortedResults.slice(0, limit);
    }

    /**
     * Calculate relevance score for a chunk based on query terms
     * @param {Object} chunk - Searchable chunk
     * @param {string} query - Original search query
     * @param {Array<string>} queryTerms - Array of query terms
     * @returns {number} Relevance score
     */
    calculateRelevanceScore(chunk, query, queryTerms) {
        let score = 0;
        const content = chunk.content.toLowerCase();

        // Calculate relevance score
        for (const term of queryTerms) {
            const regex = new RegExp(term, 'gi');
            const matches = (content.match(regex) || []).length;
            score += matches;

            // Boost score for title matches
            if (chunk.pageTitle.toLowerCase().includes(term)) {
                score += 5;
            }

            // Boost score for category matches
            for (const category of chunk.categories) {
                if (category.toLowerCase().includes(term)) {
                    score += 3;
                }
            }
        }

        // Boost for exact phrase matches
        if (content.includes(query.toLowerCase())) {
            score += 10;
        }

        // Boost for matches in table headers (if applicable)
        if (chunk.type === 'table' && chunk.headers) {
            for (const header of chunk.headers) {
                for (const term of queryTerms) {
                    if (header.toLowerCase().includes(term)) {
                        score += 2;
                    }
                }
            }
        }

        return score;
    }

    /**
     * Sort search results by different criteria
     * @param {Array} results - Array of search results
     * @param {string} sortBy - Sort method ('relevance', 'title', 'length')
     * @returns {Array} Sorted results
     */
    sortSearchResults(results, sortBy) {
        switch (sortBy) {
            case 'title':
                return results.sort((a, b) => a.pageTitle.localeCompare(b.pageTitle));
            case 'length':
                return results.sort((a, b) => b.content.length - a.content.length);
            case 'relevance':
            default:
                return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
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
     * Simple search method for backward compatibility
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {number} limit - Maximum number of results
     * @returns {Array} Array of search results
     */
    simpleSearch(query, chunks, limit = 10) {
        return this.search(query, chunks, { limit });
    }

    /**
     * Search with category filtering
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Array<string>} categories - Categories to filter by
     * @param {Object} options - Additional search options
     * @returns {Array} Array of filtered search results
     */
    searchByCategory(query, chunks, categories, options = {}) {
        return this.search(query, chunks, { ...options, categories });
    }

    /**
     * Search only in specific content types
     * @param {string} query - Search query
     * @param {Array} chunks - Array of searchable chunks
     * @param {string} contentType - Content type to search ('content', 'table', 'infobox')
     * @param {Object} options - Additional search options
     * @returns {Array} Array of filtered search results
     */
    searchByType(query, chunks, contentType, options = {}) {
        return this.search(query, chunks, { ...options, contentType });
    }

    /**
     * Get search suggestions based on query
     * @param {string} query - Partial query
     * @param {Array} chunks - Array of searchable chunks
     * @param {Object} options - Search options
     * @returns {Array<string>} Array of search suggestions
     */
    getSuggestions(query, chunks, options = {}) {
        const { limit = 10 } = options;
        const suggestions = new Set();
        const queryLower = query.toLowerCase();

        // Look for matching terms in titles and content
        for (const chunk of chunks) {
            const title = chunk.pageTitle.toLowerCase();

            // Add title suggestions
            if (title.includes(queryLower)) {
                suggestions.add(chunk.pageTitle);
            }

            // Add category suggestions
            for (const category of chunk.categories) {
                if (category.toLowerCase().includes(queryLower)) {
                    suggestions.add(category);
                }
            }

            // Add term suggestions from content
            const words = chunk.content.toLowerCase().split(/\s+/);
            for (const word of words) {
                if (word.length > 3 && word.startsWith(queryLower)) {
                    suggestions.add(word);
                }
            }
        }

        return Array.from(suggestions)
            .sort()
            .slice(0, limit);
    }
}

module.exports = KeywordSearch;