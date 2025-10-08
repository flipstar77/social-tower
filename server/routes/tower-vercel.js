const express = require('express');
const { createClient } = require('@supabase/supabase-js');

/**
 * Simplified Tower router for Vercel serverless
 * Uses only Supabase, no SQLite or file system dependencies
 */
function createTowerRouter(supabaseManager) {
    const router = express.Router();

    // Auth middleware - extract user from Supabase JWT
    router.use(async (req, res, next) => {
        const authHeader = req.headers.authorization;

        console.log('🔐 Vercel Auth Check:', {
            path: req.path,
            hasAuth: !!authHeader,
            method: req.method
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('⚠️ No auth token');
            req.user = null;
            req.discordUserId = null;
            return next();
        }

        try {
            const token = authHeader.substring(7);
            const { data: { user }, error } = await supabaseManager.supabase.auth.getUser(token);

            if (error || !user) {
                console.log('❌ Auth failed:', error?.message);
                req.user = null;
                req.discordUserId = null;
            } else {
                req.user = user;
                req.discordUserId = user.user_metadata?.provider_id || user.id;
                console.log(`✅ Authenticated: ${user.user_metadata?.full_name || user.id}`);
                console.log(`   Discord ID: ${req.discordUserId}`);
            }
        } catch (error) {
            console.error('❌ Auth error:', error.message);
            req.user = null;
            req.discordUserId = null;
        }

        next();
    });

    // GET /api/tower/runs - Get runs filtered by authenticated user
    router.get('/runs', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 100;

            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            // Build query with user filter
            let query = supabaseManager.supabase
                .from('tower_runs')
                .select('*')
                .order('submitted_at', { ascending: false })
                .limit(limit);

            // CRITICAL: Filter by authenticated user's Discord ID
            if (req.discordUserId) {
                query = query.eq('discord_user_id', req.discordUserId);
                console.log(`📊 Fetching runs for user: ${req.discordUserId}`);
            } else {
                console.log('⚠️ No user ID - returning empty results for security');
                return res.json({
                    success: true,
                    runs: [],
                    count: 0,
                    message: 'Please log in to see your runs'
                });
            }

            const { data, error } = await query;

            if (error) throw error;

            console.log(`✅ Returned ${data?.length || 0} runs for user ${req.discordUserId}`);

            res.json({
                success: true,
                runs: data || [],
                count: data?.length || 0
            });
        } catch (error) {
            console.error('Error fetching runs:', error);
            res.status(500).json({ error: 'Failed to fetch runs', message: error.message });
        }
    });

    // GET /api/tower/runs/:id - Get single run
    router.get('/runs/:id', async (req, res) => {
        try {
            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const { data, error } = await supabaseManager.supabase
                .from('tower_runs')
                .select('*')
                .eq('id', req.params.id)
                .single();

            if (error) throw error;

            res.json({
                success: true,
                run: data
            });
        } catch (error) {
            console.error('Error fetching run:', error);
            res.status(500).json({ error: 'Failed to fetch run', message: error.message });
        }
    });

    // DELETE /api/tower/runs/:id - Delete a run
    router.delete('/runs/:id', async (req, res) => {
        try {
            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const { error } = await supabaseManager.supabase
                .from('tower_runs')
                .delete()
                .eq('id', req.params.id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Run deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting run:', error);
            res.status(500).json({ error: 'Failed to delete run', message: error.message });
        }
    });

    // GET /api/tower/stats - Get aggregated stats
    router.get('/stats', async (req, res) => {
        try {
            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const { data, error } = await supabaseManager.supabase
                .from('tower_runs')
                .select('*')
                .order('submitted_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Calculate basic stats
            const runs = data || [];
            const stats = {
                totalRuns: runs.length,
                highestWave: Math.max(...runs.map(r => r.wave || 0), 0),
                highestTier: Math.max(...runs.map(r => r.tier || 0), 0),
                totalCoinsEarned: runs.reduce((sum, r) => sum + (r.coins_earned || 0), 0),
                averageWave: runs.length > 0 ? runs.reduce((sum, r) => sum + (r.wave || 0), 0) / runs.length : 0
            };

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error calculating stats:', error);
            res.status(500).json({ error: 'Failed to calculate stats', message: error.message });
        }
    });

    // POST /api/tower/runs - Create new run (for Discord bot or web upload)
    router.post('/runs', async (req, res) => {
        try {
            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const runData = req.body;
            console.log('📦 Received run data with fields:', {
                tier: runData.tier,
                wave: runData.wave,
                damage: runData.damage,
                coins: runData.coins,
                basicEnemies: runData.basicEnemies,
                fastEnemies: runData.fastEnemies,
                totalFields: Object.keys(runData).length,
                hasDiscordId: !!req.discordUserId
            });

            // Add authenticated user's Discord ID if available
            if (req.discordUserId && !runData.discordUserId) {
                runData.discordUserId = req.discordUserId;
                runData.source = 'web';
                console.log(`📝 Adding user ID to run: ${req.discordUserId}`);
            }

            console.log('🔄 Calling saveRun() with discordUserId:', runData.discordUserId);
            // Use saveRun() method which handles field mapping correctly
            const result = await supabaseManager.saveRun(runData);

            console.log('📊 saveRun() result:', { success: result.success, hasData: !!result.data, error: result.error });

            if (!result.success) {
                console.error('❌ saveRun() failed:', result.error);
                throw new Error(result.error);
            }

            console.log(`✅ Created run for user: ${runData.discordUserId || 'unknown'}`);

            res.json({
                success: true,
                run: result.data
            });
        } catch (error) {
            console.error('❌ Error creating run:', error);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({ error: 'Failed to create run', message: error.message });
        }
    });

    return router;
}

module.exports = createTowerRouter;
