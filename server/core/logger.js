/**
 * Logger
 * Centralized logging utilities
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logDir) {
        this.logDir = logDir;

        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Log to file
     */
    log(filename, message) {
        const logFile = path.join(this.logDir, filename);
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;

        fs.appendFileSync(logFile, logMessage);
    }

    /**
     * Log info
     */
    info(message, service = 'system') {
        const msg = `[INFO] ${message}`;
        console.log(msg);
        this.log(`${service}.log`, msg);
    }

    /**
     * Log error
     */
    error(message, service = 'system') {
        const msg = `[ERROR] ${message}`;
        console.error(msg);
        this.log(`${service}.error.log`, msg);
    }

    /**
     * Log warning
     */
    warn(message, service = 'system') {
        const msg = `[WARN] ${message}`;
        console.warn(msg);
        this.log(`${service}.log`, msg);
    }

    /**
     * Log debug (only if DEBUG env var is set)
     */
    debug(message, service = 'system') {
        if (process.env.DEBUG) {
            const msg = `[DEBUG] ${message}`;
            console.log(msg);
            this.log(`${service}.debug.log`, msg);
        }
    }

    /**
     * Get log file path
     */
    getLogPath(filename) {
        return path.join(this.logDir, filename);
    }

    /**
     * Read log file
     */
    readLog(filename, lines = 100) {
        const logFile = path.join(this.logDir, filename);

        if (!fs.existsSync(logFile)) {
            return null;
        }

        const content = fs.readFileSync(logFile, 'utf8');
        const allLines = content.split('\n');

        return allLines.slice(-lines).join('\n');
    }

    /**
     * List all log files
     */
    listLogs() {
        return fs.readdirSync(this.logDir);
    }

    /**
     * Clear log file
     */
    clearLog(filename) {
        const logFile = path.join(this.logDir, filename);
        if (fs.existsSync(logFile)) {
            fs.unlinkSync(logFile);
        }
    }

    /**
     * Clear all logs
     */
    clearAllLogs() {
        const files = fs.readdirSync(this.logDir);
        files.forEach(file => {
            fs.unlinkSync(path.join(this.logDir, file));
        });
    }
}

module.exports = Logger;
