const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const YTDlpWrap = require('yt-dlp-wrap').default;
const { validate, schemas } = require('../middleware/validation');
const router = express.Router();

// Import centralized channel configuration
const { YOUTUBE_CHANNELS } = require('../../config/channels-config');

// Initialize yt-dlp
const ytDlp = new YTDlpWrap();

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

const formatViewCount = (count) => {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
};

// Fetch RSS feed for a single channel
const fetchChannelRSS = async (channel) => {
    try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
        const response = await axios.get(rssUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        const videos = [];
        const entries = result.feed?.entry || [];

        for (const entry of entries.slice(0, 10)) { // Limit to 10 most recent
            const videoId = extractVideoId(entry.link?.[0]?.$.href);
            if (!videoId) continue;

            const video = {
                id: videoId,
                title: entry.title?.[0] || 'Untitled',
                channel: channel.name,
                channelColor: channel.color,
                publishDate: new Date(entry.published?.[0] || Date.now()),
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                description: entry['media:group']?.[0]?.['media:description']?.[0] || '',
                url: entry.link?.[0]?.$.href || `https://www.youtube.com/watch?v=${videoId}`,
                author: entry.author?.[0]?.name?.[0] || channel.name
            };

            videos.push(video);
        }

        return videos;
    } catch (error) {
        console.error(`Error fetching RSS for ${channel.name}:`, error.message);
        return [];
    }
};

// Fetch all channels and combine videos
const fetchAllVideos = async () => {
    console.log('🔄 Fetching videos from all channels...');
    const startTime = Date.now();

    try {
        const allChannelPromises = YOUTUBE_CHANNELS.map(channel =>
            fetchChannelRSS(channel).catch(err => {
                console.error(`Failed to fetch ${channel.name}:`, err.message);
                return [];
            })
        );

        const allChannelVideos = await Promise.all(allChannelPromises);
        const allVideos = allChannelVideos.flat();

        // Sort by publish date (newest first)
        videosCache = allVideos
            .sort((a, b) => b.publishDate - a.publishDate)
            .slice(0, 50); // Keep only 50 most recent

        lastUpdate = new Date();

        const fetchTime = Date.now() - startTime;
        console.log(`✅ Fetched ${videosCache.length} videos in ${fetchTime}ms`);

        return videosCache;
    } catch (error) {
        console.error('❌ Error fetching videos:', error);
        return videosCache; // Return cached data on error
    }
};

// Routes

// Get all videos
router.get('/', async (req, res) => {
    try {
        const videos = videosCache.length > 0 ? videosCache : await fetchAllVideos();

        res.json({
            success: true,
            data: {
                videos: videos,
                lastUpdate: lastUpdate,
                totalVideos: videos.length,
                totalChannels: YOUTUBE_CHANNELS.length
            }
        });
    } catch (error) {
        console.error('Error in /api/videos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch videos',
            videos: [],
            lastUpdate: lastUpdate
        });
    }
});

// Force refresh videos
router.post('/refresh', async (req, res) => {
    try {
        const videos = await fetchAllVideos();
        res.json({
            success: true,
            message: 'Videos refreshed successfully',
            data: {
                videos: videos,
                lastUpdate: lastUpdate,
                totalVideos: videos.length
            }
        });
    } catch (error) {
        console.error('Error refreshing videos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh videos'
        });
    }
});

// YouTube transcript endpoint
router.get('/transcript/:videoId', validate(schemas.videoId, 'params'), async (req, res) => {
    const { videoId } = req.params;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        console.log(`📝 Fetching transcript for video: ${videoId}`);

        // Get video info first to check if subtitles are available
        const infoData = await ytDlp.execPromise([
            videoUrl,
            '--dump-json',
            '--skip-download',
            '--no-check-certificate',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ]);

        const videoInfo = JSON.parse(infoData);

        // Check for available subtitles
        const subtitles = videoInfo.subtitles || {};
        const autoSubtitles = videoInfo.automatic_captions || {};

        let transcriptText = '';

        // Try to get manual subtitles first, then automatic
        const availableSubs = subtitles.en || autoSubtitles.en;

        if (availableSubs && availableSubs.length > 0) {
            // Get the subtitle file
            const subData = await ytDlp.execPromise([
                videoUrl,
                '--write-auto-subs',
                '--write-subs',
                '--sub-langs', 'en',
                '--sub-format', 'json3',
                '--skip-download',
                '--no-check-certificate',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--print', 'after_move:filename'
            ]);

            // Parse the subtitle response
            try {
                const subtitleData = JSON.parse(subData);
                if (subtitleData.events) {
                    const textSegments = [];
                    subtitleData.events.forEach(event => {
                        if (event.segs) {
                            event.segs.forEach(seg => {
                                if (seg.utf8) {
                                    textSegments.push(seg.utf8.trim());
                                }
                            });
                        }
                    });
                    transcriptText = textSegments.join(' ').replace(/\s+/g, ' ').trim();
                }
            } catch (parseError) {
                console.warn('Could not parse subtitle JSON, trying raw text extraction');
                transcriptText = subData; // Fallback to raw response
            }
        }

        if (transcriptText) {
            res.json({
                success: true,
                transcript: transcriptText,
                videoId: videoId,
                title: videoInfo.title || 'Unknown Title',
                duration: formatDuration(videoInfo.duration),
                viewCount: formatViewCount(videoInfo.view_count || 0)
            });
        } else {
            res.json({
                success: false,
                error: 'No transcript available for this video',
                videoId: videoId,
                availableLanguages: Object.keys({...subtitles, ...autoSubtitles})
            });
        }
    } catch (error) {
        console.error('❌ Error fetching transcript:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            videoId
        });
    }
});

// Export cache getters for server status
const getCacheStatus = () => ({
    cachedVideos: videosCache.length,
    lastUpdate: lastUpdate,
    totalChannels: YOUTUBE_CHANNELS.length
});

module.exports = { router, getCacheStatus, fetchAllVideos, YOUTUBE_CHANNELS };