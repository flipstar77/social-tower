/**
 * Analytics Coordinator Module
 * Central orchestrator that manages all analytics modules and data flow
 */
class AnalyticsCoordinator {
    constructor(apiBase = 'http://localhost:6078/api/tower') {
        this.apiBase = apiBase;

        // Initialize modules
        this.runManager = new RunManager(apiBase);
        this.filterManager = new FilterManager();
        this.statsCalculator = new StatsCalculator();
        this.tableRenderer = new TableRenderer();

        // State
        this.isInitialized = false;
        this.selectedRunId = null;
        this.currentViewMode = 'latest';

        // Bind methods
        this.setupEventListeners();

        // Make globally accessible for legacy compatibility
        window.analyticsCoordinator = this;
        window.tableRenderer = this.tableRenderer;
    }

    // Initialization
    async init() {
        if (this.isInitialized) return;

        console.log('🏗️ Initializing Analytics Coordinator...');

        try {
            // Load data
            await this.runManager.loadRuns();

            // Setup UI event listeners
            this.setupUIEventListeners();

            // Initial render
            this.render();

            this.isInitialized = true;
            console.log('✅ Analytics Coordinator initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Analytics Coordinator:', error);
            this.showError('Failed to initialize analytics');
        }
    }

    // Event system setup
    setupEventListeners() {
        // Run Manager events
        this.runManager.on('runsLoaded', (data) => {
            console.log(`📊 Loaded ${data.count} runs from ${data.source}`);
            this.render();
        });

        this.runManager.on('runDeleted', (data) => {
            if (data.success) {
                this.showNotification('Run deleted successfully', 'success');
                // Clear selection if deleted run was selected
                if (this.selectedRunId === data.runId) {
                    this.selectedRunId = null;
                    this.currentViewMode = 'latest';
                }
                this.render();
            } else {
                this.showNotification(data.error || 'Failed to delete run', 'error');
            }
        });

        this.runManager.on('runCategoryUpdated', (data) => {
            if (data.success) {
                const categoryName = this.filterManager.getCategoryDisplayName(data.category);
                this.showNotification(`Run category updated to ${categoryName}`, 'success');
                this.render(); // Re-render to apply filters
            } else {
                this.showNotification(data.error || 'Failed to update category', 'error');
            }
        });

        // Filter Manager events
        this.filterManager.on('filtersApplied', (data) => {
            this.runManager.setFilteredRuns(data.filteredRuns);
            this.renderTable();
            this.renderStats();
        });

        // Table Renderer events
        this.tableRenderer.on('categoryChanged', async (data) => {
            await this.runManager.updateRunCategory(data.runId, data.category);
        });

        this.tableRenderer.on('deleteRun', async (data) => {
            await this.runManager.deleteRun(data.runId);
        });

        this.tableRenderer.on('viewRun', (data) => {
            this.selectRun(data.runId);
        });
    }

