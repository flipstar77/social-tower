// Search index builder for Tower Wiki scraper
// Handles creating searchable chunks and building semantic indices

class SearchBuilder {
    /**
     * Create searchable text chunks from scraped data
     * @param {Array} scrapedData - Array of scraped page data
     * @returns {Array} Array of searchable chunks
     */
    createSearchableChunks(scrapedData) {
        console.log('📝 Creating searchable chunks...');
        const chunks = [];

        for (const page of scrapedData) {
            // Split content into manageable chunks (400-600 words)
            const words = page.content.split(/\s+/).filter(word => word.length > 0);
            const chunkSize = 500;
            const overlap = 50; // Overlap between chunks to maintain context

            for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
                const chunkWords = words.slice(i, i + chunkSize);
                const chunk = chunkWords.join(' ');

                if (chunk.trim().length > 100) { // Only include substantial chunks
                    chunks.push({
                        id: `${page.title}_chunk_${Math.floor(i / (chunkSize - overlap))}`,
                        pageTitle: page.title,
                        pageUrl: page.url,
                        content: chunk,
                        categories: page.categories,
                        wordCount: chunkWords.length,
                        chunkIndex: Math.floor(i / (chunkSize - overlap)),
                        type: 'content'
                    });
                }
            }

            // Add tables as separate searchable chunks
            page.tables.forEach((table, index) => {
                let tableText = '';

                if (table.caption) {
                    tableText += `Table: ${table.caption}\n`;
                }

                if (table.headers.length > 0) {
                    tableText += `Headers: ${table.headers.join(' | ')}\n`;
                }

                tableText += table.rows.map(row => row.join(' | ')).join('\n');

                chunks.push({
                    id: `${page.title}_table_${index}`,
                    pageTitle: page.title,
                    pageUrl: page.url,
                    content: tableText,
                    categories: page.categories,
                    type: 'table',
                    tableIndex: index,
                    headers: table.headers,
                    rowCount: table.rows.length
                });
            });

            // Add info boxes as chunks
            page.infoBoxes.forEach((infoBox, index) => {
                const infoText = Object.entries(infoBox.data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');

                chunks.push({
                    id: `${page.title}_infobox_${index}`,
                    pageTitle: page.title,
                    pageUrl: page.url,
                    content: infoText,
                    categories: page.categories,
                    type: 'infobox'
                });
            });
        }

        console.log(`📊 Created ${chunks.length} searchable chunks`);
        return chunks;
    }

    /**
     * Build semantic index for TF-IDF based search
     * @param {Array} chunks - Array of searchable chunks
     * @returns {Object} Semantic index with term frequencies and document frequencies
     */
    buildSemanticIndex(chunks) {
        console.log('🧠 Building semantic search index...');

        const termFrequency = {};
        const documentFrequency = {};
        const totalDocs = chunks.length;

        // First pass: calculate term frequencies
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const terms = this.extractTerms(chunk.content + ' ' + chunk.pageTitle);
            const uniqueTerms = new Set(terms);

            // Calculate TF for this document
            chunk.termFreq = {};
            for (const term of terms) {
                chunk.termFreq[term] = (chunk.termFreq[term] || 0) + 1;
                termFrequency[term] = (termFrequency[term] || 0) + 1;
            }

            // Calculate DF
            for (const term of uniqueTerms) {
                documentFrequency[term] = (documentFrequency[term] || 0) + 1;
            }
        }

        // Second pass: calculate TF-IDF vectors
        for (const chunk of chunks) {
            chunk.tfidfVector = {};
            for (const term in chunk.termFreq) {
                const tf = chunk.termFreq[term] / Object.keys(chunk.termFreq).length;
                const idf = Math.log(totalDocs / (documentFrequency[term] || 1));
                chunk.tfidfVector[term] = tf * idf;
            }
        }

        console.log(`✅ Semantic index built with ${Object.keys(termFrequency).length} unique terms`);

        return {
            termFrequency,
            documentFrequency,
            totalDocs
        };
    }

    /**
     * Extract and normalize terms from text for semantic indexing
     * @param {string} text - Text to extract terms from
     * @returns {Array<string>} Array of normalized terms
     */
    extractTerms(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
            .split(/\s+/)
            .filter(term => term.length > 2)  // Filter short terms
            .filter(term => !this.isStopWord(term));  // Filter stop words
    }

    /**
     * Check if a term is a stop word
     * @param {string} term - Term to check
     * @returns {boolean} True if the term is a stop word
     */
    isStopWord(term) {
        const stopWords = new Set([
            'the', 'and', 'but', 'for', 'are', 'with', 'his', 'they', 'this', 'have', 'from', 'not',
            'had', 'you', 'can', 'will', 'was', 'were', 'been', 'being', 'has', 'did', 'does', 'that'
        ]);
        return stopWords.has(term);
    }

    /**
     * Get content statistics from chunks
     * @param {Array} chunks - Array of searchable chunks
     * @returns {Object} Statistics about the content
     */
    getContentStats(chunks) {
        if (!chunks || chunks.length === 0) {
            return {};
        }

        const stats = {
            totalChunks: chunks.length,
            byType: {},
            byCategory: {},
            totalWords: 0,
            pages: new Set()
        };

        for (const chunk of chunks) {
            // Count by type
            stats.byType[chunk.type] = (stats.byType[chunk.type] || 0) + 1;

            // Count by category
            for (const category of chunk.categories) {
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            }

            // Count words and pages
            stats.totalWords += chunk.content.split(/\s+/).length;
            stats.pages.add(chunk.pageTitle);
        }

        stats.totalPages = stats.pages.size;
        delete stats.pages; // Remove the set

        return stats;
    }

    /**
     * Get all available categories from chunks
     * @param {Array} chunks - Array of searchable chunks
     * @returns {Array<string>} Sorted array of unique categories
     */
    getAvailableCategories(chunks) {
        if (!chunks || chunks.length === 0) {
            return [];
        }

        const categorySet = new Set();
        for (const chunk of chunks) {
            for (const category of chunk.categories) {
                categorySet.add(category);
            }
        }

        return Array.from(categorySet).sort();
    }
}

module.exports = SearchBuilder;