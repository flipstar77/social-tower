// Tower Wiki Scraper - Modular Implementation
// Orchestrates scraping of Tower Wiki and creates searchable knowledge base

// Import modular components
const PageProcessor = require('./scrapers/wiki/pageProcessor');
const SearchBuilder = require('./scrapers/wiki/searchBuilder');
const KeywordSearch = require('./scrapers/search/keywordSearch');
const SemanticSearch = require('./scrapers/search/semanticSearch');
const HybridSearch = require('./scrapers/search/hybridSearch');
const ScraperUtils = require('./scrapers/scraperUtils');
const TowerNotionScraper = require('./notion-scraper');

class TowerWikiScraper {
    constructor() {
        this.baseUrl = 'https://the-tower-idle-tower-defense.fandom.com';
        this.apiUrl = `${this.baseUrl}/api.php`;
        this.scrapedData = [];
        this.searchableChunks = null;
        this.rateLimitDelay = 1000; // 1 second between requests

        // Priority pages to scrape first (most important content)
        this.priorityPages = [
            'Modules', 'Workshop Upgrades', 'Ultimate Weapons', 'Enemies',
            'Attack Upgrades', 'Defense Upgrades', 'Utility Upgrades',
            'Cards', 'Perks', 'Tournaments', 'Events', 'Beginner Guide',
            'Advanced Strategies', 'Labs', 'Challenges', 'Currency', 'Tiers', 'Waves'
        ];

        // Configuration for comprehensive scraping
        this.comprehensiveScraping = true;
        this.maxPages = 1000;
        this.allPages = [];

        // Initialize modular components
        this.pageProcessor = new PageProcessor(this.baseUrl, this.apiUrl, this.rateLimitDelay);
        this.searchBuilder = new SearchBuilder();
        this.keywordSearch = new KeywordSearch();
        this.semanticSearchEngine = new SemanticSearch();
        this.hybridSearch = new HybridSearch();
        this.utils = new ScraperUtils(__dirname);

        // Enable semantic search features
        this.semanticEnabled = true;
    }

    // Get specific page content (delegates to pageProcessor)
    async scrapePage(title) {
        return await this.pageProcessor.scrapePage(title);
    }

    // Legacy methods for backward compatibility - now delegate to modules
    extractCleanContent($) {
        return this.pageProcessor.contentExtractor.extractCleanContent($);
    }

    extractTables($) {
        return this.pageProcessor.contentExtractor.extractTables($);
    }

    extractInfoBoxes($) {
        return this.pageProcessor.contentExtractor.extractInfoBoxes($);
    }

    // Discover all pages in the wiki (delegates to pageProcessor)
    async discoverAllPages() {
        this.allPages = await this.pageProcessor.discoverAllPages(this.maxPages);
        return this.allPages;
    }

    // Get filtered content pages
    getExtendedPriorityPages() {
        return this.pageProcessor.getContentPages(this.allPages);
    }

    async scrapePriorityPages() {
        this.scrapedData = await this.pageProcessor.scrapePriorityPages(this.priorityPages, this.scrapedData);
    }

    async scrapeExtendedPages() {
        if (!this.comprehensiveScraping) {
            console.log('📄 Comprehensive scraping disabled, skipping extended pages');
            return;
        }

        // Discover all pages first
        await this.discoverAllPages();

        // Get extended priority pages
        const extendedPages = this.getExtendedPriorityPages();
        console.log(`🚀 Starting extended scraping of ${extendedPages.length} pages...`);

        // Use pageProcessor for bulk scraping
        const newPages = await this.pageProcessor.scrapePages(extendedPages, this.scrapedData);
        this.scrapedData = this.scrapedData.concat(newPages);

        console.log(`🎉 Extended scraping complete! Total: ${this.scrapedData.length} pages`);
    }

    // Create searchable text chunks (delegates to searchBuilder)
    createSearchableChunks() {
        const chunks = this.searchBuilder.createSearchableChunks(this.scrapedData);

        // Build semantic index if enabled
        if (this.semanticEnabled) {
            this.hybridSearch.initialize(chunks);
        }

        return chunks;
    }

    // Enhanced search with category filtering and advanced options
    search(query, options = {}) {
        if (!this.searchableChunks) {
            console.log('❌ No searchable data available. Run scraping first.');
            return [];
        }
        return this.keywordSearch.search(query, this.searchableChunks, options);
    }

    // Sort search results by different criteria (delegates to keywordSearch)
    sortSearchResults(results, sortBy) {
        return this.keywordSearch.sortSearchResults(results, sortBy);
    }

    // Get all available categories from scraped data
    getAvailableCategories() {
        return this.searchBuilder.getAvailableCategories(this.searchableChunks);
    }

