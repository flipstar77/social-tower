const express = require('express');

/**
 * Factory function to create stats router with dependencies
 */
function createStatsRouter(dependencies) {
    const { statsQueries } = dependencies;
    const router = express.Router();

    // Get Tower statistics summary
    router.get('/', async (req, res) => {
        const session = req.query.session;

        try {
            const stats = await statsQueries.getStatsSummary(session);

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