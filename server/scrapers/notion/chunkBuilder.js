/**
 * Chunk Builder Module
 * Handles creation of searchable content chunks from scraped data
 */

const fs = require('fs').promises;
const path = require('path');

class ChunkBuilder {
    constructor() {
        // Configuration for chunk creation
        this.maxChunkLength = 1000;
        this.sentencesPerChunk = 5;
        this.maxChunksPerPage = 5;
        this.minChunkLength = 100;
    }

    /**
     * Create enhanced search chunks from scraped data
     */
    async createSearchChunks(scrapedData, outputPath = null) {
        console.log('🔍 Creating enhanced searchable chunks...');

        const chunks = [];

        for (const page of scrapedData) {
            const pageChunks = this.createPageChunks(page);
            chunks.push(...pageChunks);
        }

        // Save search chunks if output path is provided
        if (outputPath) {
            await this.saveChunks(chunks, outputPath);
        }

        console.log(`📊 Created ${chunks.length} enhanced searchable chunks`);
        return chunks;
    }

    /**
     * Create chunks for a single page
     */
    createPageChunks(page) {
        const chunks = [];

        // Create main chunk for the page
        const mainChunk = this.createMainChunk(page);
        chunks.push(mainChunk);

        // If content is long, create additional chunks
        if (page.content.length > this.maxChunkLength) {
            const additionalChunks = this.createAdditionalChunks(page);
            chunks.push(...additionalChunks);
        }

        return chunks;
    }

    /**
     * Create the main chunk for a page
     */
    createMainChunk(page) {
        return {
            id: `notion_${page.title.replace(/[^a-zA-Z0-9]/g, '_')}_chunk_0`,
            pageTitle: page.title,
            pageUrl: page.url,
            content: page.content,
            categories: ['Notion', page.type === 'main-hub' ? 'Community Guide' : 'Section Guide'],
            wordCount: page.wordCount,
            chunkIndex: 0,
            type: 'notion-content',
            source: 'notion',
            keywords: page.keywords || []
        };
    }

    /**
     * Create additional chunks for long content
     */
    createAdditionalChunks(page) {
        const chunks = [];
        const sentences = page.content.split(/[.!?]+/);
        const chunksNeeded = Math.ceil(sentences.length / this.sentencesPerChunk);

        for (let i = 1; i < chunksNeeded && i < this.maxChunksPerPage; i++) {
            const startIdx = i * this.sentencesPerChunk;
            const endIdx = Math.min((i + 1) * this.sentencesPerChunk, sentences.length);
            const chunkContent = sentences.slice(startIdx, endIdx).join('. ').trim();

            if (chunkContent.length > this.minChunkLength) {
                const chunk = {
                    id: `notion_${page.title.replace(/[^a-zA-Z0-9]/g, '_')}_chunk_${i}`,
                    pageTitle: page.title,
                    pageUrl: page.url,
                    content: chunkContent,
                    categories: ['Notion', 'Section Guide'],
                    wordCount: chunkContent.split(/\s+/).length,
                    chunkIndex: i,
                    type: 'notion-content',
                    source: 'notion',
                    keywords: page.keywords || []
                };

                chunks.push(chunk);
            }
        }

        return chunks;
    }

    /**
     * Save chunks to file
     */
    async saveChunks(chunks, outputPath) {
        try {
            await fs.writeFile(outputPath, JSON.stringify(chunks, null, 2));
            console.log(`💾 Search chunks saved to: ${outputPath}`);
        } catch (error) {
            console.error('❌ Failed to save search chunks:', error);
            throw error;
        }
    }

    /**
     * Create chunks with custom configuration
     */
    createCustomChunks(scrapedData, config = {}) {
        // Merge custom config with defaults
        const oldConfig = {
            maxChunkLength: this.maxChunkLength,
            sentencesPerChunk: this.sentencesPerChunk,
            maxChunksPerPage: this.maxChunksPerPage,
            minChunkLength: this.minChunkLength
        };

        // Apply custom configuration
        Object.assign(this, config);

        try {
            const chunks = [];
            for (const page of scrapedData) {
                const pageChunks = this.createPageChunks(page);
                chunks.push(...pageChunks);
            }
            return chunks;
        } finally {
            // Restore original configuration
            Object.assign(this, oldConfig);
        }
    }

    /**
     * Validate chunk quality
     */
    validateChunks(chunks) {
        const issues = [];

        for (const chunk of chunks) {
            // Check required fields
            const requiredFields = ['id', 'pageTitle', 'pageUrl', 'content', 'type', 'source'];
            for (const field of requiredFields) {
                if (!chunk[field]) {
                    issues.push(`Chunk ${chunk.id || 'unknown'} missing required field: ${field}`);
                }
            }

            // Check content length
            if (chunk.content && chunk.content.length < this.minChunkLength) {
                issues.push(`Chunk ${chunk.id} content too short: ${chunk.content.length} chars`);
            }

            // Check for empty content
            if (!chunk.content || chunk.content.trim().length === 0) {
                issues.push(`Chunk ${chunk.id} has empty content`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            chunkCount: chunks.length
        };
    }

    /**
     * Get chunk statistics
     */
    getChunkStats(chunks) {
        const stats = {
            totalChunks: chunks.length,
            averageLength: 0,
            averageWordCount: 0,
            typeDistribution: {},
            sourceDistribution: {}
        };

        if (chunks.length === 0) {
            return stats;
        }

        let totalLength = 0;
        let totalWords = 0;

        for (const chunk of chunks) {
            // Length and word count
            totalLength += chunk.content ? chunk.content.length : 0;
            totalWords += chunk.wordCount || 0;

            // Type distribution
            const type = chunk.type || 'unknown';
            stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;

            // Source distribution
            const source = chunk.source || 'unknown';
            stats.sourceDistribution[source] = (stats.sourceDistribution[source] || 0) + 1;
        }

        stats.averageLength = Math.round(totalLength / chunks.length);
        stats.averageWordCount = Math.round(totalWords / chunks.length);

        return stats;
    }
}

module.exports = ChunkBuilder;