// Dashboard Controller
// Main orchestrator for the dashboard - coordinates all modules

class DashboardController {
    constructor() {
        // Initialize all managers
        this.dataService = new DashboardDataService();
        this.statsDisplay = new StatsDisplayManager();
        this.sessionHistory = new SessionHistoryManager();
        this.chartManager = new ChartManager();

        // Set up callbacks
        this.sessionHistory.onSessionSelect = (session) => this.selectSession(session);
        this.sessionHistory.onSessionDelete = (session) => this.deleteSession(session);

        // Initialize
        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        console.log('🚀 Dashboard Controller initializing...');

        // Load stored data from localStorage
        this.loadStoredData();

        // Initialize chart
        this.chartManager.initialize();

        // Load fresh data from API
        await this.loadDataFromAPI();

        // Apply default filter
        this.applyFilter('all');

        console.log('✅ Dashboard Controller initialized');
    }

    /**
     * Load data from localStorage
     */
    loadStoredData() {
        try {
            const stored = localStorage.getItem('towerSessions');
            if (stored) {
                const sessions = JSON.parse(stored);
                this.sessionHistory.setSessions(sessions);
                console.log(`Loaded ${sessions.length} sessions from storage`);
            }
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage() {
        try {
            const sessions = this.sessionHistory.getSessions();
            localStorage.setItem('towerSessions', JSON.stringify(sessions));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    /**
     * Load data from API
     */
    async loadDataFromAPI() {
        try {
            // Fetch latest stats
            const stats = await this.dataService.fetchStats();
            this.updateTopStats(stats);

            // Fetch runs
            const apiSessions = await this.dataService.fetchRuns(10);

            // Merge with existing sessions (API takes priority)
            this.sessionHistory.mergeSessions(apiSessions);

            // Update displays
            this.updateAll();

            // Save to storage
            this.saveToStorage();

        } catch (error) {
            console.error('Failed to load data from API:', error);
        }
    }

    /**
     * Update top stat cards with API data
     * @param {Object} stats - Stats from API
     */
    updateTopStats(stats) {
        const tierValue = document.getElementById('tier-value');
        if (tierValue) tierValue.textContent = stats.max_tier || '0';

        const waveValue = document.getElementById('wave-value');
        if (waveValue) waveValue.textContent = FormattingUtils.formatNumber(stats.max_wave || 0);

        const coinsValue = document.getElementById('coins-value');
        if (coinsValue) coinsValue.textContent = FormattingUtils.formatNumber(stats.total_coins || 0);
    }

    /**
     * Apply filter
     * @param {string} filter - Filter name
     */
    applyFilter(filter) {
        console.log(`Applying filter: ${filter}`);
        this.sessionHistory.setFilter(filter);

        // Get latest filtered session
        const latestSession = this.sessionHistory.getLatestFilteredSession();
        if (latestSession) {
            this.statsDisplay.setCurrentSession(latestSession);
        }

        this.updateAll();
    }

    /**
     * Select a session
     * @param {Object} session - Session to select
     */
    selectSession(session) {
        console.log('✅ Selected session:', session);
        this.statsDisplay.setCurrentSession(session);
        this.statsDisplay.updateAll();
    }

    /**
     * Delete a session
     * @param {Object} session - Session to delete
     */
    async deleteSession(session) {
        if (!confirm('Are you sure you want to delete this run?')) {
            return;
        }

        try {
            // Delete from API if it has an ID
            if (session.sessionId) {
                await this.dataService.deleteRun(session.sessionId);
            }

            // Remove from local data
            this.sessionHistory.removeSession(session.sessionId);

            // Save to storage
            this.saveToStorage();

            // Update displays
            this.updateAll();

            this.showNotification('Run deleted successfully');
        } catch (error) {
            console.error('Failed to delete session:', error);
            this.showNotification('Failed to delete run');
        }
    }

    /**
     * Update all displays
     */
    updateAll() {
        // Update filtered sessions for chart
        const filteredSessions = this.sessionHistory.getFilteredSessions();
        this.chartManager.setSessions(filteredSessions);
        this.chartManager.update();

        // Update history list
        this.sessionHistory.updateHistoryList();

        // Update stats display
        this.statsDisplay.updateAll();
    }

    /**
     * Show notification
     * @param {string} message - Message to show
     */
    showNotification(message) {
        this.sessionHistory.showNotification(message);
    }

    /**
     * Get current session
     * @returns {Object|null} Current session
     */
    getCurrentSession() {
        return this.statsDisplay.currentSession;
    }

    /**
     * Get all sessions
     * @returns {Array} All sessions
     */
    getAllSessions() {
        return this.sessionHistory.getSessions();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardController;
}
