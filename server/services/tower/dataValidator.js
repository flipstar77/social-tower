/**
 * Service for validating Tower statistics data
 */
class DataValidator {
    /**
     * Validate statistics data
     * @param {Object} statsData - Statistics data to validate
     * @returns {string|null} Error message or null if valid
     */
    validateStatsData(statsData) {
        if (!statsData || typeof statsData !== 'object') {
            return 'Invalid statistics data - must be an object';
        }

        // Check required fields
        if (!statsData.tier && statsData.tier !== 0) {
            return 'Invalid statistics data - missing required field: tier';
        }

        if (!statsData.wave && statsData.wave !== 0) {
            return 'Invalid statistics data - missing required field: wave';
        }

        // Validate tier is a valid number
        if (typeof statsData.tier !== 'number' || statsData.tier < 0) {
            return 'Invalid statistics data - tier must be a non-negative number';
        }

        // Validate wave is a valid number
        if (typeof statsData.wave !== 'number' || statsData.wave < 0) {
            return 'Invalid statistics data - wave must be a non-negative number';
        }

        // Validate numeric fields if present
        const numericFields = [
            'coins_earned', 'cells_earned', 'damage_dealt', 'damage_taken',
            'total_enemies', 'gems_earned', 'medals_earned'
        ];

        for (const field of numericFields) {
            if (statsData[field] !== undefined && statsData[field] !== null) {
                const value = parseFloat(statsData[field]);
                if (isNaN(value) || value < 0) {
                    return `Invalid statistics data - ${field} must be a non-negative number`;
                }
            }
        }

        // Validate time fields if present
        const timeFields = ['game_time', 'real_time'];
        for (const field of timeFields) {
            if (statsData[field] && typeof statsData[field] === 'string') {
                if (!this.isValidTimeFormat(statsData[field])) {
                    return `Invalid statistics data - ${field} has invalid time format`;
                }
            }
        }

        return null; // Valid
    }

    /**
     * Check if time string has valid format
     * @param {string} timeString - Time string to validate
     * @returns {boolean} True if valid format
     */
    isValidTimeFormat(timeString) {
        // Accept formats like "2d 14h 15m 14s", "1h 30m", "45m 12s", etc.
        const timeRegex = /^(\d+[dhms]\s*)+$/;
        return timeRegex.test(timeString.trim());
    }

    /**
     * Validate run ID
     * @param {string|number} runId - Run ID to validate
     * @returns {string|null} Error message or null if valid
     */
    validateRunId(runId) {
        if (!runId) {
            return 'Run ID is required';
        }

        const id = parseInt(runId);
        if (isNaN(id) || id <= 0) {
            return 'Run ID must be a positive integer';
        }

        return null;
    }

    /**
     * Validate session name
     * @param {string} sessionName - Session name to validate
     * @returns {string|null} Error message or null if valid
     */
    validateSessionName(sessionName) {
        if (!sessionName) {
            return null; // Optional field
        }

        if (typeof sessionName !== 'string') {
            return 'Session name must be a string';
        }

        if (sessionName.length > 100) {
            return 'Session name must be 100 characters or less';
        }

        return null;
    }

    /**
     * Validate pagination parameters
     * @param {Object} params - Parameters object with limit and offset
     * @returns {Object} Validated and sanitized parameters
     */
    validatePaginationParams(params) {
        const { limit, offset } = params;

        const validatedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 1000);
        const validatedOffset = Math.max(parseInt(offset) || 0, 0);

        return {
            limit: validatedLimit,
            offset: validatedOffset
        };
    }

    /**
     * Validate metric parameter for progress tracking
     * @param {string} metric - Metric name to validate
     * @returns {string|null} Error message or null if valid
     */
    validateMetric(metric) {
        const validMetrics = [
            'tier', 'wave', 'damage_dealt', 'coins_earned', 'cells_earned',
            'total_enemies', 'gems_earned', 'medals_earned', 'damage_taken'
        ];

        if (!metric) {
            return null; // Optional, defaults to 'tier'
        }

        if (!validMetrics.includes(metric)) {
            return `Invalid metric. Valid options are: ${validMetrics.join(', ')}`;
        }

        return null;
    }
}

/**
 * Factory function to create data validator
 */
function createDataValidator() {
    return new DataValidator();
}

module.exports = createDataValidator;