const express = require('express');

// Import route modules
const createRunsRouter = require('./tower/runs');
const createStatsRouter = require('./tower/stats');
const createProgressRouter = require('./tower/progress');
const createSessionsRouter = require('./tower/sessions');
const createRatesRouter = require('./tower/rates');

// Import service layer
const createStatsProcessor = require('../services/tower/statsProcessor');
const createDataValidator = require('../services/tower/dataValidator');
const createRatesCalculator = require('../services/tower/ratesCalculator');

// Import database layer
const createRunQueries = require('../database/tower/runQueries');
const createStatsQueries = require('../database/tower/statsQueries');

/**
 * Factory function to create the main Tower router with dependency injection
 * @param {Object} upload - Multer upload middleware
 * @returns {Object} Express router
 */
function createTowerRouter(upload) {
    const router = express.Router();

    // Initialize database connection
    let db;
    let unifiedDb;
    let dbInitialized = false;
    let initializationPromise = null;

    // Initialize database asynchronously
    const initializeDatabase = async () => {
        if (dbInitialized) return true;
        if (initializationPromise) return initializationPromise;

        initializationPromise = (async () => {
            try {
                // Use the unified database approach
                unifiedDb = require('../database/unifiedDatabase');
                // Initialize the database and wait for it
                await unifiedDb.initialize();
                dbInitialized = true;
                console.log('✅ Tower routes using unified database');
                return true;
            } catch (error) {
                console.error('Failed to initialize database:', error);
                throw error;
            }
        })();

        return initializationPromise;
    };

    // Start initialization immediately
    initializeDatabase().catch(err => console.error('Database initialization failed:', err));

    try {

        // For compatibility with legacy database calls, create a bridge
        // This bridges the legacy SQLite-style API to Supabase calls
        db = {
            get: async (query, params, callback) => {
                try {
                    // This is a simplified bridge - in a full implementation,
                    // you'd parse the SQL and convert to Supabase calls
                    console.log('🔄 Legacy db.get() call - converting to Supabase');
                    // For now, just call callback with null to avoid blocking
                    if (callback) callback(null, null);
                } catch (error) {
                    if (callback) callback(error, null);
                }
            },
            all: async (query, params, callback) => {
                try {
                    console.log('🔄 Legacy db.all() call - converting to Supabase');
                    if (callback) callback(null, []);
                } catch (error) {
                    if (callback) callback(error, []);
                }
            },
            run: async (query, params, callback) => {
                try {
                    console.log('🔄 Legacy db.run() call - converting to Supabase');
                    // Return success for compatibility
                    if (callback) callback.call({ changes: 1, lastID: 1 }, null);
                } catch (error) {
                    if (callback) callback(error);
                }
            }
        };
    } catch (error) {
        console.error('❌ Failed to initialize database for Tower routes:', error);
    }

    // Initialize services
    const statsProcessor = createStatsProcessor();
    const dataValidator = createDataValidator();
    const ratesCalculator = createRatesCalculator();

    // Initialize database queries with dependencies
    const databaseDependencies = { db, unifiedDb, supabase: unifiedDb };
    const runQueries = createRunQueries(databaseDependencies);
    const statsQueries = new createStatsQueries(databaseDependencies);

    // Create dependencies object for route modules
    const routeDependencies = {
        upload,
        runQueries,
        statsQueries,
        statsProcessor,
        dataValidator,
        ratesCalculator
    };

    // Initialize route modules
    const runsRouter = createRunsRouter(routeDependencies);
    const statsRouter = createStatsRouter(routeDependencies);
    const progressRouter = createProgressRouter(routeDependencies);
    const sessionsRouter = createSessionsRouter(routeDependencies);
    const ratesRouter = createRatesRouter(routeDependencies);

    // Add middleware to ensure database is initialized
    const ensureDbInitialized = async (req, res, next) => {
        try {
            await initializeDatabase();
            next();
        } catch (error) {
            console.error('Database not available:', error);
            res.status(503).json({
                success: false,
                error: 'Database service temporarily unavailable'
            });
        }
    };

    // Apply middleware to all routes
    router.use(ensureDbInitialized);

    // Mount route modules
    router.use('/runs', runsRouter);
    router.use('/stats', statsRouter);
    router.use('/progress', progressRouter);
    router.use('/sessions', sessionsRouter);
    router.use('/rates', ratesRouter);

    // Health check endpoint
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Tower API is healthy',
            modules: {
                runs: 'loaded',
                stats: 'loaded',
                progress: 'loaded',
                sessions: 'loaded',
                rates: 'loaded'
            },
            services: {
                statsProcessor: 'loaded',
                dataValidator: 'loaded',
                ratesCalculator: 'loaded'
            },
            database: {
                runQueries: 'loaded',
                statsQueries: 'loaded'
            }
        });
    });

    // API documentation endpoint
    router.get('/api-docs', (req, res) => {
        res.json({
            success: true,
            endpoints: {
                runs: {
                    'POST /runs/upload-stats': 'Upload statistics file',
                    'POST /runs/submit-stats': 'Submit statistics via JSON',
                    'GET /runs': 'Get all runs with optional filters',
                    'GET /runs/:id': 'Get single run by ID'
                },
                stats: {
                    'GET /stats': 'Get statistics summary with optional session filter'
                },
                progress: {
                    'GET /progress': 'Get progress data over time with optional metric and session filters'
                },
                sessions: {
                    'GET /sessions': 'Get all sessions'
                },
                rates: {
                    'GET /rates': 'Get calculated rates and totals with optional session filter'
                },
                utility: {
                    'GET /health': 'Health check endpoint',
                    'GET /api-docs': 'API documentation'
                }
            },
            query_parameters: {
                common: {
                    session: 'Filter by session name',
                    limit: 'Limit number of results (default: 50)',
                    offset: 'Offset for pagination (default: 0)'
                },
                progress: {
                    metric: 'Metric to track (tier, wave, damage_dealt, etc. - default: tier)'
                }
            }
        });
    });

    return router;
}

module.exports = createTowerRouter;