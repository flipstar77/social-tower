const express = require('express');
const { authenticateUser } = require('../../middleware/auth');

/**
 * Factory function to create rates router with dependencies
 */
function createRatesRouter(dependencies) {
    const { statsQueries, ratesCalculator } = dependencies;
    const router = express.Router();

    // Apply auth middleware
    router.use(authenticateUser);

    // Get calculated rates and totals
    router.get('/', async (req, res) => {
        const session = req.query.session;

        try {
            const rawData = await statsQueries.getRatesData(session);

            if (!rawData.length) {
                return res.json({
                    success: true,
                    rates: {}
                });
            }

            const { totals, rates } = ratesCalculator.calculateRates(rawData);

            res.json({
                success: true,
                totals: totals,
                rates: rates,
                runs_count: rawData.length
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch rates data'
            });
        }
    });

    return router;
}

module.exports = createRatesRouter;