    // UI event listeners
    setupUIEventListeners() {
        // Filter change handlers
        const filterElements = [
            'analyticsSessionFilter',
            'analyticsTimeFilter',
            'analyticsCategoryFilter',
            'analyticsMetricFilter'
        ];

        filterElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('analyticsRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    // Core operations
    async refreshData() {
        console.log('🔄 Refreshing analytics data...');
        this.showNotification('Refreshing data...', 'info');

        try {
            await this.runManager.loadRuns();
            this.showNotification('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Failed to refresh data', 'error');
        }
    }

    applyFilters() {
        this.filterManager.syncWithUI();
        const allRuns = this.runManager.getAllRuns();
        const filteredRuns = this.filterManager.applyFilters(allRuns);
        this.runManager.setFilteredRuns(filteredRuns);
    }

    selectRun(runId) {
        this.selectedRunId = parseInt(runId);
        this.currentViewMode = 'selected';
        this.tableRenderer.setSelectedRun(this.selectedRunId);
        this.renderCharts();
    }

    viewLatestRun() {
        this.currentViewMode = 'latest';
        this.selectedRunId = null;
        this.tableRenderer.setSelectedRun(null);
        this.renderCharts();
    }

    // Rendering methods
    render() {
        this.applyFilters();
        this.renderStats();
        this.renderCharts();
    }

    renderTable() {
        const filteredRuns = this.runManager.getFilteredRuns();
        this.tableRenderer.renderTable(filteredRuns, this.selectedRunId);
    }

    renderStats() {
        const filteredRuns = this.runManager.getFilteredRuns();
        const stats = this.statsCalculator.calculateStats(filteredRuns);

        // Update stats cards
        this.updateStatsCards(stats, filteredRuns);
    }

    renderCharts() {
        // Charts rendering would go here
        // This is where the existing chart code would be integrated
        console.log('📈 Charts rendering - to be implemented');
    }

    // Stats card updates
    updateStatsCards(stats, filteredRuns) {
        const statsToShow = this.getStatsToShow(stats, filteredRuns);

        // Update the stats grid
        const statsGrid = document.querySelector('.analytics-stats-grid');
        if (statsGrid) {
            console.log('📊 Updating stats cards with', statsToShow.length, 'stats');
            statsGrid.innerHTML = statsToShow.map(stat => this.createStatCard(stat)).join('');
        } else {
            console.warn('⚠️ Stats grid element not found');
        }
    }

    getStatsToShow(stats, filteredRuns) {
        // Main reroll shards calculation
        const mainRerollShards = filteredRuns.reduce((total, run) =>
            total + (run.reroll_shards_earned || run['Reroll Shards Earned'] || 0), 0
        );

        // Safe formatting function
        const formatNumber = (num) => {
            if (window.FormattingUtils && typeof window.FormattingUtils.formatNumber === 'function') {
                return window.FormattingUtils.formatNumber(num);
            }
            return num.toLocaleString('en-US'); // Force English locale for consistent formatting
        };

        return [
            { value: stats.total_runs || 0, label: 'Total Runs', icon: '🎮' },
            { value: stats.max_tier || 0, label: 'Highest Tier', icon: '🏆' },
            { value: stats.max_wave || 0, label: 'Highest Wave', icon: '🌊' },
            { value: formatNumber(stats.max_damage || 0), label: 'Max Damage', icon: '⚔️' },
            { value: formatNumber(stats.total_damage_dealt || 0), label: 'Total Damage', icon: '💥' },
            { value: formatNumber(stats.coins_per_hour || 0), label: 'Coins/Hour', icon: '💰' },
            { value: formatNumber(mainRerollShards), label: 'Reroll Shards', icon: '🔮' },
            { value: Number(stats.total_play_time_hours || 0).toFixed(1) + 'h', label: 'Play Time', icon: '⏱️' }
        ];
    }

    createStatCard(stat) {
        return `
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${stat.value}</div>
                <div class="analytics-stat-label">${stat.icon} ${stat.label}</div>
            </div>
        `;
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (window.towerAnalytics && typeof window.towerAnalytics.showNotification === 'function') {
            window.towerAnalytics.showNotification(message, type);
            return;
        }

        // Fallback notification
        console.log(`[${type.toUpperCase()}] ${message}`);

        const notification = document.createElement('div');
        notification.className = `analytics-notification ${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            background: type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' :
                       type === 'error' ? 'linear-gradient(135deg, #F44336, #D32F2F)' :
                       'linear-gradient(135deg, #2196F3, #1976D2)'
        });

        document.body.appendChild(notification);

        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Public API for compatibility
    getSelectedRun() {
        return this.runManager.getRunById(this.selectedRunId);
    }

    getAllRuns() {
        return this.runManager.getAllRuns();
    }

    getFilteredRuns() {
        return this.runManager.getFilteredRuns();
    }

    async updateRunCategory(runId, category) {
        return await this.runManager.updateRunCategory(runId, category);
    }

    async deleteRun(runId) {
        return await this.runManager.deleteRun(runId);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const towerAnalyticsElement = document.getElementById('towerAnalytics');
    if (towerAnalyticsElement) {
        console.log('🎯 Initializing Analytics Coordinator');
        window.analyticsCoordinator = new AnalyticsCoordinator();

        // Initialize and render initial state
        window.analyticsCoordinator.init().then(() => {
            console.log('✅ Analytics Coordinator initialized successfully');

            // Render initial stats even with empty data
            window.analyticsCoordinator.render();
        }).catch(error => {
            console.error('❌ Failed to initialize Analytics Coordinator:', error);

            // Still try to render empty state
            window.analyticsCoordinator.render();
        });

        // For backward compatibility - preserve existing towerAnalytics interface
        const existingTowerAnalytics = window.towerAnalytics;
        window.towerAnalytics = {
            showSection: () => {
                console.log('📊 Showing Tower Analytics section');
                window.analyticsCoordinator.render();
                if (existingTowerAnalytics && typeof existingTowerAnalytics.showSection === 'function') {
                    existingTowerAnalytics.showSection();
                }
            },
            applyFilters: () => window.analyticsCoordinator.applyFilters(),
            selectRun: (id) => window.analyticsCoordinator.selectRun(id),
            updateRunCategory: (id, cat) => window.analyticsCoordinator.updateRunCategory(id, cat),
            deleteRun: (id) => window.analyticsCoordinator.deleteRun(id),
            refreshData: () => window.analyticsCoordinator.refreshData(),
            showNotification: (msg, type) => window.analyticsCoordinator.showNotification(msg, type)
        };
    } else {
        console.warn('⚠️ Tower Analytics element not found');
    }
});

// Export for use in other modules
window.AnalyticsCoordinator = AnalyticsCoordinator;