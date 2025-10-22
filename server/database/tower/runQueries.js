/**
 * Database queries for Tower runs
 */
class RunQueries {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.unifiedDb = dependencies.unifiedDb;
    }

    /**
     * Insert a new Tower run
     * @param {Object} statsData - Statistics data to insert
     * @returns {Promise<Object>} Inserted run record with ID
     */
    async insertTowerRun(statsData) {
        // Use unified database (Supabase) if available
        if (this.unifiedDb && this.unifiedDb.saveRun) {
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

        // Legacy SQLite fallback (should not be used in production)
        console.warn('⚠️ Using legacy SQLite fallback - this should not happen in production!');
        return new Promise((resolve, reject) => {
            // Convert arrays to JSON strings for storage
            const processedData = { ...statsData };
            if (processedData.cards_used && Array.isArray(processedData.cards_used)) {
                processedData.cards_used = JSON.stringify(processedData.cards_used);
            }

            const columns = Object.keys(processedData).join(', ');
            const placeholders = Object.keys(processedData).map(() => '?').join(', ');
            const values = Object.values(processedData);

            const query = `INSERT INTO tower_runs (${columns}) VALUES (${placeholders})`;

            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this ? this.lastID : null });
                }
            });
        });
    }

    /**
     * Get all Tower runs with optional filtering
     * @param {Object} options - Query options (limit, offset, session, discordUserId)
     * @returns {Promise<Array>} Array of run records
     */
    async getAllRuns(options = {}) {
        const { limit = 50, offset = 0, session, discordUserId } = options;

        console.log('🔍 RunQueries.getAllRuns called with:', { limit, offset, session, discordUserId });

        // Use unified database if available, otherwise fall back to legacy
        if (this.unifiedDb && this.unifiedDb.getRuns) {
            try {
                console.log('📡 Calling unifiedDb.getRuns with discordUserId:', discordUserId);

                // CRITICAL: Always filter by user ID if provided
                const runs = await this.unifiedDb.getRuns({
                    limit: limit,
                    offset: offset,
                    discordUserId: discordUserId  // Pass user ID for filtering
                });

                console.log(`📊 Fetched ${runs.length} runs for user: ${discordUserId || 'anonymous'}`);

                // Don't filter by session_name since that column doesn't exist in Supabase
                return runs;
            } catch (error) {
                console.error('Error using unified database, falling back to legacy:', error);
            }
        }

        // Legacy database fallback
        return new Promise((resolve, reject) => {
            let whereClause = '';
            let params = [];

            if (session) {
                whereClause = 'WHERE session_name = ?';
                params.push(session);
            }

            const query = `
                SELECT * FROM tower_runs
                ${whereClause}
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            `;
            params.push(limit, offset);

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Get a single Tower run by ID
     * @param {number} runId - Run ID
     * @returns {Promise<Object|null>} Run record or null if not found
     */
    async getRunById(runId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM tower_runs WHERE id = ?', [runId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Update a Tower run
     * @param {number} runId - Run ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateRun(runId, updateData) {
        return new Promise((resolve, reject) => {
            const columns = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(runId);

            const query = `UPDATE tower_runs SET ${columns} WHERE id = ?`;

            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Update a Tower run's category
     * @param {number} runId - Run ID
     * @param {string} category - New category value
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateRunCategory(runId, category) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE tower_runs SET category = ? WHERE id = ?', [category, runId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    /**
     * Delete a Tower run
     * @param {number} runId - Run ID
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteRun(runId) {
        try {
            // Use Supabase for deletion
            if (this.unifiedDb && this.unifiedDb.supabase) {
                const { data, error } = await this.unifiedDb.supabase
                    .from('tower_runs')
                    .delete()
                    .eq('id', runId);

                if (error) {
                    console.error('Supabase delete error:', error);
                    throw error;
                }

                console.log('✅ Run deleted from Supabase:', runId);
                return true;
            }

            // Fallback to SQLite if Supabase not available
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM tower_runs WHERE id = ?', [runId], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Run deleted from SQLite:', runId, 'Changes:', this.changes);
                        resolve(this.changes > 0);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Failed to delete run:', error);
            throw error;
        }
    }

    /**
     * Get runs count with optional session filter
     * @param {string} session - Optional session filter
     * @returns {Promise<number>} Number of runs
     */
    async getRunsCount(session = null) {
        return new Promise((resolve, reject) => {
            let whereClause = '';
            let params = [];

            if (session) {
                whereClause = 'WHERE session_name = ?';
                params.push(session);
            }

            const query = `SELECT COUNT(*) as count FROM tower_runs ${whereClause}`;

            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.count : 0);
                }
            });
        });
    }
}

/**
 * Factory function to create run queries
 */
function createRunQueries(dependencies) {
    return new RunQueries(dependencies);
}

module.exports = createRunQueries;