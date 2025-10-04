// Discord Routes Module
// Extracted from monolithic server.js to handle Discord OAuth and bot integration

const express = require('express');
const router = express.Router();
const unifiedDb = require('../database/unifiedDatabase');

// Import existing Discord modules (already modular)
const SupabaseManager = require('../supabase-config');

// Initialize Supabase for Discord operations
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
        supabase = new SupabaseManager();
        console.log('✅ Discord routes: Supabase initialized');
    } catch (error) {
        console.warn('⚠️ Discord routes: Supabase initialization failed:', error.message);
    }
}

// =============================================================================
// DISCORD BOT INTEGRATION ENDPOINTS
// =============================================================================

// Get Discord runs for authenticated users
router.get('/runs', async (req, res) => {
    try {
        // Use unified database to get Discord runs
        const runs = await unifiedDb.getRuns({
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0,
            includeLocal: false, // Only Discord runs for this endpoint
            includeDiscord: true
        });

        res.json({
            success: true,
            runs: runs.filter(run => run.source === 'discord'),
            total: runs.length
        });
    } catch (error) {
        console.error('❌ Error fetching Discord runs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Link Discord account (existing functionality from server.js)
router.post('/link', async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            success: false,
            error: 'Supabase not configured'
        });
    }

    try {
        const { discordUserId, serverId, linkCode } = req.body;

        if (!discordUserId || !linkCode) {
            return res.status(400).json({
                success: false,
                error: 'Discord user ID and link code are required'
            });
        }

        // Find the link code in the database
        const { data: linkData, error: linkError } = await supabase.supabase
            .from('account_links')
            .select('*')
            .eq('link_code', linkCode)
            .eq('is_used', false)
            .single();

        if (linkError || !linkData) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired link code'
            });
        }

        // Update the link with Discord information
        const { error: updateError } = await supabase.supabase
            .from('account_links')
            .update({
                discord_user_id: discordUserId,
                discord_server_id: serverId,
                linked_at: new Date().toISOString(),
                is_used: true
            })
            .eq('id', linkData.id);

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message: 'Account linked successfully',
            linkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Account linking error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get leaderboard for Discord server
router.get('/leaderboard/:serverId', async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            success: false,
            error: 'Supabase not configured'
        });
    }

    try {
        const { serverId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Get top runs for the server
        const { data: runs, error } = await supabase.supabase
            .from('tower_runs')
            .select(`
                *,
                users:discord_user_id (
                    discord_username
                )
            `)
            .eq('discord_server_id', serverId)
            .order('tier', { ascending: false })
            .order('wave', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        // Process leaderboard data
        const leaderboard = runs.map((run, index) => ({
            rank: index + 1,
            username: run.users?.discord_username || 'Unknown',
            tier: run.tier,
            wave: run.wave,
            damage: run.damage_dealt,
            coins: run.coins_earned,
            submittedAt: run.submitted_at
        }));

        res.json({
            success: true,
            leaderboard,
            serverId,
            total: leaderboard.length
        });

    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user stats
router.get('/user/:userId/stats', async (req, res) => {
    if (!supabase) {
        return res.status(503).json({
            success: false,
            error: 'Supabase not configured'
        });
    }

    try {
        const { userId } = req.params;

        // Get user's recent runs
        const { data: runs, error } = await supabase.supabase
            .from('tower_runs')
            .select('*')
            .eq('discord_user_id', userId)
            .order('submitted_at', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        // Calculate user statistics
        const stats = {
            totalRuns: runs.length,
            bestTier: Math.max(...runs.map(r => r.tier || 0)),
            bestWave: Math.max(...runs.map(r => r.wave || 0)),
            totalDamage: runs.reduce((sum, r) => {
                const damage = parseFloat(r.damage_dealt?.replace(/[^0-9.]/g, '') || '0');
                return sum + damage;
            }, 0),
            totalCoins: runs.reduce((sum, r) => {
                const coins = parseFloat(r.coins_earned?.replace(/[^0-9.]/g, '') || '0');
                return sum + coins;
            }, 0),
            recentRuns: runs.slice(0, 5).map(run => ({
                tier: run.tier,
                wave: run.wave,
                damage: run.damage_dealt,
                coins: run.coins_earned,
                submittedAt: run.submitted_at
            }))
        };

        res.json({
            success: true,
            userId,
            stats
        });

    } catch (error) {
        console.error('❌ User stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// DISCORD OAUTH ENDPOINTS (from existing server.js)
// =============================================================================

// These endpoints integrate with the existing Discord OAuth flow
// They're kept here for consistency with Discord-related functionality

router.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error('No access token received');
        }

        // Get user information
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        // Store user session (simplified - in production, use proper session management)
        req.session = req.session || {};
        req.session.discordUser = userData;

        res.redirect('/dashboard?auth=success');

    } catch (error) {
        console.error('Discord OAuth error:', error);
        res.redirect('/dashboard?auth=error');
    }
});

// Health check endpoint for Discord services
router.get('/health', async (req, res) => {
    try {
        const health = await unifiedDb.healthCheck();

        res.json({
            success: true,
            services: {
                unifiedDatabase: health.initialized,
                sqlite: health.sqlite,
                supabase: health.supabase && !!supabase,
                discordOAuth: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;