// Vercel Serverless Function Entry Point
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.DASHBOARD_URL || 'https://trackyourstats.vercel.app',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Import only essential routes
const redditRouter = require('../server/routes/reddit');
const { router: videosRouter } = require('../server/routes/videos');
const createTowerRouter = require('../server/routes/tower');
const createWikiRouter = require('../server/routes/wiki');
const createDiscordAuthRouter = require('../server/routes/discord-auth');

// Initialize Supabase for database routes
const SupabaseManager = require('../server/supabase-config');
const supabase = new SupabaseManager();

// Mount routes
app.use('/api/reddit', redditRouter);
app.use('/api/videos', videosRouter);
app.use('/api/tower', createTowerRouter(supabase));
app.use('/api/wiki', createWikiRouter());
app.use('/auth/discord', createDiscordAuthRouter(supabase));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
