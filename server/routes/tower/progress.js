const express = require('express');

/**
 * Factory function to create progress router with dependencies
 */
function createProgressRouter(dependencies) {
    const { statsQueries } = dependencies;
    const router = express.Router();

    // Get progress over time
    router.get('/', async (req, res) => {
        const session = req.query.session;
        const metric = req.query.metric || 'tier'; // tier, wave, damage_dealt, etc.

        try {
            const progress = await statsQueries.getProgressData(session, metric);

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