const express = require('express');

/**
 * Simplified Tower router for Vercel serverless
 * Uses only Supabase, no SQLite or file system dependencies
 */
function createTowerRouter(supabaseManager) {
    const router = express.Router();

    // GET /api/tower/runs - Get all runs
    router.get('/runs', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 100;

            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const { data, error } = await supabaseManager.supabase
                .from('tower_runs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

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
                .order('created_at', { ascending: false })
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

    // POST /api/tower/runs - Create new run (for Discord bot)
    router.post('/runs', async (req, res) => {
        try {
            if (!supabaseManager || !supabaseManager.supabase) {
                return res.status(503).json({ error: 'Database not configured' });
            }

            const runData = req.body;

            const { data, error } = await supabaseManager.supabase
                .from('tower_runs')
                .insert([runData])
                .select();

            if (error) throw error;

            res.json({
                success: true,
                run: data[0]
            });
        } catch (error) {
            console.error('Error creating run:', error);
            res.status(500).json({ error: 'Failed to create run', message: error.message });
        }
    });

    return router;
}

module.exports = createTowerRouter;
