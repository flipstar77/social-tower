const Joi = require('joi');
const logger = require('../core/logger');

/**
 * Validation middleware factory
 * Creates Express middleware that validates request data using Joi schemas
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown properties
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            logger.warn('Validation failed', {
                path: req.path,
                method: req.method,
                errors,
                ip: req.ip,
            });

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace request data with validated and sanitized data
        req[property] = value;
        next();
    };
};

/**
 * Common validation schemas
 */
const schemas = {
    // Reddit post query parameters
    redditQuery: Joi.object({
        subreddit: Joi.string().alphanum().min(3).max(30).default('TheTowerGame'),
        limit: Joi.number().integer().min(1).max(100).default(25),
        sort: Joi.string().valid('hot', 'new', 'top', 'rising').default('hot'),
    }),

    // Tower stats submission
    towerStats: Joi.object({
        tier: Joi.number().integer().min(1).max(50).required(),
        wave: Joi.number().integer().min(1).required(),
        coins: Joi.number().min(0).required(),
        cells: Joi.number().min(0).required(),
        shards: Joi.number().min(0),
        gameTime: Joi.string().pattern(/^\d+[dhms\s]+$/),
        realTime: Joi.string().pattern(/^\d+[dhms\s]+$/),
        death: Joi.string().max(100),
        isTournament: Joi.boolean().default(false),
    }),

    // Tournament submission
    tournament: Joi.object({
        date: Joi.date().iso().required(),
        name: Joi.string().min(3).max(100).required(),
        rank: Joi.number().integer().min(1).required(),
        score: Joi.number().integer().min(0).required(),
        tier: Joi.number().integer().min(1).max(50).required(),
        wave: Joi.number().integer().min(1).required(),
        rewards: Joi.string().max(500).allow(''),
    }),

    // User profile update
    userProfile: Joi.object({
        username: Joi.string().min(3).max(30).alphanum(),
        email: Joi.string().email(),
        preferences: Joi.object({
            theme: Joi.string().valid('light', 'dark', 'auto'),
            notifications: Joi.boolean(),
        }),
    }),

    // Search query
    search: Joi.object({
        query: Joi.string().min(2).max(200).required(),
        limit: Joi.number().integer().min(1).max(50).default(10),
        offset: Joi.number().integer().min(0).default(0),
    }),

    // Pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().max(50),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    }),

    // ID parameter
    objectId: Joi.object({
        id: Joi.alternatives()
            .try(Joi.string().uuid(), Joi.number().integer().positive())
            .required(),
    }),

    // Discord authentication
    discordAuth: Joi.object({
        code: Joi.string().required(),
        state: Joi.string(),
    }),

    // Tower runs query
    runsQuery: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0),
        session: Joi.string().max(100),
    }),

    // Run category update
    runCategory: Joi.object({
        category: Joi.string().valid('milestone', 'tournament', 'farm', '').allow(null).default(null),
    }),

    // Video transcript request
    videoId: Joi.object({
        videoId: Joi.string().alphanum().min(11).max(11).required(),
    }),

    // Tournament bracket queries
    tournamentPlayerId: Joi.object({
        playerId: Joi.string().required(),
    }),

    tournamentLeague: Joi.object({
        league: Joi.string().valid('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster').required(),
    }),

    tournamentUserId: Joi.object({
        discordUserId: Joi.string().required(),
    }),

    tournamentRunId: Joi.object({
        runId: Joi.alternatives().try(Joi.string().uuid(), Joi.number().integer()).required(),
    }),

    // Tournament scrape body
    tournamentScrapeBody: Joi.object({
        playerId: Joi.string().required(),
        playerName: Joi.string().max(100),
        manualTrigger: Joi.boolean().default(false),
    }),
};

/**
 * Sanitization helpers
 */
const sanitize = {
    /**
     * Remove potentially dangerous characters from string
     */
    cleanString: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[<>]/g, '').trim();
    },

    /**
     * Clean object recursively
     */
    cleanObject: (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                cleaned[key] = sanitize.cleanString(value);
            } else if (typeof value === 'object' && value !== null) {
                cleaned[key] = sanitize.cleanObject(value);
            } else {
                cleaned[key] = value;
            }
        }
        return cleaned;
    },
};

module.exports = {
    validate,
    schemas,
    sanitize,
};
