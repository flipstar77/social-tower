const express = require('express');
const router = express.Router();
const TowerLolScraper = require('../services/tower-lol-scraper');
const { validate, schemas } = require('../middleware/validation');

/**
 * Tournament bracket difficulty analysis API
 * Routes for analyzing player performance across brackets
 */

let scraper = null;

// Initialize scraper with Supabase
router.use((req, res, next) => {
    if (!scraper && req.app.locals.supabase) {
        scraper = new TowerLolScraper(req.app.locals.supabase);
    }
    next();
});

/**
 * GET /api/tournament-brackets/difficulty/:playerId
 * Get bracket difficulty analysis for a player
 */
router.get('/difficulty/:playerId', validate(schemas.tournamentPlayerId, 'params'), async (req, res) => {
    try {
        const { playerId } = req.params;
        const { league = 'Legend' } = req.query;

        console.log(`📊 Analyzing bracket difficulty for player ${playerId} in ${league} league...`);

        // Get latest tournament data for this league
        const brackets = await scraper.getLatestTournamentData(league);

        if (brackets.length === 0) {
            return res.json({
                success: false,
                error: 'No tournament data available for this league. Please run a scrape first.',
                league,
                playerId
            });
        }

        // Find player in the brackets
        let playerData = null;
        for (const bracket of brackets) {
            const player = bracket.players.find(p => p.playerId === playerId);
            if (player) {
                playerData = {
                    ...player,
                    bracketId: bracket.bracketId
                };
                break;
            }
        }

        if (!playerData) {
            return res.json({
                success: false,
                error: `Player ${playerId} not found in ${league} league for the latest tournament`,
                league,
                playerId
            });
        }

        // Calculate difficulty
        const analysis = scraper.calculateBracketDifficulty(
            playerId,
            playerData.wave,
            brackets
        );

        res.json({
            success: true,
            player: {
                id: playerId,
                name: playerData.name,
                realName: playerData.realName,
                wave: playerData.wave,
                actualRank: playerData.rank
            },
            league,
            analysis,
            totalBrackets: brackets.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error analyzing bracket difficulty:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tournament-brackets/stats/:league
 * Get overall statistics for a league's latest tournament
 */
router.get('/stats/:league', async (req, res) => {
    try {
        const { league } = req.params;

        console.log(`📊 Fetching stats for ${league} league...`);

        const brackets = await scraper.getLatestTournamentData(league);

        if (brackets.length === 0) {
            return res.json({
                success: false,
                error: 'No tournament data available for this league',
                league
            });
        }

        // Calculate overall stats
        const allWaves = brackets.flatMap(b => b.players.map(p => p.wave));
        const winnerWaves = brackets.map(b => b.players[0]?.wave || 0);
        const medianWaves = brackets.map(b => b.medianWave);

        const stats = {
            totalBrackets: brackets.length,
            totalPlayers: brackets.reduce((sum, b) => sum + b.players.length, 0),

            waveStats: {
                min: Math.min(...allWaves),
                max: Math.max(...allWaves),
                average: (allWaves.reduce((a, b) => a + b, 0) / allWaves.length).toFixed(0)
            },

            winnerStats: {
                min: Math.min(...winnerWaves),
                max: Math.max(...winnerWaves),
                average: (winnerWaves.reduce((a, b) => a + b, 0) / winnerWaves.length).toFixed(0)
            },

            medianStats: {
                min: Math.min(...medianWaves),
                max: Math.max(...medianWaves),
                average: (medianWaves.reduce((a, b) => a + b, 0) / medianWaves.length).toFixed(0)
            },

            // Top 5 hardest brackets (highest total waves)
            hardestBrackets: brackets
                .sort((a, b) => b.totalWaves - a.totalWaves)
                .slice(0, 5)
                .map(b => ({
                    bracketId: b.bracketId,
                    totalWaves: b.totalWaves,
                    medianWave: b.medianWave,
                    winnerWave: b.players[0]?.wave || 0
                })),

            // Top 5 easiest brackets (lowest total waves)
            easiestBrackets: brackets
                .sort((a, b) => a.totalWaves - b.totalWaves)
                .slice(0, 5)
                .map(b => ({
                    bracketId: b.bracketId,
                    totalWaves: b.totalWaves,
                    medianWave: b.medianWave,
                    winnerWave: b.players[0]?.wave || 0
                }))
        };

        res.json({
            success: true,
            league,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error fetching league stats:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tournament-brackets/user/:discordUserId
 * Get bracket difficulty analysis for all of a user's tournament runs
 */
router.get('/user/:discordUserId', async (req, res) => {
    try {
        const { discordUserId } = req.params;
        const { limit = 10 } = req.query;

        console.log(`📊 Fetching bracket difficulty for user ${discordUserId}...`);

        if (!scraper || !scraper.supabase || !scraper.supabase.supabase) {
            return res.json({
                success: false,
                error: 'Database not configured'
            });
        }

        const { data, error } = await scraper.supabase.supabase
            .from('bracket_difficulty_analysis')
            .select('*')
            .eq('discord_user_id', discordUserId)
            .order('analyzed_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            success: true,
            discordUserId,
            analyses: data || [],
            count: data?.length || 0
        });

    } catch (error) {
        console.error('❌ Error fetching user bracket difficulty:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tournament-brackets/run/:runId
 * Get bracket difficulty analysis for a specific run
 */
router.get('/run/:runId', async (req, res) => {
    try {
        const { runId } = req.params;

        console.log(`📊 Fetching bracket difficulty for run ${runId}...`);

        if (!scraper || !scraper.supabase || !scraper.supabase.supabase) {
            return res.json({
                success: false,
                error: 'Database not configured'
            });
        }

        const { data, error } = await scraper.supabase.supabase
            .from('bracket_difficulty_analysis')
            .select('*')
            .eq('run_id', parseInt(runId))
            .single();

        if (error || !data) {
            return res.json({
                success: false,
                error: 'No bracket difficulty analysis found for this run'
            });
        }

        res.json({
            success: true,
            runId,
            analysis: data
        });

    } catch (error) {
        console.error('❌ Error fetching run bracket difficulty:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tournament-brackets/scrape
 * Trigger a manual scrape of tournament data
 * NOTE: This will be implemented with Playwright browser automation
 */
router.post('/scrape', async (req, res) => {
    try {
        const { league = 'All' } = req.body;

        res.json({
            success: false,
            message: 'Browser-based scraping not yet implemented. This requires Playwright automation to scrape the Streamlit app at thetower.lol',
            league,
            nextSteps: [
                'Implement Playwright scraper to fetch bracket data from thetower.lol/liveresults',
                'Parse bracket IDs and player data from the Streamlit interface',
                'Store in database for analysis'
            ]
        });

    } catch (error) {
        console.error('❌ Error scraping tournament data:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tournament-brackets/automation/status
 * Get status of automated tournament scraping
 */
router.get('/automation/status', (req, res) => {
    const automationService = req.app.locals.tournamentAutomation;

    if (!automationService) {
        return res.json({
            success: false,
            error: 'Automation service not initialized'
        });
    }

    res.json({
        success: true,
        ...automationService.getStatus()
    });
});

/**
 * POST /api/tournament-brackets/automation/trigger
 * Manually trigger full tournament analysis
 */
router.post('/automation/trigger', async (req, res) => {
    const automationService = req.app.locals.tournamentAutomation;

    if (!automationService) {
        return res.status(500).json({
            success: false,
            error: 'Automation service not initialized'
        });
    }

    console.log('🚀 Manually triggering tournament analysis...');

    // Run in background
    automationService.runFullTournamentAnalysis()
        .then(result => {
            console.log('✅ Tournament analysis completed:', result);
        })
        .catch(error => {
            console.error('❌ Tournament analysis failed:', error);
        });

    res.json({
        success: true,
        message: 'Tournament analysis started in background',
        status: 'Processing...'
    });
});

module.exports = router;
