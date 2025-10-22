/**
 * Filter Management Module
 * Handles filtering and categorization of runs
 */
class FilterManager {
    constructor() {
        this.filters = {
            session: '',
            timeRange: 'all',
            metric: 'tier',
            category: ''
        };
        this.eventListeners = new Map();
    }

    // Event system
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

    // Filter operations
    setFilter(filterType, value) {
        if (this.filters.hasOwnProperty(filterType)) {
            this.filters[filterType] = value;
            this.emit('filterChanged', { filterType, value, allFilters: { ...this.filters } });
        }
    }

    getFilters() {
        return { ...this.filters };
    }

    applyFilters(runs) {
        if (!Array.isArray(runs)) return [];

        const filtered = runs.filter(run => {
            // NOTE: Removed session filter - Supabase schema doesn't have session_name column
            // Session-based filtering is not supported for Supabase runs

            // Time range filter
            if (this.filters.timeRange !== 'all') {
                const runDate = new Date(run.timestamp || run.submitted_at || run.created_at);
                const daysAgo = parseInt(this.filters.timeRange);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

                if (runDate < cutoffDate) {
                    return false;
                }
            }

            // Category filter
            if (this.filters.category && run.category !== this.filters.category) {
                return false;
            }

            return true;
        });

        this.emit('filtersApplied', { originalCount: runs.length, filteredCount: filtered.length, filteredRuns: filtered });
        return filtered;
    }

    // UI synchronization
    syncWithUI() {
        const sessionFilter = document.getElementById('analyticsSessionFilter');
        const timeFilter = document.getElementById('analyticsTimeFilter');
        const categoryFilter = document.getElementById('analyticsCategoryFilter');
        const metricFilter = document.getElementById('analyticsMetricFilter');

        if (sessionFilter) {
            this.filters.session = sessionFilter.value || '';
        }
        if (timeFilter) {
            this.filters.timeRange = timeFilter.value || 'all';
        }
        if (categoryFilter) {
            this.filters.category = categoryFilter.value || '';
        }
        if (metricFilter) {
            this.filters.metric = metricFilter.value || 'tier';
        }

        this.emit('filtersUpdatedFromUI', { ...this.filters });
    }

    // Category utilities
    getCategoryDisplayName(category) {
        const categoryMap = {
            'milestone': '🏆 Milestone',
            'tournament': '🎯 Tournament',
            'farm': '🌾 Farm'
        };
        return categoryMap[category] || 'None';
    }

    getCategoryOptions() {
        return [
            { value: '', label: 'All Categories' },
            { value: 'milestone', label: '🏆 Milestones' },
            { value: 'tournament', label: '🎯 Tournaments' },
            { value: 'farm', label: '🌾 Farm' }
        ];
    }

    // Statistics for filtered data
    getFilteredStats(filteredRuns) {
        if (!filteredRuns.length) {
            return {
                total_runs: 0,
                max_tier: 0,
                max_wave: 0,
                max_damage: 0,
                avg_tier: 0,
                avg_wave: 0,
                total_enemies_killed: 0
            };
        }

        return {
            total_runs: filteredRuns.length,
            max_tier: Math.max(...filteredRuns.map(r => r.tier || 0)),
            max_wave: Math.max(...filteredRuns.map(r => r.wave || 0)),
            max_damage: Math.max(...filteredRuns.map(r => r.damage_dealt || 0)),
            avg_tier: filteredRuns.reduce((sum, run) => sum + (run.tier || 0), 0) / filteredRuns.length,
            avg_wave: filteredRuns.reduce((sum, run) => sum + (run.wave || 0), 0) / filteredRuns.length,
            total_enemies_killed: filteredRuns.reduce((sum, run) => sum + (run.total_enemies || 0), 0)
        };
    }

    // Reset filters
    resetFilters() {
        this.filters = {
            session: '',
            timeRange: 'all',
            metric: 'tier',
            category: ''
        };
        this.emit('filtersReset', { ...this.filters });
    }
}

// Export for use in other modules
window.FilterManager = FilterManager;