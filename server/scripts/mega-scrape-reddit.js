/**
 * Mega Reddit Scrape - Initial knowledge base builder
 * Scrapes 1000 posts to build comprehensive RAG database
 */

const axios = require('axios');

const APIFY_API_KEY = process.env.APIFY_API_KEY || 'apify_api_PNttwixh8cILCQi2ablqxObbHQNlml2FMQjZ';
const APIFY_ACTOR_ID = 'oAuCIx3ItNrs2okjQ';
const SUBREDDIT = 'TheTowerGame';
const TOTAL_POSTS = 1000;

async function megaScrape() {
    console.log('🚀 Starting MEGA SCRAPE for knowledge base initialization...');
    console.log(`📊 Target: ${TOTAL_POSTS} posts from r/${SUBREDDIT}`);
    console.log('⏱️ This will take 2-3 minutes...\n');

    try {
        // Start Apify actor run
        console.log('📡 Starting Apify scrape...');
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs`,
            {
                startUrls: [{ url: `https://www.reddit.com/r/${SUBREDDIT}/` }],
                maxItems: TOTAL_POSTS,
                maxPostCount: TOTAL_POSTS,
                maxComments: 100 // Get lots of comments for context
            },
            {
                headers: {
                    'Authorization': `Bearer ${APIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const runId = runResponse.data.data.id;
        const datasetId = runResponse.data.data.defaultDatasetId;
        console.log(`✅ Apify run started: ${runId}`);
        console.log(`📦 Dataset ID: ${datasetId}\n`);

        // Wait for run to complete
        let status = 'READY';
        let attempts = 0;
        const maxAttempts = 180; // 3 minutes max

        while (!['SUCCEEDED', 'FAILED', 'ABORTED'].includes(status) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await axios.get(
                `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}`,
                { headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` } }
            );

            status = statusResponse.data.data.status;
            attempts++;

            if (attempts % 10 === 0) {
                console.log(`⏳ Scraping in progress... ${attempts}s elapsed`);
            }
        }

        if (status !== 'SUCCEEDED') {
            throw new Error(`Apify run failed with status: ${status}`);
        }

        console.log(`\n✅ Scrape completed in ${attempts}s!`);

        // Fetch results
        console.log('📥 Downloading results...');
        const datasetResponse = await axios.get(
            `https://api.apify.com/v2/datasets/${datasetId}/items`,
            { headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` } }
        );

        const posts = datasetResponse.data.filter(item => item.dataType === 'post');
        const comments = datasetResponse.data.filter(item => item.dataType === 'comment');

        console.log(`\n📊 SCRAPE RESULTS:`);
        console.log(`   Posts: ${posts.length}`);
        console.log(`   Comments: ${comments.length}`);
        console.log(`   Total items: ${datasetResponse.data.length}`);

        // Save to JSON file for manual import
        const fs = require('fs');
        const output = {
            posts,
            comments,
            scrapedAt: new Date().toISOString(),
            subreddit: SUBREDDIT
        };

        const filename = `reddit-mega-scrape-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));

        console.log(`\n💾 Data saved to: ${filename}`);
        console.log(`\n🎉 MEGA SCRAPE COMPLETE!`);
        console.log(`\nNext steps:`);
        console.log(`1. Trigger the scraper via: POST /api/reddit/scraper/trigger`);
        console.log(`2. Or manually import this JSON file to Supabase`);
        console.log(`\n📈 Estimated cost: ~$0.50 for this one-time scrape`);

    } catch (error) {
        console.error('❌ Mega scrape failed:', error.message);
        process.exit(1);
    }
}

// Run the mega scrape
megaScrape().then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
});
