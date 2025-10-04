// Page processing utilities for Tower Wiki scraper
// Handles scraping individual pages and discovering all wiki pages

const axios = require('axios');
const ContentExtractor = require('./contentExtractor');

class PageProcessor {
    constructor(baseUrl, apiUrl, rateLimitDelay = 1000) {
        this.baseUrl = baseUrl;
        this.apiUrl = apiUrl;
        this.rateLimitDelay = rateLimitDelay;
        this.contentExtractor = new ContentExtractor();
    }

    /**
     * Scrape a single page by title
     * @param {string} title - Page title to scrape
     * @returns {Object|null} Structured page data or null if scraping fails
     */
    async scrapePage(title) {
        console.log(`📄 Scraping: ${title}`);

        try {
            const params = {
                action: 'parse',
                page: title,
                format: 'json',
                prop: 'text|categories|links|sections',
                disablelimitreport: true
            };

            const response = await axios.get(this.apiUrl, { params });
            return this.contentExtractor.processPageData(response.data, title, this.baseUrl);
        } catch (error) {
            console.error(`❌ Error scraping ${title}:`, error.message);
            return null;
        }
    }

    /**
     * Discover all pages in the wiki
     * @param {number} maxPages - Maximum number of pages to discover (safety limit)
     * @returns {Array<string>} Array of discovered page titles
     */
    async discoverAllPages(maxPages = 2000) {
        console.log('🔍 Discovering all pages in the wiki...');
        const allPages = [];

        try {
            let apcontinue = null;
            let pageCount = 0;

            do {
                const params = {
                    action: 'query',
                    format: 'json',
                    list: 'allpages',
                    aplimit: 500,  // Maximum allowed by MediaWiki
                    apnamespace: 0  // Main namespace only
                };

                if (apcontinue) {
                    params.apcontinue = apcontinue;
                }

                const response = await axios.get(this.apiUrl, { params });
                const data = response.data;

                if (data.query && data.query.allpages) {
                    const pages = data.query.allpages.map(page => page.title);
                    allPages.push(...pages);
                    pageCount += pages.length;

                    console.log(`📄 Discovered ${pageCount} pages so far...`);
                }

                apcontinue = data.continue ? data.continue.apcontinue : null;
                await this.delay(500); // Rate limiting

            } while (apcontinue && pageCount < maxPages);

            console.log(`✅ Discovered ${allPages.length} total pages in the wiki`);
            return allPages;

        } catch (error) {
            console.error('❌ Error discovering pages:', error.message);
            return [];
        }
    }

    /**
     * Filter pages to exclude system/meta pages
     * @param {Array<string>} allPages - Array of all discovered pages
     * @returns {Array<string>} Filtered array of content pages
     */
    getContentPages(allPages) {
        return allPages.filter(page => {
            const lowerPage = page.toLowerCase();
            return !lowerPage.includes('user:') &&
                   !lowerPage.includes('file:') &&
                   !lowerPage.includes('category:') &&
                   !lowerPage.includes('template:') &&
                   !lowerPage.includes('help:') &&
                   !lowerPage.includes('mediawiki:') &&
                   !lowerPage.includes('special:') &&
                   !lowerPage.startsWith('talk:') &&
                   lowerPage.length > 2 &&
                   !lowerPage.includes('redirect') &&
                   !lowerPage.includes('disambiguation');
        });
    }

    /**
     * Scrape multiple pages with rate limiting and progress tracking
     * @param {Array<string>} pageTitles - Array of page titles to scrape
     * @param {Array} scrapedData - Existing scraped data to avoid duplicates
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Array} Array of successfully scraped page data
     */
    async scrapePages(pageTitles, scrapedData = [], progressCallback = null) {
        console.log(`🚀 Scraping ${pageTitles.length} pages...`);

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < pageTitles.length; i++) {
            const title = pageTitles[i];

            // Skip if we already have this page
            if (scrapedData.some(page => page.title === title)) {
                continue;
            }

            const pageData = await this.scrapePage(title);

            if (pageData && pageData.wordCount > 50) { // Only keep substantial pages
                results.push(pageData);
                successCount++;
                console.log(`✅ ${i + 1}/${pageTitles.length}: ${title} (${pageData.wordCount} words)`);
            } else {
                failCount++;
                if (i % 20 === 0 && i > 0) { // Progress update every 20 pages
                    console.log(`📊 Progress: ${i}/${pageTitles.length} processed, ${successCount} successful, ${failCount} failed`);
                }
            }

            // Progress callback
            if (progressCallback) {
                progressCallback(i + 1, pageTitles.length, successCount, failCount);
            }

            // Rate limiting
            await this.delay(this.rateLimitDelay);
        }

        console.log(`🎉 Scraping complete! ${successCount} pages successfully scraped`);
        return results;
    }

    /**
     * Scrape priority pages first
     * @param {Array<string>} priorityPages - Array of priority page titles
     * @param {Array} scrapedData - Existing scraped data array to append to
     * @returns {Array} Updated scraped data array
     */
    async scrapePriorityPages(priorityPages, scrapedData = []) {
        console.log(`🎯 Scraping ${priorityPages.length} priority pages...`);

        for (let i = 0; i < priorityPages.length; i++) {
            const title = priorityPages[i];
            const pageData = await this.scrapePage(title);

            if (pageData) {
                scrapedData.push(pageData);
                console.log(`✅ ${i + 1}/${priorityPages.length}: ${title} (${pageData.wordCount} words)`);
            } else {
                console.log(`⚠️ ${i + 1}/${priorityPages.length}: ${title} - failed to scrape`);
            }

            // Rate limiting
            await this.delay(this.rateLimitDelay);
        }

        console.log(`🎉 Priority scraping complete! Collected ${scrapedData.length} total pages`);
        return scrapedData;
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after the delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = PageProcessor;