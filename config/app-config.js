/**
 * Centralized Application Configuration
 * Single source of truth for all app settings
 */

const APP_CONFIG = {
    // API Configuration
    api: {
        baseUrl: process.env.API_URL || 'http://localhost:6078',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000
    },

    // Update intervals (in milliseconds)
    updateIntervals: {
        youtube: 5 * 60 * 1000,      // 5 minutes
        reddit: 15 * 60 * 1000,      // 15 minutes
        towerStats: 30 * 1000        // 30 seconds
    },

    // Cache settings
    cache: {
        youtube: {
            key: 'youtube_videos',
            maxAge: 30 * 60 * 1000   // 30 minutes
        },
        reddit: {
            key: 'reddit_posts',
            maxAge: 15 * 60 * 1000   // 15 minutes
        },
        towerStats: {
            key: 'tower_stats',
            maxAge: 5 * 60 * 1000    // 5 minutes
        }
    },

    // UI Settings
    ui: {
        maxTilesPerCarousel: 50,
        animationDelay: 100, // ms between tiles
        notificationDuration: 3000 // ms
    }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
} else {
    window.APP_CONFIG = APP_CONFIG;
}
