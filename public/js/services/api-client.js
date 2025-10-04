/**
 * API Client Service
 * Centralized HTTP client with error handling and retries
 */

class ApiClient {
    constructor(baseUrl = 'http://localhost:6078') {
        this.baseUrl = baseUrl;
        this.defaultTimeout = 10000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Make GET request with timeout and retry logic
     */
    async get(endpoint, options = {}) {
        return this._request('GET', endpoint, null, options);
    }

    /**
     * Make POST request
     */
    async post(endpoint, data, options = {}) {
        return this._request('POST', endpoint, data, options);
    }

    /**
     * Make PUT request
     */
    async put(endpoint, data, options = {}) {
        return this._request('PUT', endpoint, data, options);
    }

    /**
     * Make DELETE request
     */
    async delete(endpoint, options = {}) {
        return this._request('DELETE', endpoint, null, options);
    }

    /**
     * Internal request handler with retry logic
     */
    async _request(method, endpoint, data = null, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const timeout = options.timeout || this.defaultTimeout;
        const retries = options.retries !== undefined ? options.retries : this.retryAttempts;

        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const fetchOptions = {
                    method,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options.headers || {})
                    }
                };

                if (data && (method === 'POST' || method === 'PUT')) {
                    fetchOptions.body = JSON.stringify(data);
                }

                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                return { success: true, data: result };

            } catch (error) {
                lastError = error;

                // Don't retry on abort or 4xx errors
                if (error.name === 'AbortError' || (error.message && error.message.includes('HTTP 4'))) {
                    break;
                }

                // Wait before retry
                if (attempt < retries) {
                    await this._delay(this.retryDelay * (attempt + 1));
                    console.log(`Retrying request to ${endpoint} (attempt ${attempt + 2}/${retries + 1})`);
                }
            }
        }

        return {
            success: false,
            error: lastError.message || 'Request failed',
            originalError: lastError
        };
    }

    /**
     * Fetch with multiple fallback URLs
     */
    async fetchWithFallbacks(urls, options = {}) {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`Trying URL ${i + 1}/${urls.length}: ${url}`);

            const result = await this.get(url, { ...options, retries: 0 });

            if (result.success) {
                console.log(`✅ Success with URL ${i + 1}`);
                return result;
            }

            console.log(`❌ Failed with URL ${i + 1}: ${result.error}`);
        }

        return {
            success: false,
            error: 'All fallback URLs failed'
        };
    }

    /**
     * Helper: delay promise
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
