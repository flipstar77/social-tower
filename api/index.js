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
const { router: videosRouter } = require('../server/routes/videos-vercel');
const createTowerRouter = require('../server/routes/tower-vercel');
const createRedditRAGRouter = require('../server/routes/reddit-rag');
const createGuidesRouter = require('../server/routes/guides');
const createUserLabsRouter = require('../server/routes/user-labs');

// Initialize Supabase for database routes
const SupabaseManager = require('../server/supabase-config');
let supabase;
try {
    supabase = new SupabaseManager();
    // Make Supabase available to all routes via app.locals
    if (supabase && supabase.supabase) {
        app.locals.supabase = supabase.supabase;
        app.locals.supabaseManager = supabase;
    }
} catch (error) {
    console.error('Failed to initialize Supabase:', error);
    supabase = null;
}

// Mount routes
app.use('/api/reddit', redditRouter);
app.use('/api/videos', videosRouter);

// Only mount database routes if Supabase is available
if (supabase && supabase.supabase) {
    app.use('/api/tower', createTowerRouter(supabase));
    app.use('/api/reddit-rag', createRedditRAGRouter(supabase));
    app.use('/api/guides', createGuidesRouter(supabase));
    app.use('/api/user-labs', createUserLabsRouter(supabase));
} else {
    console.warn('⚠️ Supabase not configured - database routes disabled');
    app.use('/api/tower', (req, res) => {
        res.status(503).json({ error: 'Database not configured' });
    });
    app.use('/api/reddit-rag', (req, res) => {
        res.status(503).json({ error: 'Database not configured' });
    });
    app.use('/api/guides', (req, res) => {
        res.status(503).json({ error: 'Database not configured' });
    });
}

// Note: Discord auth is handled client-side via Supabase Auth
// No need for server-side Discord OAuth routes in Vercel

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
