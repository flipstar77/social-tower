/**
 * Reddit Configuration
 * Centralized Reddit feed settings
 */

const REDDIT_CONFIG = {
    subreddit: 'TheTowerGame',
    maxPosts: 25,

    // Flair color mapping
    flairColors: {
        'Strategy': '#4CAF50',
        'Bug Report': '#F44336',
        'Achievement': '#FF9800',
        'Question': '#2196F3',
        'Discussion': '#9C27B0',
        'Guide': '#00BCD4',
        'News': '#795548',
        'Feedback': '#E91E63',
        'Meme': '#8BC34A',
        'Meta': '#607D8B'
    },

    // API endpoints (fallback chain)
    apiEndpoints: {
        local: 'http://localhost:6078/api/reddit',
        direct: 'https://www.reddit.com/r/{subreddit}.json',
        proxy: 'https://api.allorigins.win/get?url='
    }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = REDDIT_CONFIG;
} else {
    window.REDDIT_CONFIG = REDDIT_CONFIG;
}
