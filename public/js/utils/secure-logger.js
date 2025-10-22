/**
 * Secure Frontend Logger
 * Automatically disables detailed console logs in production
 * Prevents exposing:
 * - API structures and endpoints
 * - Database technology details
 * - Raw API responses
 * - Internal implementation details
 */

class SecureLogger {
    constructor() {
        // Detect production mode
        this.isProduction = window.location.hostname !== 'localhost' &&
                           window.location.hostname !== '127.0.0.1' &&
                           !window.location.hostname.includes('.local');

        this.isDevelopment = !this.isProduction;
    }

    /**
     * Development-only log - silent in production
     */
    dev(...args) {
        if (this.isDevelopment) {
            console.log('[DEV]', ...args);
        }
    }

    /**
     * Info log - minimal in production
     */
    info(message) {
        if (this.isDevelopment) {
            console.log(`[INFO] ${message}`);
        }
    }

    /**
     * Warning log - safe for production
     */
    warn(message) {
        if (this.isDevelopment) {
            console.warn(`[WARN] ${message}`);
        }
    }

    /**
     * Error log - sanitized for production
     */
    error(message, error = null) {
        if (this.isDevelopment && error) {
            console.error(`[ERROR] ${message}:`, error);
        } else if (this.isDevelopment) {
            console.error(`[ERROR] ${message}`);
        }
        // Silent in production - errors are logged server-side
    }

    /**
     * Success log - minimal in production
     */
    success(message) {
        if (this.isDevelopment) {
            console.log(`✅ ${message}`);
        }
    }

    /**
     * API log - silent in production (prevents endpoint discovery)
     */
    api(message, data = null) {
        if (this.isDevelopment) {
            console.log(`[API] ${message}`, data || '');
        }
        // Silent in production - don't expose API structure
    }

    /**
     * UI event log - silent in production
     */
    ui(message) {
        if (this.isDevelopment) {
            console.log(`[UI] ${message}`);
        }
    }
}

// Export singleton instance
window.SecureLogger = new SecureLogger();
