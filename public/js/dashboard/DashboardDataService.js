// Dashboard Data Service
// Responsible for all API calls and data fetching

class DashboardDataService {
    constructor() {
        this.apiBase = '/api/tower';
    }

    /**
     * Fetch latest statistics from API
     * @returns {Promise<Object>} Stats object
     */
    async fetchStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
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
            const response = await fetch(`${this.apiBase}/runs?limit=${limit}`);
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
                headers: {
                    'Content-Type': 'application/json'
                },
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
                method: 'DELETE'
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
