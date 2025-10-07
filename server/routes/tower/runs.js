const express = require('express');
const fs = require('fs');
const { authenticateUser } = require('../../middleware/auth');
const { validate, schemas } = require('../../middleware/validation');

/**
 * Factory function to create runs router with dependencies
 */
function createRunsRouter(dependencies) {
    const { upload, runQueries, statsProcessor, dataValidator } = dependencies;
    const router = express.Router();

    // Apply auth middleware to all routes
    router.use(authenticateUser);

    // Upload and parse Tower statistics
    router.post('/upload-stats', upload.single('statsFile'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        try {
            const fileContent = fs.readFileSync(req.file.path, 'utf8');
            const parsedStats = statsProcessor.parseTowerStats(fileContent);

            if (!parsedStats) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to parse statistics file'
                });
            }

            // Add user ID from auth if available
            if (req.discordUserId) {
                parsedStats.discord_user_id = req.discordUserId;
                parsedStats.source = 'web';
            }

            // Save to database
            const runId = await runQueries.insertTowerRun(parsedStats);

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.json({
                success: true,
                message: 'Statistics uploaded successfully',
                runId: runId,
                data: parsedStats
            });

        } catch (error) {
            // Clean up uploaded file
            if (req.file && req.file.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to clean up uploaded file:', unlinkError);
                }
            }

            console.error('Error processing upload:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process uploaded file'
            });
        }
    });

    // Submit Tower statistics via JSON
    router.post('/submit-stats', async (req, res) => {
        try {
            const statsData = req.body;

            // Validate statistics data
            const validationError = dataValidator.validateStatsData(statsData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError
                });
            }

            const runId = await runQueries.insertTowerRun(statsData);

            res.json({
                success: true,
                message: 'Statistics saved successfully',
                runId: runId
            });

        } catch (error) {
            console.error('Error processing stats submission:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process statistics'
            });
        }
    });

    // Get all Tower runs
    router.get('/', validate(schemas.runsQuery, 'query'), async (req, res) => {
        const limit = req.query.limit;
        const offset = req.query.offset;
        const session = req.query.session;

        try {
            const runs = await runQueries.getAllRuns({
                limit: limit,
                offset: offset,
                session: session,
                discordUserId: req.discordUserId  // Filter by authenticated user
            });

            console.log(`📊 Fetched ${runs.length} runs for user: ${req.discordUserId || 'anonymous'}`);

            res.json({
                success: true,
                runs: runs,
                count: runs.length
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch runs: ' + error.message
            });
        }
    });

    // Get single Tower run
    router.get('/:id', validate(schemas.objectId, 'params'), async (req, res) => {
        const runId = req.params.id;

        try {
            const run = await runQueries.getRunById(runId);

            if (!run) {
                return res.status(404).json({
                    success: false,
                    error: 'Run not found'
                });
            }

            res.json({
                success: true,
                run: run
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch run'
            });
        }
    });

    // Delete a Tower run
    router.delete('/:id', validate(schemas.objectId, 'params'), async (req, res) => {
        const runId = req.params.id;

        try {
            const result = await runQueries.deleteRun(runId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Run not found'
                });
            }

            res.json({
                success: true,
                message: 'Run deleted successfully'
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete run'
            });
        }
    });

    // Update run category
    router.patch('/:id/category',
        validate(schemas.objectId, 'params'),
        validate(schemas.runCategory),
        async (req, res) => {
        const runId = req.params.id;
        const { category } = req.body;

        try {
            const result = await runQueries.updateRunCategory(runId, category);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Run not found'
                });
            }

            res.json({
                success: true,
                message: 'Run category updated successfully'
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update run category'
            });
        }
    });

    return router;
}

module.exports = createRunsRouter;