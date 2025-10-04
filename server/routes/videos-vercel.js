const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const router = express.Router();

// Import centralized channel configuration
const { YOUTUBE_CHANNELS } = require('../../config/channels-config');

// Cache for storing fetched videos
let videosCache = [];
let lastUpdate = null;

// Utility functions
const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
};

const formatDuration = (isoDuration) => {
    if (!isoDuration) return 'N/A';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'N/A';

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Fetch RSS feed for a channel
async function fetchChannelRSS(channelId) {
    try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        console.log(`📺 Fetching RSS for channel ${channelId}...`);

        const response = await axios.get(rssUrl, { timeout: 10000 });
        console.log(`✅ Got RSS response for ${channelId}, status:`, response.status);

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        if (result.feed && result.feed.entry) {
            const videos = result.feed.entry.map(entry => ({
                id: extractVideoId(entry.link[0].$.href),
                title: entry.title[0],
                url: entry.link[0].$.href,
                thumbnail: `https://i.ytimg.com/vi/${extractVideoId(entry.link[0].$.href)}/mqdefault.jpg`,
                publishedAt: entry.published[0],
                channelId: channelId,
                channelTitle: entry.author[0].name[0],
                duration: 'N/A' // RSS doesn't provide duration
            }));
            console.log(`✅ Parsed ${videos.length} videos from ${channelId}`);
            return videos;
        }
        console.log(`⚠️ No entries in RSS feed for ${channelId}`);
        return [];
    } catch (error) {
        console.error(`❌ Error fetching RSS for channel ${channelId}:`, error.message);
        return [];
    }
}

// Fetch all videos from all channels
async function fetchAllVideos() {
    try {
        const allVideos = [];

        for (const channel of YOUTUBE_CHANNELS) {
            const videos = await fetchChannelRSS(channel.channelId);
            allVideos.push(...videos);
        }

        // Sort by publish date (newest first)
        allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        videosCache = allVideos;
        lastUpdate = new Date().toISOString();

        console.log(`✅ Fetched ${allVideos.length} videos from ${YOUTUBE_CHANNELS.length} channels`);
        return allVideos;
    } catch (error) {
        console.error('Error fetching videos:', error);
        return videosCache; // Return cached data on error
    }
}

// GET /api/videos - Fetch all videos
router.get('/', async (req, res) => {
    try {
        console.log('📺 Videos API called, cache has:', videosCache.length, 'videos');

        // Always fetch fresh data in serverless (no persistent cache)
        const freshVideos = await fetchAllVideos();

        console.log('📺 Fetched fresh videos:', freshVideos.length);

        res.json({
            success: true,
            videos: freshVideos,
            lastUpdate,
            count: freshVideos.length
        });
    } catch (error) {
        console.error('Error in /api/videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos', message: error.message });
    }
});

// GET /api/videos/cache-status
router.get('/cache-status', (req, res) => {
    res.json({
        cached: videosCache.length,
        lastUpdate,
        channels: YOUTUBE_CHANNELS.length
    });
});

module.exports = {
    router,
    fetchAllVideos,
    getCacheStatus: () => ({ cached: videosCache.length, lastUpdate }),
    YOUTUBE_CHANNELS
};
