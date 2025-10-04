// Utility functions for Tower Wiki scraper
// Handles file I/O, data management, and common utilities

const fs = require('fs').promises;
const path = require('path');

class ScraperUtils {
    constructor(baseDir = __dirname) {
        this.baseDir = baseDir;
    }

    /**
     * Utility function for delays (rate limiting)
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after the delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save scraped data to files
     * @param {Array} scrapedData - Raw scraped page data
     * @param {Array} searchableChunks - Processed searchable chunks
     * @param {Object} options - Save options
     */
    async saveData(scrapedData, searchableChunks = null, options = {}) {
        const {
            rawDataFilename = 'tower-wiki-data.json',
            searchDataFilename = 'tower-wiki-search.json',
            saveRaw = true,
            saveSearchable = true
        } = options;

        try {
            // Save raw scraped data
            if (saveRaw && scrapedData && scrapedData.length > 0) {
                const rawDataPath = path.join(this.baseDir, rawDataFilename);
                await fs.writeFile(rawDataPath, JSON.stringify(scrapedData, null, 2));
                console.log(`💾 Raw data saved to ${rawDataPath}`);
            }

            // Save searchable chunks
            if (saveSearchable && searchableChunks && searchableChunks.length > 0) {
                const searchDataPath = path.join(this.baseDir, searchDataFilename);
                await fs.writeFile(searchDataPath, JSON.stringify(searchableChunks, null, 2));
                console.log(`💾 Searchable data saved to ${searchDataPath}`);
            }

            console.log('✅ Data saved successfully');
        } catch (error) {
            console.error('❌ Error saving data:', error.message);
            throw error;
        }
    }

    /**
     * Load existing scraped data
     * @param {Object} options - Load options
     * @returns {Object} Object containing loaded data
     */
    async loadData(options = {}) {
        const {
            rawDataFilename = 'tower-wiki-data.json',
            searchDataFilename = 'tower-wiki-search.json',
            notionSearchFilename = 'tower-notion-search.json',
            loadRaw = false,
            loadSearchable = true,
            mergeNotionData = true
        } = options;

        const result = {
            scrapedData: null,
            searchableChunks: null,
            hasExistingData: false
        };

        try {
            // Load raw scraped data if requested
            if (loadRaw) {
                try {
                    const rawDataPath = path.join(this.baseDir, rawDataFilename);
                    const rawData = await fs.readFile(rawDataPath, 'utf8');
                    result.scrapedData = JSON.parse(rawData);
                    console.log(`📚 Loaded ${result.scrapedData.length} raw scraped pages`);
                } catch (rawError) {
                    console.log('📝 No raw scraped data found');
                }
            }

            // Load searchable chunks
            if (loadSearchable) {
                try {
                    const searchPath = path.join(this.baseDir, searchDataFilename);
                    const searchData = await fs.readFile(searchPath, 'utf8');
                    result.searchableChunks = JSON.parse(searchData);

                    // Try to merge with Notion data if available
                    if (mergeNotionData) {
                        try {
                            const notionPath = path.join(this.baseDir, notionSearchFilename);
                            const notionData = await fs.readFile(notionPath, 'utf8');
                            const notionChunks = JSON.parse(notionData);

                            result.searchableChunks = result.searchableChunks.concat(notionChunks);
                            console.log(`📚 Loaded ${result.searchableChunks.length} total searchable chunks (including Notion content)`);
                        } catch (notionError) {
                            console.log(`📚 Loaded ${result.searchableChunks.length} wiki searchable chunks (no Notion content found)`);
                        }
                    } else {
                        console.log(`📚 Loaded ${result.searchableChunks.length} wiki searchable chunks`);
                    }

                    result.hasExistingData = true;
                } catch (searchError) {
                    console.log('📝 No existing searchable data found');
                }
            }

            return result;
        } catch (error) {
            console.log('📝 Error loading data:', error.message);
            return result;
        }
    }

    /**
     * Save data with timestamp backup
     * @param {Array} scrapedData - Raw scraped page data
     * @param {Array} searchableChunks - Processed searchable chunks
     * @param {Object} options - Save options
     */
    async saveDataWithBackup(scrapedData, searchableChunks = null, options = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupOptions = {
            ...options,
            rawDataFilename: `tower-wiki-data-${timestamp}.json`,
            searchDataFilename: `tower-wiki-search-${timestamp}.json`
        };

        // Save with timestamp
        await this.saveData(scrapedData, searchableChunks, backupOptions);

        // Also save without timestamp (current version)
        await this.saveData(scrapedData, searchableChunks, options);
    }

