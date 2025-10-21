/**
 * Check what posts Reddit API is returning
 */

const axios = require('axios');

async function checkRedditAPI() {
    const url = 'https://www.reddit.com/r/TheTowerGame/new.json?limit=10';

    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const posts = response.data.data.children.map(child => ({
        id: child.data.id,
        title: child.data.title.substring(0, 60),
        created: new Date(child.data.created_utc * 1000).toISOString()
    }));

    console.log('📡 Latest 10 posts from /r/TheTowerGame/new:');
    posts.forEach(p => {
        console.log(`  ${p.id} | ${p.created} | ${p.title}`);
    });
}

checkRedditAPI();
