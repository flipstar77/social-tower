const express = require('express');
const { authenticateUser } = require('../../middleware/auth');

/**
 * Factory function to create progress router with dependencies
 */
function createProgressRouter(dependencies) {
    const { statsQueries } = dependencies;
    const router = express.Router();

    // Apply auth middleware
    router.use(authenticateUser);

    // Get progress over time
    router.get('/', async (req, res) => {
        const session = req.query.session;
        const metric = req.query.metric || 'tier'; // tier, wave, damage_dealt, etc.

        try {
            // CRITICAL: Filter by authenticated user
            const progress = await statsQueries.getProgressData({
                session,
                metric,
                discordUserId: req.discordUserId
            });

            res.json({
                success: true,
                progress: progress,
                metric: metric
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch progress data'
            });
        }
    });

    return router;
}

module.exports = createProgressRouter;