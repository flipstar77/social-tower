/**
 * Database queries for Tower statistics - Supabase Version
 */
class StatsQueries {
    constructor(dependencies) {
        // Use unifiedDb which has the Supabase client
        console.log('🔧 StatsQueries debug - unifiedDb:', typeof dependencies.unifiedDb);
        console.log('🔧 StatsQueries debug - unifiedDb.supabase:', typeof dependencies.unifiedDb?.supabase);
        this.unifiedDb = dependencies.unifiedDb;
    }

    /**
     * Get statistics summary
     * @param {Object} options - Query options
     * @param {string} options.session - Optional session filter
     * @param {string} options.discordUserId - User ID to filter by (REQUIRED for data isolation)
     * @returns {Promise<Object>} Statistics summary
     */
    async getStatsSummary(options = {}) {
        // Support both old (session) and new ({ session, discordUserId }) signatures
        const session = typeof options === 'string' ? options : options.session;
        const discordUserId = typeof options === 'object' ? options.discordUserId : null;

        try {
            // Check if database is initialized
            if (!this.unifiedDb || !this.unifiedDb.supabase || this.unifiedDb.supabase === null) {
                console.log('⚠️ Database not initialized yet');
                return {
                    total_runs: 0,
                    max_tier: 0,
                    max_wave: 0,
                    total_coins: 0,
                    avg_tier: 0,
                    avg_wave: 0,
                    max_damage: 0,
                    total_damage_dealt: 0,
                    coins_per_hour: 0,
                    total_play_time_hours: 0
                };
            }

            let query = this.unifiedDb.supabase
                .from('tower_runs')
                .select('*');

            // CRITICAL: Filter by user ID if provided
            if (discordUserId) {
                query = query.eq('discord_user_id', discordUserId);
                console.log(`🔐 Filtering stats for user: ${discordUserId}`);
            } else {
                console.warn('⚠️ No user ID provided - returning empty stats for security');
                return {
                    total_runs: 0,
                    max_tier: 0,
                    max_wave: 0,
                    total_coins: 0,
                    avg_tier: 0,
                    avg_wave: 0,
                    max_damage: 0,
                    total_damage_dealt: 0,
                    coins_per_hour: 0,
                    total_play_time_hours: 0
                };
            }

            // Note: session_name column doesn't exist in Supabase, removed filter

            const { data: runs, error } = await query;

            if (error) {
                throw error;
            }

            if (!runs || runs.length === 0) {
                return {};
            }

            // Calculate stats from the data
            const stats = {
                total_runs: runs.length,
                max_tier: Math.max(...runs.map(r => parseInt(r.tier) || 0)),
                max_wave: Math.max(...runs.map(r => parseInt(r.wave) || 0)),
                avg_tier: runs.reduce((sum, r) => sum + (parseInt(r.tier) || 0), 0) / runs.length,
                avg_wave: runs.reduce((sum, r) => sum + (parseInt(r.wave) || 0), 0) / runs.length,
                total_enemies_killed: runs.reduce((sum, r) => sum + (parseInt(r.total_enemies) || 0), 0),
                max_damage: Math.max(...runs.map(r => this.parseNumericValue(r.damage_dealt) || 0)),
                first_run: Math.min(...runs.map(r => new Date(r.submitted_at).getTime())),
                last_run: Math.max(...runs.map(r => new Date(r.submitted_at).getTime())),
                total_cannon_shards: runs.reduce((sum, r) => sum + (parseInt(r.cannon_shards) || 0), 0),
                total_armor_shards: runs.reduce((sum, r) => sum + (parseInt(r.armor_shards) || 0), 0),
                total_generator_shards: runs.reduce((sum, r) => sum + (parseInt(r.generator_shards) || 0), 0),
                total_core_shards: runs.reduce((sum, r) => sum + (parseInt(r.core_shards) || 0), 0),
                total_common_modules: runs.reduce((sum, r) => sum + (parseInt(r.common_modules) || 0), 0),
                total_rare_modules: runs.reduce((sum, r) => sum + (parseInt(r.rare_modules) || 0), 0),
                total_gems_earned: runs.reduce((sum, r) => sum + (parseInt(r.gems) || 0), 0),
                total_medals_earned: runs.reduce((sum, r) => sum + (parseInt(r.medals) || 0), 0),
                total_reroll_shards: runs.reduce((sum, r) => sum + (parseInt(r.reroll_shards) || 0), 0)
            };

            return stats;
        } catch (error) {
            console.error('StatsQueries.getStatsSummary error:', error);
            throw error;
        }
    }

