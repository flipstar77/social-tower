// Test the wiki scraper API integration
const TowerWikiScraper = require('./server/wiki-scraper');

async function testWikiIntegration() {
    console.log('🧪 Testing Wiki Integration...');

    const scraper = new TowerWikiScraper();

    try {
        // Test loading existing data
        const hasData = await scraper.loadData();

        if (hasData) {
            console.log('✅ Wiki data loaded successfully');

            // Test search functionality
            const testQueries = [
                'modules upgrade',
                'golden tower strategy',
                'tier 15 enemies',
                'workshop upgrades cannon'
            ];

            for (const query of testQueries) {
                console.log(`\n🔍 Testing search: "${query}"`);
                const results = scraper.search(query, 3);

                if (results.length > 0) {
                    results.forEach((result, i) => {
                        console.log(`  ${i + 1}. ${result.pageTitle} (score: ${result.relevanceScore})`);
                        console.log(`     ${result.preview.substring(0, 100)}...`);
                        console.log(`     ${result.pageUrl}`);
                    });
                } else {
                    console.log('  No results found');
                }
            }
        } else {
            console.log('❌ No wiki data found. Run the scraper first.');
        }

        // Test API response format
        console.log('\n📋 Testing API response format...');
        const apiResults = scraper.search('modules', 2);

        const formattedResults = apiResults.map(result => ({
            id: result.id,
            title: result.pageTitle,
            url: result.pageUrl,
            preview: result.preview,
            score: result.relevanceScore,
            type: result.type,
            categories: result.categories
        }));

        console.log('API Format Sample:');
        console.log(JSON.stringify({
            success: true,
            query: 'modules',
            totalResults: formattedResults.length,
            results: formattedResults
        }, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testWikiIntegration();