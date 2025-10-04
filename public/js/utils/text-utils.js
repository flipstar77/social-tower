/**
 * Text Utilities
 * Shared text manipulation functions
 */

const TextUtils = {
    /**
     * Truncate text to specified length with ellipsis
     */
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Calculate time ago from date
     */
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    },

    /**
     * Format view count (1500 -> 1.5K)
     */
    formatViewCount(count) {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    },

    /**
     * Format duration from ISO8601 (PT1H2M3S -> 1:02:03)
     */
    formatDuration(isoDuration) {
        if (!isoDuration) return 'N/A';

        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 'N/A';

        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.TextUtils = TextUtils;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextUtils;
}
