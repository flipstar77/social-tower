// Dashboard Data Service
// Responsible for all API calls and data fetching

class DashboardDataService {
    constructor() {
        this.apiBase = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() + '/api/tower' : '/api/tower';
    }

    /**
     * Get authentication headers for API requests (synchronous)
     * CRITICAL: Always include auth token to ensure user data isolation
     */
    _getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        try {
            // Get session from Supabase localStorage (sb-<project>-auth-token)
            const storageKeys = Object.keys(localStorage).filter(key =>
                key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            if (storageKeys.length > 0) {
                const sessionData = JSON.parse(localStorage.getItem(storageKeys[0]));
                if (sessionData?.access_token) {
                    headers['Authorization'] = `Bearer ${sessionData.access_token}`;
                    console.log('🔐 Including auth token in API request');
                } else {
                    console.warn('⚠️ No access token in session data - API may return no data');
                }
            } else {
                console.warn('⚠️ No Supabase session found in localStorage - API may return no data');
            }
        } catch (error) {
            console.error('❌ Error getting auth headers:', error);
        }

        return headers;
    }

    /**
     * Get authentication headers (async version using Supabase API)
     */
    async _getAuthHeadersAsync() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (window.supabaseClient) {
            try {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                    console.log('🔐 Including auth token in API request (async)');
                } else if (error) {
                    console.error('❌ Error getting session:', error);
                } else {
                    console.warn('⚠️ No active session - API may return no data');
                }
            } catch (error) {
                console.error('❌ Error getting auth headers:', error);
            }
        } else {
            console.warn('⚠️ Supabase client not initialized');
        }

        return headers;
    }

    /**
     * Fetch latest statistics from API
     * @returns {Promise<Object>} Stats object
     */
    async fetchStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`, {
                headers: this._getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('📊 Loaded stats from API:', data);
            return data.stats || data;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            throw error;
        }
    }

    /**
     * Fetch runs from API
     * @param {number} limit - Number of runs to fetch
     * @returns {Promise<Array>} Array of run objects
     */
    async fetchRuns(limit = 10) {
        try {
            console.log(`📥 Loading ${limit} runs from API...`);
            const response = await fetch(`${this.apiBase}/runs?limit=${limit}`, {
                headers: this._getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.success && data.runs && data.runs.length > 0) {
                console.log(`✅ Loaded ${data.runs.length} runs from API`);
                return this.transformRuns(data.runs);
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch runs:', error);
            return [];
        }
    }

    /**
     * Transform API runs to session format with cleaned data
     * @param {Array} runs - Raw runs from API
     * @returns {Array} Transformed sessions
     */
    transformRuns(runs) {
        return runs.map(run => {
            const isTournament = run.is_tournament || run.raw_data?.isTournament || false;
            console.log(`📊 Processing run: Tier ${run.tier}, Wave ${run.wave}, isTournament:`, isTournament);

            // Clean and normalize raw_data
            const cleanRawData = DataNormalizationUtils.cleanRawData(run.raw_data);

            // Extract all fields from raw_data for comprehensive stats
            return {
                sessionId: run.id,
                timestamp: run.submitted_at || new Date().toISOString(),
                tier: parseInt(run.tier) || 0,
                wave: parseInt(run.wave) || 0,
                coins: DataNormalizationUtils.normalizeNumberFormat(run.coins_earned || cleanRawData?.coins || '0'),
                damage: DataNormalizationUtils.normalizeNumberFormat(run.damage_dealt || cleanRawData?.damage || '0'),
                source: run.submission_source || 'api',
                isDiscordSubmission: run.submission_source === 'discord',
                isTournament: isTournament,
                // Include ALL cleaned raw_data fields for comprehensive stats display
                ...cleanRawData
            };
        });
    }

    /**
     * Submit new run to API
     * @param {Object} runData - Run data to submit
     * @returns {Promise<Object>} API response
     */
    async submitRun(runData) {
        try {
            const response = await fetch(`${this.apiBase}/runs`, {
                method: 'POST',
                headers: this._getAuthHeaders(),
                body: JSON.stringify(runData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to submit run:', error);
            throw error;
        }
    }

    /**
     * Delete run from API
     * @param {string} runId - Run ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteRun(runId) {
        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}`, {
                method: 'DELETE',
                headers: this._getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to delete run:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardDataService;
}
