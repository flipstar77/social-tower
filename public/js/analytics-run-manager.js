/**
 * Run Management Module
 * Handles CRUD operations for tower runs
 */
class RunManager {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.runs = [];
        this.filteredRuns = [];
        this.eventListeners = new Map();
    }

    // Event system for loose coupling
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // Data management
    async loadRuns() {
        try {
            // Try API first
            const response = await fetch(`${this.apiBase}/runs?limit=100`);
            const data = await response.json();

            if (data.success && data.runs.length > 0) {
                this.runs = data.runs.map(run => ({
                    ...run,
                    id: run.id || Date.now() + Math.random(),
                    timestamp: run.timestamp || run.created_at || new Date().toISOString()
                }));
                this.emit('runsLoaded', { source: 'api', count: this.runs.length });
                return this.runs;
            }
        } catch (error) {
            console.warn('API unavailable, loading from localStorage:', error);
        }

        // Fallback to localStorage
        return this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        try {
            const farmData = JSON.parse(localStorage.getItem('farmTrackerTowerStats') || '[]');
            this.runs = farmData.map((run, index) => ({
                id: run.id || index + 1,
                tier: run.tier || run['Tier Reached'] || 0,
                wave: run.wave || run['Wave Reached'] || 0,
                damage_dealt: run.damage_dealt || run['Damage Dealt'] || '0',
                total_enemies: run.total_enemies || run['Total Enemies Killed'] || 0,
                coins_earned: run.coins_earned || run['Coins Earned'] || 0,
                killed_by: run.killed_by || run['Killed By'] || 'Unknown',
                real_time: run.real_time || run['Real Time'] || 'N/A',
                timestamp: run.timestamp || new Date().toISOString(),
                category: run.category || null
            }));
            this.emit('runsLoaded', { source: 'localStorage', count: this.runs.length });
            return this.runs;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.runs = [];
            return [];
        }
    }

    // CRUD operations
    async deleteRun(runId) {
        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.runs = this.runs.filter(r => r.id !== runId);
                this.filteredRuns = this.filteredRuns.filter(r => r.id !== runId);
                this.emit('runDeleted', { runId, success: true });
                return { success: true };
            } else {
                this.emit('runDeleted', { runId, success: false, error: data.error });
                return { success: false, error: data.error };
            }
        } catch (error) {
            this.emit('runDeleted', { runId, success: false, error: error.message });
            return { success: false, error: error.message };
        }
    }

    async updateRunCategory(runId, category) {
        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}/category`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });

            const data = await response.json();

            if (data.success) {
                // Update local data
                const run = this.runs.find(r => r.id === runId);
                if (run) run.category = category;

                const filteredRun = this.filteredRuns.find(r => r.id === runId);
                if (filteredRun) filteredRun.category = category;

                this.emit('runCategoryUpdated', { runId, category, success: true });
                return { success: true };
            } else {
                this.emit('runCategoryUpdated', { runId, category, success: false, error: data.error });
                return { success: false, error: data.error };
            }
        } catch (error) {
            this.emit('runCategoryUpdated', { runId, category, success: false, error: error.message });
            return { success: false, error: error.message };
        }
    }

    // Getters
    getAllRuns() {
        return [...this.runs];
    }

    getFilteredRuns() {
        return [...this.filteredRuns];
    }

    getRunById(runId) {
        return this.runs.find(r => r.id === runId);
    }

    setFilteredRuns(filteredRuns) {
        this.filteredRuns = filteredRuns;
        this.emit('filteredRunsChanged', { runs: this.filteredRuns });
    }
}

// Export for use in other modules
window.RunManager = RunManager;