    /**
     * Get progress data over time
     * @param {Object} options - Query options
     * @param {string} options.session - Optional session filter
     * @param {string} options.metric - Metric to track (tier, wave, damage_dealt, etc.)
     * @param {string} options.discordUserId - User ID to filter by (REQUIRED)
     * @returns {Promise<Array>} Progress data points
     */
    async getProgressData(options = {}) {
        const { session = null, metric = 'tier', discordUserId } = options;

        try {
            let query = this.unifiedDb.supabase
                .from('tower_runs')
                .select('submitted_at, tier, wave, damage_dealt, coins_earned')
                .order('submitted_at', { ascending: true });

            // CRITICAL: Filter by user ID
            if (discordUserId) {
                query = query.eq('discord_user_id', discordUserId);
            } else {
                console.warn('⚠️ No user ID provided for progress data');
                return [];
            }

            // Note: session_name column doesn't exist in Supabase, removed filter

            const { data: runs, error } = await query;

            if (error) {
                throw error;
            }

            return runs.map(run => ({
                timestamp: run.submitted_at,
                value: this.getMetricValue(run, metric),
                tier: run.tier,
                wave: run.wave
            }));
        } catch (error) {
            console.error('StatsQueries.getProgressData error:', error);
            throw error;
        }
    }

    /**
     * Get tier distribution data
     * @param {Object} options - Query options
     * @param {string} options.session - Optional session filter
     * @param {string} options.discordUserId - User ID to filter by (REQUIRED)
     * @returns {Promise<Array>} Tier distribution
     */
    async getTierDistribution(options = {}) {
        const { session = null, discordUserId } = options;

        try {
            let query = this.unifiedDb.supabase
                .from('tower_runs')
                .select('tier');

            // CRITICAL: Filter by user ID
            if (discordUserId) {
                query = query.eq('discord_user_id', discordUserId);
            } else {
                console.warn('⚠️ No user ID provided for tier distribution');
                return [];
            }

            // Note: session_name column doesn't exist in Supabase, removed filter

            const { data: runs, error } = await query;

            if (error) {
                throw error;
            }

            // Group by tier
            const tierCounts = {};
            runs.forEach(run => {
                const tier = parseInt(run.tier) || 0;
                tierCounts[tier] = (tierCounts[tier] || 0) + 1;
            });

            return Object.entries(tierCounts).map(([tier, count]) => ({
                tier: parseInt(tier),
                count: count
            })).sort((a, b) => a.tier - b.tier);
        } catch (error) {
            console.error('StatsQueries.getTierDistribution error:', error);
            throw error;
        }
    }

    /**
     * Get sessions list
     * @returns {Promise<Array>} List of session names
     */
    async getSessions() {
        try {
            // Discord data doesn't have session names, return empty array
            return [];
        } catch (error) {
            console.error('StatsQueries.getSessions error:', error);
            throw error;
        }
    }

    /**
     * Helper to parse numeric values with suffixes (like "10.5D")
     */
    parseNumericValue(value) {
        if (!value || typeof value !== 'string') return 0;

        const suffixes = {
            'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18,
            's': 1e21, 'S': 1e24, 'o': 1e27, 'N': 1e30, 'd': 1e33, 'D': 1e36
        };

        const match = value.match(/^([\d,\.]+)([A-Za-z]?)$/);
        if (!match) return 0;

        const num = parseFloat(match[1].replace(/,/g, ''));
        const suffix = match[2];

        return num * (suffixes[suffix] || 1);
    }

    /**
     * Helper to get metric value from run data
     */
    getMetricValue(run, metric) {
        switch (metric) {
            case 'tier':
                return parseInt(run.tier) || 0;
            case 'wave':
                return parseInt(run.wave) || 0;
            case 'damage_dealt':
                return this.parseNumericValue(run.damage_dealt);
            case 'total_enemies':
                return parseInt(run.total_enemies) || 0;
            default:
                return parseInt(run[metric]) || 0;
        }
    }
}

module.exports = StatsQueries;