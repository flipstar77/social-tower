const express = require('express');
const router = express.Router();

function createDiscordApiRouter(supabase) {
    // Simple working Discord runs endpoint for dashboard
    router.get('/discord-runs', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const leaderboard = await supabase.getGlobalLeaderboard(limit);

            if (!leaderboard.success) {
                return res.status(500).json({
                    success: false,
                    error: leaderboard.error
                });
            }

            res.json({
                success: true,
                runs: leaderboard.data
            });
        } catch (error) {
            console.error('Error in /api/discord-runs:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Discord Bot Integration - Link Discord account endpoint
    router.post('/discord/link', async (req, res) => {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'Link code is required'
                });
            }

            const validation = await supabase.validateLinkCode(code);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired link code'
                });
            }

            await supabase.useLinkCode(code);
            await supabase.linkUserToDashboard(validation.data.discord_id, code);

            res.json({
                success: true,
                message: 'Discord account linked successfully',
                discordId: validation.data.discord_id
            });

        } catch (error) {
            console.error('❌ Error linking Discord account:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Get user runs from Discord
    router.get('/discord/runs/:discordId', async (req, res) => {
        try {
            const { discordId } = req.params;
            const limit = parseInt(req.query.limit) || 10;

            const runs = await supabase.getUserRuns(discordId, limit);

            if (!runs.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch runs'
                });
            }

            res.json({
                success: true,
                runs: runs.data
            });

        } catch (error) {
            console.error('❌ Error fetching Discord runs:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Get server leaderboard
    router.get('/discord/leaderboard/:serverId', async (req, res) => {
        try {
            const { serverId } = req.params;
            const limit = parseInt(req.query.limit) || 10;

            const leaderboard = await supabase.getServerLeaderboard(serverId, limit);

            if (!leaderboard.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch leaderboard'
                });
            }

            res.json({
                success: true,
                leaderboard: leaderboard.data
            });

        } catch (error) {
            console.error('❌ Error fetching Discord leaderboard:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Get global leaderboard
    router.get('/discord/leaderboard', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const leaderboard = await supabase.getGlobalLeaderboard(limit);

            if (!leaderboard.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch global leaderboard'
                });
            }

            res.json({
                success: true,
                leaderboard: leaderboard.data
            });

        } catch (error) {
            console.error('❌ Error fetching global leaderboard:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // Sync Discord runs to local storage (for dashboard integration)
    router.post('/discord/sync/:discordId', async (req, res) => {
        try {
            const { discordId } = req.params;

            const runs = await supabase.getUserRuns(discordId, 100);

            if (!runs.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch runs for sync'
                });
            }

            // Convert to dashboard format and store in localStorage
            const dashboardRuns = runs.data.map(run => ({
                id: run.id,
                timestamp: run.submitted_at,
                tier: run.tier,
                wave: run.wave,
                damage_dealt: run.damage_dealt,
                coins_earned: run.coins_earned,
                research_spent: run.research_spent,
                duration: run.run_duration,
                source: 'discord'
            }));

            res.json({
                success: true,
                runs: dashboardRuns,
                message: `Synced ${dashboardRuns.length} runs from Discord`
            });

        } catch (error) {
            console.error('❌ Error syncing Discord runs:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    return router;
}

module.exports = createDiscordApiRouter;