    /**
     * Clean up old backup files
     * @param {number} maxBackups - Maximum number of backups to keep
     * @param {string} pattern - File pattern to match for cleanup
     */
    async cleanupBackups(maxBackups = 5, pattern = 'tower-wiki-*-*.json') {
        try {
            const files = await fs.readdir(this.baseDir);
            const backupFiles = files
                .filter(file => file.match(pattern.replace('*', '.*')))
                .map(file => ({
                    name: file,
                    path: path.join(this.baseDir, file),
                    stat: null
                }));

            // Get file stats
            for (const file of backupFiles) {
                try {
                    file.stat = await fs.stat(file.path);
                } catch (error) {
                    console.warn(`Warning: Could not stat file ${file.name}`);
                }
            }

            // Sort by modification time (newest first)
            backupFiles
                .filter(file => file.stat)
                .sort((a, b) => b.stat.mtime - a.stat.mtime);

            // Delete old backups
            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                for (const file of filesToDelete) {
                    try {
                        await fs.unlink(file.path);
                        console.log(`🗑️ Deleted old backup: ${file.name}`);
                    } catch (error) {
                        console.warn(`Warning: Could not delete ${file.name}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.warn('Warning: Could not clean up backups:', error.message);
        }
    }

    /**
     * Get file size in a human-readable format
     * @param {string} filename - File to check
     * @returns {string} Human-readable file size
     */
    async getFileSize(filename) {
        try {
            const stats = await fs.stat(path.join(this.baseDir, filename));
            const size = stats.size;

            if (size < 1024) return `${size} B`;
            if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
            if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
            return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Get data statistics
     * @param {Array} scrapedData - Raw scraped data
     * @param {Array} searchableChunks - Searchable chunks
     * @returns {Object} Statistics about the data
     */
    getDataStats(scrapedData = [], searchableChunks = []) {
        const stats = {
            pages: {
                total: scrapedData.length,
                totalWords: 0,
                averageWords: 0,
                categories: new Set(),
                types: {}
            },
            chunks: {
                total: searchableChunks.length,
                byType: {},
                totalWords: 0,
                averageWords: 0
            }
        };

        // Calculate page statistics
        for (const page of scrapedData) {
            stats.pages.totalWords += page.wordCount || 0;

            if (page.categories) {
                for (const category of page.categories) {
                    stats.pages.categories.add(category);
                }
            }
        }

        stats.pages.averageWords = scrapedData.length > 0 ?
            Math.round(stats.pages.totalWords / scrapedData.length) : 0;
        stats.pages.categories = Array.from(stats.pages.categories);

        // Calculate chunk statistics
        for (const chunk of searchableChunks) {
            stats.chunks.byType[chunk.type] = (stats.chunks.byType[chunk.type] || 0) + 1;

            const words = chunk.content ? chunk.content.split(/\s+/).length : 0;
            stats.chunks.totalWords += words;
        }

        stats.chunks.averageWords = searchableChunks.length > 0 ?
            Math.round(stats.chunks.totalWords / searchableChunks.length) : 0;

        return stats;
    }

    /**
     * Validate scraped data integrity
     * @param {Array} scrapedData - Raw scraped data to validate
     * @returns {Object} Validation results
     */
    validateData(scrapedData) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {
                totalPages: scrapedData.length,
                validPages: 0,
                pagesWithErrors: 0
            }
        };

        for (let i = 0; i < scrapedData.length; i++) {
            const page = scrapedData[i];
            const pageErrors = [];

            // Check required fields
            if (!page.title) pageErrors.push('Missing title');
            if (!page.content) pageErrors.push('Missing content');
            if (!page.url) pageErrors.push('Missing URL');
            if (typeof page.wordCount !== 'number') pageErrors.push('Invalid word count');

            // Check data types
            if (page.categories && !Array.isArray(page.categories)) {
                pageErrors.push('Categories should be an array');
            }
            if (page.tables && !Array.isArray(page.tables)) {
                pageErrors.push('Tables should be an array');
            }

            // Check for suspiciously small content
            if (page.content && page.content.length < 100) {
                validation.warnings.push(`Page "${page.title}" has very little content (${page.content.length} chars)`);
            }

            if (pageErrors.length > 0) {
                validation.errors.push(`Page ${i} ("${page.title || 'Unknown'}"): ${pageErrors.join(', ')}`);
                validation.stats.pagesWithErrors++;
                validation.isValid = false;
            } else {
                validation.stats.validPages++;
            }
        }

        return validation;
    }

    /**
     * Format time duration in human-readable format
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Create progress reporter function
     * @param {string} taskName - Name of the task being tracked
     * @param {number} total - Total number of items to process
     * @returns {Function} Progress reporter function
     */
    createProgressReporter(taskName, total) {
        const startTime = Date.now();
        let lastReportTime = startTime;

        return (current, additional = '') => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = (current / total) * 100;
            const rate = current / (elapsed / 1000);
            const eta = rate > 0 ? (total - current) / rate : 0;

            // Only report every 5 seconds or on completion
            if (now - lastReportTime > 5000 || current === total) {
                console.log(
                    `📊 ${taskName}: ${current}/${total} (${progress.toFixed(1)}%) ` +
                    `Rate: ${rate.toFixed(1)}/sec ETA: ${this.formatDuration(eta * 1000)} ${additional}`
                );
                lastReportTime = now;
            }
        };
    }
}

module.exports = ScraperUtils;