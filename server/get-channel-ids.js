// YouTube Channel ID Extractor
const axios = require('axios');

const channelHandles = [
    '@GreenyTower',
    '@crowbarzero',
    '@AllClouded',
    '@SpartanTheTower',
    '@taggzrd',
    '@JPlays1',
    '@JeffP978',
    '@EthanDX',
    '@fungulusmaximus',
    '@tequilaman7',
    '@dizzy-project-rend',
    '@Noobodytest',
    '@PrimosTower',
    '@Anorna-Sharnath',
    '@ShadoSabre'
];

async function getChannelId(handle) {
    try {
        const cleanHandle = handle.replace('@', '');
        const url = `https://www.youtube.com/@${cleanHandle}`;

        console.log(`Fetching: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Look for channel ID in the HTML
        const channelIdMatch = response.data.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
        const externalIdMatch = response.data.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/);

        const channelId = channelIdMatch?.[1] || externalIdMatch?.[1];

        if (channelId) {
            console.log(`✅ ${handle} → ${channelId}`);
            return { handle, channelId, status: 'found' };
        } else {
            console.log(`❌ ${handle} → Channel ID not found`);
            return { handle, channelId: null, status: 'not_found' };
        }
    } catch (error) {
        console.log(`❌ ${handle} → Error: ${error.message}`);
        return { handle, channelId: null, status: 'error', error: error.message };
    }
}

async function getAllChannelIds() {
    console.log('🔍 Extracting YouTube Channel IDs...\n');

    const results = [];

    for (const handle of channelHandles) {
        const result = await getChannelId(handle);
        results.push(result);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Results Summary:');
    console.log('==================');

    const found = results.filter(r => r.status === 'found');
    const notFound = results.filter(r => r.status === 'not_found');
    const errors = results.filter(r => r.status === 'error');

    console.log(`✅ Found: ${found.length}`);
    console.log(`❌ Not Found: ${notFound.length}`);
    console.log(`⚠️  Errors: ${errors.length}`);

    console.log('\n🔧 JavaScript Object for server.js:');
    console.log('=====================================');

    const jsObject = results.filter(r => r.channelId).map((result, index) => {
        const colors = [
            '#4CAF50', '#FF5722', '#2196F3', '#9C27B0', '#FF9800',
            '#795548', '#607D8B', '#E91E63', '#8BC34A', '#FFC107',
            '#00BCD4', '#673AB7', '#3F51B5'
        ];

        const name = result.handle.replace('@', '').replace(/[^a-zA-Z0-9]/g, '');

        return `    {
        name: '${name}',
        handle: '${result.handle}',
        channelId: '${result.channelId}',
        color: '${colors[index] || '#666666'}'
    }`;
    }).join(',\n');

    console.log(`const YOUTUBE_CHANNELS = [\n${jsObject}\n];`);

    return results;
}

// Run the extraction
getAllChannelIds().catch(console.error);