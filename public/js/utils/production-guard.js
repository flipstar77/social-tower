/**
 * Production Guard - Quick fix to disable all console logs in production
 * Load this FIRST before any other scripts
 */

(function() {
    // Detect if we're in production
    const isProduction = window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('.local');

    if (isProduction) {
        // Save original console methods
        const noop = function() {};

        // Override console methods in production
        console.log = noop;
        console.info = noop;
        console.warn = noop;
        console.debug = noop;

        // Keep console.error but sanitize it
        const originalError = console.error;
        console.error = function(...args) {
            // Only log generic error message, no details
            originalError('An error occurred');
        };

        console.log('🔒 Production mode: Console logging disabled');
    } else {
        console.log('🔓 Development mode: Full logging enabled');
    }
})();
