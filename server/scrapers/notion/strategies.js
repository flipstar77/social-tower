/**
 * Notion Scraping Strategies Module
 * Handles different approaches to scraping Notion pages
 */

const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingStrategies {
    constructor(baseUrl = 'https://the-tower.notion.site', rateLimitDelay = 2000) {
        this.baseUrl = baseUrl;
        this.rateLimitDelay = rateLimitDelay;
        this.visitedUrls = new Set();
    }

    /**
     * Try to scrape the main Notion page with enhanced parsing
     */
    async scrapeMainPage() {
        console.log('📄 Scraping main Notion page with enhanced parsing...');

        try {
            const response = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            return { response, $ };

        } catch (error) {
            console.error('❌ Failed to scrape main page:', error.message);
            return null;
        }
    }

    /**
     * Try to discover sub-pages using common URL patterns
     */
    async discoverSubPages() {
        console.log('🔍 Discovering Notion sub-pages...');

        const urls = new Set();

        // Try common Notion URL patterns
        const sectionSlugs = [
            'guides-strategies',
            'glossary',
            'tools-infographics',
            'tournament-matters',
            'collection-of-tips',
            'collection-of-faqs',
            'beginners-guide',
            'how-i-beat-this',
            'tower-bugs-mechanics',
            'contributors-creators',
            'crowdsourcing-tower-data',
            'tower-creator-codes'
        ];

        // Pattern 1: /slug
        sectionSlugs.forEach(slug => {
            urls.add(`${this.baseUrl}/${slug}`);
        });

        // Pattern 2: /slug-{uuid}
        sectionSlugs.forEach(slug => {
            const uuid = this.generateNotionId();
            urls.add(`${this.baseUrl}/${slug}-${uuid}`);
        });

        console.log(`🔗 Generated ${urls.size} potential URLs to test`);
        return Array.from(urls).slice(0, 20); // Limit to avoid rate limiting
    }

    /**
     * Try to scrape individual pages
     */
    async scrapePage(url) {
        if (this.visitedUrls.has(url)) {
            return null;
        }

        this.visitedUrls.add(url);
        console.log(`📄 Trying: ${url}`);

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 404s but not server errors
            });

            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                return { response, $, url };
            }

            return null;

        } catch (error) {
            // Silently continue on errors (most URLs won't exist)
            return null;
        }
    }

    /**
     * Generate a Notion-style ID
     */
    generateNotionId() {
        return Array.from({length: 32}, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    /**
     * Delay helper
     */
    async delay(ms = this.rateLimitDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset visited URLs for fresh scraping
     */
    resetVisitedUrls() {
        this.visitedUrls.clear();
    }
}

module.exports = ScrapingStrategies;