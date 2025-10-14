/**
 * Centralized API Configuration
 * Automatically detects environment and uses correct backend URL
 */

const API_CONFIG = {
    // Backend API base URL (Railway for production, localhost for development)
    getBaseUrl() {
        // Check if we're on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:6078';
        }

        // Production: Always use Railway backend
        return 'https://social-tower-production.up.railway.app';
    },

    // Helper to get full API URL
    getApiUrl(endpoint) {
        const base = this.getBaseUrl();
        // Remove leading slash if present to avoid double slashes
        const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${base}/${path}`;
    }
};

// Make available globally
window.API_CONFIG = API_CONFIG;

console.log('🔧 API Config loaded:', API_CONFIG.getBaseUrl());
