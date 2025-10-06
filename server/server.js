// Tower Stats Backend Server
require('dotenv').config({ path: __dirname + '/.env' }); // Load from server/.env
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');
const cron = require('node-cron');
const path = require('path');
// SQLite removed - using Supabase only
const multer = require('multer');
const cookieParser = require('cookie-parser');
const YTDlpWrap = require('yt-dlp-wrap').default;
const TowerWikiScraper = require('./wiki-scraper');
const DiscordAuth = require('./discord-auth');
const SupabaseManager = require('./supabase-config');
const RedditScraperService = require('./services/reddit-scraper-service');

// Import route modules
const redditRouter = require('./routes/reddit');
const createRedditRAGRouter = require('./routes/reddit-rag');
const { router: videosRouter, getCacheStatus, fetchAllVideos, YOUTUBE_CHANNELS } = require('./routes/videos');
const createTowerRouter = require('./routes/tower');
const createWikiRouter = require('./routes/wiki');
const createDiscordAuthRouter = require('./routes/discord-auth');
const createDiscordApiRouter = require('./routes/discord-api');

const app = express();
const PORT = process.env.PORT || 6078;

// Initialize yt-dlp
const ytDlp = new YTDlpWrap();

// Initialize wiki scraper
const wikiScraper = new TowerWikiScraper();
let wikiInitialized = false;

// Initialize Discord auth
const discordAuth = new DiscordAuth();

// Initialize Supabase
const supabase = new SupabaseManager();

// Initialize Reddit scraper service
const redditScraper = new RedditScraperService(supabase);

// Debug: Check if Discord endpoints should be loaded
console.log('🔧 Debug - Supabase instance check:');
console.log('   supabase object exists:', !!supabase);
console.log('   supabase.supabase client exists:', !!supabase.supabase);
console.log('   Will load Discord endpoints:', !!(supabase && supabase.supabase));


// Middleware
app.use(cors({
    origin: process.env.DASHBOARD_URL || 'https://trackyourstats.vercel.app',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Mount route modules
app.use('/api/reddit', redditRouter);
app.use('/api/videos', videosRouter);

// Reddit scraper control endpoints
app.get('/api/reddit/scraper/status', (req, res) => {
    res.json(redditScraper.getStatus());
});

app.post('/api/reddit/scraper/trigger', async (req, res) => {
    try {
        await redditScraper.triggerScrape();
        res.json({ success: true, message: 'Reddit scrape triggered' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mount Reddit RAG router
const redditRAGRouter = createRedditRAGRouter(supabase);
app.use('/api/reddit-rag', redditRAGRouter);

// Mount Discord route modules
const discordAuthRouter = createDiscordAuthRouter(discordAuth, supabase);
app.use('/auth', discordAuthRouter);

const discordApiRouter = createDiscordApiRouter(supabase);
app.use('/api', discordApiRouter);


// Database initialization handled by unifiedDatabase.js

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(new Error('Only .txt files are allowed'), false);
        }
    }
});

// Mount tower router after multer is configured
const towerRouter = createTowerRouter(upload);
app.use('/api/tower', towerRouter);

// Mount wiki router with dependencies
const wikiRouter = createWikiRouter(wikiScraper, () => wikiInitialized);
// Allow the wiki router to update the wikiInitialized state
app.set('setWikiInitialized', (value) => { wikiInitialized = value; });
app.use('/api/wiki', wikiRouter);


// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});


// Get server status
app.get('/api/status', (req, res) => {
    const cacheStatus = getCacheStatus();
    res.json({
        success: true,
        server: 'Tower Stats Backend',
        version: '1.0.0',
        uptime: process.uptime(),
        lastUpdate: cacheStatus.lastUpdate,
        cachedVideos: cacheStatus.cachedVideos,
        totalChannels: cacheStatus.totalChannels
    });
});



// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Schedule automatic updates every 30 minutes
cron.schedule('*/30 * * * *', () => {
    console.log('🕐 Scheduled update starting...');
    fetchAllVideos();
});

// Initialize wiki data on startup
async function initializeWiki() {
    try {
        console.log('📚 Initializing wiki search...');
        await wikiScraper.loadData();
        wikiInitialized = true;
        console.log('✅ Wiki search initialized successfully');
    } catch (error) {
        console.error('❌ Wiki initialization failed:', error);
        console.log('🔄 Will attempt to load on first search request');
    }
}


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Tower Stats Server running on http://localhost:${PORT}`);
    console.log(`📺 Monitoring ${YOUTUBE_CHANNELS.length} YouTube channels`);

    // Initialize wiki search
    initializeWiki();

    // Initial fetch
    fetchAllVideos();

    // Start Reddit scraper (runs twice daily at 8 AM and 8 PM)
    redditScraper.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

module.exports = app;