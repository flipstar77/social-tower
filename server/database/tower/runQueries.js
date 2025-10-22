/**
 * Database queries for Tower runs
 * Uses Supabase via unifiedDb - no legacy SQLite code
 */
class RunQueries {
    constructor(dependencies) {
        this.unifiedDb = dependencies.unifiedDb;

        if (!this.unifiedDb) {
            throw new Error('unifiedDb is required for RunQueries');
        }
    }

    /**
     * Insert a new Tower run
     * @param {Object} statsData - Statistics data to insert
     * @returns {Promise<Object>} Inserted run record with ID
     */
    async insertTowerRun(statsData) {
        try {
            console.log('💾 Inserting run via unifiedDb.saveRun()');
            const result = await this.unifiedDb.saveRun(statsData);
            console.log('✅ Run saved successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to save run via unifiedDb:', error);
            throw error;
        }
    }

    /**
     * Get all Tower runs with optional filtering
     * @param {Object} options - Query options (limit, offset, discordUserId)
     * @returns {Promise<Array>} Array of run records
     */
    async getAllRuns(options = {}) {
        const { limit = 50, offset = 0, discordUserId } = options;

        console.log('🔍 RunQueries.getAllRuns called with:', { limit, offset, discordUserId });

        try {
            console.log('📡 Calling unifiedDb.getRuns with discordUserId:', discordUserId);

            // CRITICAL: Always filter by user ID if provided
            const runs = await this.unifiedDb.getRuns({
                limit: limit,
                offset: offset,
                discordUserId: discordUserId  // Pass user ID for filtering
            });

            console.log(`📊 Fetched ${runs.length} runs for user: ${discordUserId || 'anonymous'}`);

            return runs;
        } catch (error) {
            console.error('❌ Error fetching runs:', error);
            throw error;
        }
    }

    /**
     * Get a single Tower run by ID
     * @param {string} runId - Run ID (UUID)
     * @returns {Promise<Object|null>} Run record or null if not found
     */
    async getRunById(runId) {
        try {
            const { data, error } = await this.unifiedDb.supabase
                .from('tower_runs')
                .select('*')
                .eq('id', runId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('❌ Failed to get run by ID:', error);
            throw error;
        }
    }

    /**
     * Update a Tower run
     * @param {string} runId - Run ID (UUID)
     * @param {Object} updateData - Data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateRun(runId, updateData) {
        try {
            const { error } = await this.unifiedDb.supabase
                .from('tower_runs')
                .update(updateData)
                .eq('id', runId);

            if (error) throw error;

            console.log('✅ Run updated in Supabase:', runId);
            return true;
        } catch (error) {
            console.error('❌ Failed to update run:', error);
            throw error;
        }
    }

    /**
     * Update a Tower run's category
     * @param {string} runId - Run ID (UUID)
     * @param {string} category - New category value
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateRunCategory(runId, category) {
        try {
            const { error } = await this.unifiedDb.supabase
                .from('tower_runs')
                .update({ category })
                .eq('id', runId);

            if (error) throw error;

            console.log('✅ Run category updated in Supabase:', runId, category);
            return true;
        } catch (error) {
            console.error('❌ Failed to update run category:', error);
            throw error;
        }
    }

    /**
     * Delete a Tower run
     * @param {string} runId - Run ID (UUID)
     * @param {string} discordUserId - User ID (for ownership verification)
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteRun(runId, discordUserId) {
        try {
            // SECURITY: Only delete if run belongs to this user
            let query = this.unifiedDb.supabase
                .from('tower_runs')
                .delete()
                .eq('id', runId);

            // Add user filter if provided (MUST be chained before await)
            if (discordUserId) {
                query = query.eq('discord_user_id', discordUserId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            console.log('✅ Run deleted from Supabase:', runId, 'by user:', discordUserId);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete run:', error);
            throw error;
        }
    }

    /**
     * Get runs count with optional user filter
     * @param {string} discordUserId - Optional user ID filter
     * @returns {Promise<number>} Number of runs
     */
    async getRunsCount(discordUserId = null) {
        try {
            let query = this.unifiedDb.supabase
                .from('tower_runs')
                .select('*', { count: 'exact', head: true });

            if (discordUserId) {
                query = query.eq('discord_user_id', discordUserId);
            }

            const { count, error } = await query;

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('❌ Failed to get runs count:', error);
            throw error;
        }
    }
}

/**
 * Factory function to create run queries
 */
function createRunQueries(dependencies) {
    return new RunQueries(dependencies);
}

module.exports = createRunQueries;
