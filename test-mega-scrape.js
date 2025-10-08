/**
 * Test script to manually trigger Reddit mega scrape
 */

// Load environment variables from .env file
require('dotenv').config();

const RedditScraperService = require('./server/services/reddit-scraper-service');
const SupabaseManager = require('./server/supabase-config');

async function testMegaScrape() {
    console.log('🚀 Starting manual Reddit mega scrape test...\n');

    // Initialize Supabase
    const supabase = new SupabaseManager();

    // Initialize Reddit scraper
    const scraper = new RedditScraperService(supabase);

    // Trigger mega scrape with 5000 posts using free Reddit JSON API
    console.log('📡 Triggering scrape with pagination (up to 5000 posts)...\n');
    await scraper.scrapeAndStore(5000, true);

    console.log('\n✅ Test complete! Check the logs above for results.');
    process.exit(0);
}

testMegaScrape().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
