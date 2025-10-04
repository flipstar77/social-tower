const express = require('express');

/**
 * Factory function to create sessions router with dependencies
 */
function createSessionsRouter(dependencies) {
    const { statsQueries } = dependencies;
    const router = express.Router();

    // Get sessions
    router.get('/', async (req, res) => {
        try {
            const sessions = await statsQueries.getSessions();

            res.json({
                success: true,
                sessions: sessions
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch sessions'
            });
        }
    });

    return router;
}

module.exports = createSessionsRouter;