    // Get content statistics
    getContentStats() {
        return this.searchBuilder.getContentStats(this.searchableChunks);
    }

    // Legacy search method for backward compatibility
    simpleSearch(query, limit = 10) {
        return this.search(query, { limit });
    }

    // Build semantic index for TF-IDF based search (delegates to searchBuilder)
    buildSemanticIndex() {
        if (!this.searchableChunks || !this.semanticEnabled) {
            console.log('⚠️ Cannot build semantic index - no data or semantic search disabled');
            return;
        }
        return this.searchBuilder.buildSemanticIndex(this.searchableChunks);
    }

    // Semantic search using TF-IDF and cosine similarity
    semanticSearch(query, options = {}) {
        if (!this.searchableChunks) {
            console.log('❌ No searchable data available for semantic search.');
            return [];
        }
        return this.semanticSearchEngine.search(query, this.searchableChunks, options);
    }

    // Enhanced search that combines keyword and semantic search
    hybridSearch(query, options = {}) {
        if (!this.searchableChunks) {
            console.log('❌ No searchable data available for hybrid search.');
            return [];
        }
        return this.hybridSearch.search(query, this.searchableChunks, options);
    }

    // Create preview text with highlighted terms (delegates to keywordSearch)
    createPreview(content, queryTerms, maxLength = 200) {
        return this.keywordSearch.createPreview(content, queryTerms, maxLength);
    }

    // Save scraped data (delegates to utils)
    async saveData() {
        await this.utils.saveData(this.scrapedData, this.searchableChunks);
    }

    // Load existing data (including Notion content)
    async loadData() {
        const result = await this.utils.loadData();
        if (result.hasExistingData) {
            this.searchableChunks = result.searchableChunks;
            if (result.scrapedData) {
                this.scrapedData = result.scrapedData;
            }
        }
        return result.hasExistingData;
    }

    // Utility function for delays
    delay(ms) {
        return this.utils.delay(ms);
    }

    // Run the complete scraping process
    async run() {
        console.log('🚀 Starting Tower Wiki Scraper...');

        try {
            // Try to load existing data first
            const hasExistingData = await this.loadData();

            if (!hasExistingData) {
                console.log('📚 No existing data found, starting fresh scraping...');

                // Scrape priority pages first
                await this.scrapePriorityPages();

                // Scrape extended pages for comprehensive coverage
                if (this.comprehensiveScraping) {
                    console.log('\n🌍 Starting comprehensive wiki scraping...');
                    await this.scrapeExtendedPages();
                }

                // Create searchable chunks
                this.searchableChunks = this.createSearchableChunks();

                // Save data
                await this.saveData();

                // Also scrape Notion content
                console.log('\n🌟 Starting Notion site scraping...');
                const notionScraper = new TowerNotionScraper();
                const notionChunks = await notionScraper.run();

                if (notionChunks && notionChunks.length > 0) {
                    // Merge Notion chunks with wiki chunks
                    this.searchableChunks = this.searchableChunks.concat(notionChunks);
                    console.log(`🔗 Merged ${notionChunks.length} Notion chunks with wiki data`);
                }

                console.log(`\n📊 Final scraping statistics:`);
                console.log(`   📄 Total pages scraped: ${this.scrapedData.length}`);
                console.log(`   🔍 Searchable chunks created: ${this.searchableChunks.length}`);
                console.log(`   📝 Total word count: ${this.scrapedData.reduce((sum, page) => sum + page.wordCount, 0).toLocaleString()}`);
            } else {
                console.log('✅ Loaded existing wiki data from cache');
                // Initialize search components with loaded data
                if (this.semanticEnabled && this.searchableChunks) {
                    this.hybridSearch.initialize(this.searchableChunks);
                }
            }

            // Test search functionality
            console.log('\n🔍 Testing search functionality:');
            const testQueries = ['modules', 'upgrades cannon', 'golden tower', 'tier 15'];

            for (const query of testQueries) {
                console.log(`\n🔎 "${query}":`);
                const results = this.search(query, { limit: 3 });

                results.forEach((result, i) => {
                    console.log(`  ${i + 1}. ${result.pageTitle} (score: ${result.relevanceScore})`);
                    console.log(`     ${result.preview.substring(0, 80)}...`);
                });
            }

            console.log('\n✅ Wiki scraper setup complete!');
            return true;

        } catch (error) {
            console.error('❌ Error in scraper:', error);
            return false;
        }
    }
}

module.exports = TowerWikiScraper;

// Run if called directly
if (require.main === module) {
    const scraper = new TowerWikiScraper();
    scraper.run();
}