// Data Normalization Utilities
// Responsible for cleaning and normalizing data from various sources

class DataNormalizationUtils {
    /**
     * Extract clean time from potentially corrupted field
     * @param {string} timeStr - Time string (may contain extra data)
     * @returns {string} Clean time string (e.g., "3h 17m 52s")
     */
    static extractTime(timeStr) {
        if (!timeStr) return timeStr;
        // If the field contains corrupted data, extract just the time part
        const timeMatch = timeStr.match(/((?:\d+d\s+)?\d+h\s+\d+m\s+\d+s)/);
        return timeMatch ? timeMatch[1] : timeStr;
    }

    /**
     * Normalize European number format to English (comma -> period)
     * @param {string} str - Number string (e.g., "217,87T")
     * @returns {string} Normalized string (e.g., "217.87T")
     */
    static normalizeNumberFormat(str) {
        if (!str || typeof str !== 'string') return str;
        // Only normalize if it looks like a European number (has comma before 1-2 digits followed by suffix/end)
        // Examples: "217,87T", "14,32Q", "66,42N" -> "217.87T", "14.32Q", "66.42N"
        if (/\d,\d{1,2}([KMBTQPEZYRΛΠΣΩ]|a[a-z])?$/.test(str)) {
            return str.replace(',', '.');
        }
        return str;
    }

    /**
     * Clean and normalize all fields in raw_data object
     * @param {Object} rawData - Raw data object from API
     * @returns {Object} Cleaned data object
     */
    static cleanRawData(rawData) {
        if (!rawData) return {};

        const cleanData = { ...rawData };

        // Clean time fields
        if (cleanData.gameTime) cleanData.gameTime = this.extractTime(cleanData.gameTime);
        if (cleanData.realTime) cleanData.realTime = this.extractTime(cleanData.realTime);
        if (cleanData.game_time) cleanData.game_time = this.extractTime(cleanData.game_time);
        if (cleanData.real_time) cleanData.real_time = this.extractTime(cleanData.real_time);

        // Normalize all number formats (European comma -> English period)
        Object.keys(cleanData).forEach(key => {
            if (typeof cleanData[key] === 'string') {
                cleanData[key] = this.normalizeNumberFormat(cleanData[key]);
            }
        });

        return cleanData;
    }

    /**
     * Parse time string to hours for calculations
     * @param {string} timeString - Time string (e.g., "3h 17m 52s" or "3d 0h 20m 57s")
     * @returns {number} Total hours
     */
    static parseTimeToHours(timeString) {
        if (!timeString || typeof timeString !== 'string') return 0;

        let totalHours = 0;

        // Extract days, hours, minutes, seconds
        const daysMatch = timeString.match(/(\d+)d/);
        const hoursMatch = timeString.match(/(\d+)h/);
        const minutesMatch = timeString.match(/(\d+)m/);
        const secondsMatch = timeString.match(/(\d+)s/);

        if (daysMatch) totalHours += parseInt(daysMatch[1]) * 24;
        if (hoursMatch) totalHours += parseInt(hoursMatch[1]);
        if (minutesMatch) totalHours += parseInt(minutesMatch[1]) / 60;
        if (secondsMatch) totalHours += parseInt(secondsMatch[1]) / 3600;

        return totalHours;
    }

    /**
     * Calculate time ago from timestamp
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Human-readable time ago (e.g., "2 hours ago")
     */
    static getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataNormalizationUtils;
}
