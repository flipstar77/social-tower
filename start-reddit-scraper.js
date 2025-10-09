/**
 * Start Reddit Scraper Service Locally
 * Runs scheduled scrapes at 8 AM, 6 PM (light) and 2 AM (mega)
 */

require('dotenv').config();
const RedditScraperService = require('./server/services/reddit-scraper-service');
const SupabaseManager = require('./server/supabase-config');

console.log('🚀 Starting Reddit Scraper Service...\n');

// Initialize Supabase
const supabase = new SupabaseManager();

// Initialize and start Reddit scraper
const scraper = new RedditScraperService(supabase);
scraper.start();

console.log('\n✅ Reddit scraper is now running!');
console.log('   Keep this process running for scheduled scrapes.');
console.log('   Press Ctrl+C to stop.\n');

// Keep process alive
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Reddit scraper...');
    scraper.stop();
    process.exit(0);
});
