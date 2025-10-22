/**
 * Secure Logger - Production-safe logging system
 * Automatically disables detailed logs in production
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = !IS_PRODUCTION;

class SecureLogger {
    /**
     * Development-only log - silent in production
     */
    static dev(...args) {
        if (IS_DEVELOPMENT) {
            console.log('[DEV]', ...args);
        }
    }

    /**
     * Info log - shows generic message in production
     */
    static info(message, data = null) {
        if (IS_DEVELOPMENT && data) {
            console.log(`[INFO] ${message}`, data);
        } else {
            console.log(`[INFO] ${message}`);
        }
    }

    /**
     * Warning log - safe for production
     */
    static warn(message) {
        console.warn(`[WARN] ${message}`);
    }

    /**
     * Error log - sanitized for production
     */
    static error(message, error = null) {
        if (IS_DEVELOPMENT && error) {
            console.error(`[ERROR] ${message}:`, error);
        } else {
            // In production, only log the message, not the full error object
            console.error(`[ERROR] ${message}`);
        }
    }

    /**
     * Success log - minimal in production
     */
    static success(message) {
        if (IS_DEVELOPMENT) {
            console.log(`✅ ${message}`);
        } else {
            console.log(`[SUCCESS] ${message}`);
        }
    }

    /**
     * Database log - silent in production
     */
    static db(message, data = null) {
        if (IS_DEVELOPMENT) {
            console.log(`[DB] ${message}`, data || '');
        }
        // Silent in production - don't expose database details
    }

    /**
     * Auth log - minimal in production
     */
    static auth(message, userId = null) {
        if (IS_DEVELOPMENT) {
            console.log(`[AUTH] ${message}`, userId ? `User: ${userId}` : '');
        } else {
            console.log('[AUTH] Authentication event');
        }
    }

    /**
     * API log - safe for production
     */
    static api(method, route, statusCode) {
        const timestamp = new Date().toISOString();
        console.log(`[API] ${timestamp} ${method} ${route} ${statusCode}`);
    }
}

module.exports = SecureLogger;
