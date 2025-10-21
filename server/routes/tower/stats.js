const express = require('express');
const { authenticateUser } = require('../../middleware/auth');

/**
 * Factory function to create stats router with dependencies
 */
function createStatsRouter(dependencies) {
    const { statsQueries } = dependencies;
    const router = express.Router();

    // Apply auth middleware to all routes
    router.use(authenticateUser);

    // Get Tower statistics summary
    router.get('/', async (req, res) => {
        const session = req.query.session;

        try {
            // CRITICAL: Filter stats by authenticated user
            const stats = await statsQueries.getStatsSummary({
                session,
                discordUserId: req.discordUserId
            });

            console.log(`📊 Stats fetched for user: ${req.discordUserId || 'anonymous'}`);

            res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics'
            });
        }
    });

    return router;
}

module.exports = createStatsRouter;