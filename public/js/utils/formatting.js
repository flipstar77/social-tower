// Formatting Utilities Module
class FormattingUtils {
    // Number formatting with support for very large numbers
    static formatNumber(num) {
        // Handle pre-formatted strings
        if (typeof num === 'string' && /[KMBTQSNO]$/.test(num)) return num;

        // Parse the numeric value if it's a string
        num = this.parseNumericValue(num);

        // Use Number.toLocaleString with 'en-US' to ensure dot as decimal separator
        const formatWithSuffix = (value, suffix) => {
            return value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + suffix;
        };

        if (num >= 1e30) return formatWithSuffix(num / 1e30, 'N');
        if (num >= 1e27) return formatWithSuffix(num / 1e27, 'O');
        if (num >= 1e24) return formatWithSuffix(num / 1e24, 'S');
        if (num >= 1e21) return formatWithSuffix(num / 1e21, 's');
        if (num >= 1e18) return formatWithSuffix(num / 1e18, 'Q');
        if (num >= 1e15) return formatWithSuffix(num / 1e15, 'q');
        if (num >= 1e12) return formatWithSuffix(num / 1e12, 'T');
        if (num >= 1e9) return formatWithSuffix(num / 1e9, 'B');
        if (num >= 1e6) return formatWithSuffix(num / 1e6, 'M');
        if (num >= 1e3) return formatWithSuffix(num / 1e3, 'K');
        return num.toString();
    }

    // Parse numeric values from strings with multipliers
    static parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Clean the string thoroughly - remove $ and handle commas
        let str = value.toString().replace(/\$/g, '');

        // Handle European decimal notation (comma as decimal separator)
        // If it looks like "28,66K" convert comma to dot for decimal
        if (/^\d+,\d{1,2}[A-Za-z]?$/.test(str)) {
            str = str.replace(',', '.');
        } else {
            // Otherwise remove commas (thousands separators)
            str = str.replace(/,/g, '');
        }

        const multipliers = {
            'K': 1e3, 'k': 1e3,
            'M': 1e6, 'm': 1e6,
            'B': 1e9, 'b': 1e9,
            'T': 1e12, 't': 1e12,
            'q': 1e15, 'Q': 1e18,
            's': 1e21, 'S': 1e24,
            'O': 1e27, 'o': 1e27,
            'N': 1e30, 'n': 1e30
        };

        // Match number with optional suffix (case-sensitive for q vs Q)
        const match = str.match(/^([\d.]+)([KMBTqQsSNOkmbtno]?)$/);
        if (match) {
            const num = parseFloat(match[1]);
            const suffix = match[2]; // Keep original case for q vs Q distinction
            return num * (multipliers[suffix] || 1);
        }

        return parseFloat(str) || 0;
    }

    static formatNumberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Date formatting
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes ago';
        if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';
        if (diffInSeconds < 2592000) return Math.floor(diffInSeconds / 86400) + ' days ago';
        if (diffInSeconds < 31536000) return Math.floor(diffInSeconds / 2592000) + ' months ago';
        return Math.floor(diffInSeconds / 31536000) + ' years ago';
    }

    // Game time formatting
    static parseGameTime(timeString) {
        // Parse formats like "2d 6h 29m 19s" or "11h 8m 23s"
        const regex = /(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/;
        const match = timeString.match(regex);

        if (!match) return 0;

        const days = parseInt(match[1]) || 0;
        const hours = parseInt(match[2]) || 0;
        const minutes = parseInt(match[3]) || 0;
        const seconds = parseInt(match[4]) || 0;

        return days * 86400 + hours * 3600 + minutes * 60 + seconds;
    }

    static formatGameTime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (secs > 0) result += `${secs}s`;

        return result.trim() || '0s';
    }

    // European number parsing (comma as decimal separator)
    static parseEuropeanNumber(str) {
        if (typeof str !== 'string') return NaN;

        // Remove spaces and replace comma with dot
        const cleaned = str.replace(/\s/g, '').replace(',', '.');
        const num = parseFloat(cleaned);

        return isNaN(num) ? 0 : num;
    }

    // Text utilities
    static truncateText(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static capitalizeWords(str) {
        return str.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FormattingUtils = FormattingUtils;
}