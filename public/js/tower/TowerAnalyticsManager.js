/**
 * Main coordinator class - keeps only essential orchestration logic
 */
import TowerDataService from './TowerDataService.js';
import TowerStatsCalculator from './TowerStatsCalculator.js';
import TowerTableRenderer from './TowerTableRenderer.js';

class TowerAnalyticsManager {
    constructor() {
        this.dataService = new TowerDataService();
        this.tableRenderer = new TowerTableRenderer(this);

        this.runs = [];
        this.filteredRuns = [];
        this.selectedRunId = null;
        this.currentViewMode = 'all';
        this.filters = { session: null, metric: 'tier' };
    }

    async initialize() {
        try {
            console.log('🏗️ Initializing Tower Analytics...');
            await this.loadData();
            this.setupEventHandlers();
            this.render();
            console.log('✅ Tower Analytics initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Tower Analytics:', error);
            this.showError('Failed to initialize Tower Analytics');
        }
    }

    async loadData() {
        this.runs = await this.dataService.loadRuns();
        this.filteredRuns = [...this.runs];
        console.log(`📊 Loaded ${this.runs.length} runs`);
    }

    render() {
        const stats = TowerStatsCalculator.calculateStats(this.filteredRuns);
        const totals = TowerStatsCalculator.calculateTotals(this.filteredRuns);
        const rates = TowerStatsCalculator.calculateRates(this.filteredRuns);

        this.tableRenderer.renderStatsCards(stats, totals, rates);
        this.tableRenderer.renderRunsTable(this.filteredRuns, this.selectedRunId);

        // Initialize progression charts if available
        this.renderProgressionCharts();
    }

    async renderProgressionCharts() {
        if (window.ProgressionCharts && this.runs && this.runs.length > 0) {
            try {
                if (!this.progressionCharts) {
                    this.progressionCharts = new ProgressionCharts('progression-charts-container');
                }
                await this.progressionCharts.init(this.runs);
                console.log('📊 Progression charts rendered successfully');
            } catch (error) {
                console.error('❌ Failed to render progression charts:', error);
            }
        }
    }

    async selectRun(runId) {
        this.selectedRunId = runId;
        this.currentViewMode = 'selected';
        this.filteredRuns = this.runs.filter(run => run.id === runId);
        this.render();

        const run = this.filteredRuns[0];
        this.showNotification(`Viewing run: Tier ${run?.tier} Wave ${run?.wave}`, 'info');
    }

    async deleteRun(runId) {
        if (!confirm('Are you sure you want to delete this run?')) return;

        const success = await this.dataService.deleteRun(runId);
        if (success) {
            this.runs = this.runs.filter(run => run.id !== runId);
            this.filteredRuns = this.filteredRuns.filter(run => run.id !== runId);

            if (this.selectedRunId === runId) {
                this.selectedRunId = null;
                this.currentViewMode = 'all';
                this.filteredRuns = [...this.runs];
            }

            this.render();
            this.showNotification('Run deleted successfully', 'success');
        } else {
            this.showNotification('Failed to delete run', 'error');
        }
    }

    showAllRuns() {
        this.currentViewMode = 'all';
        this.selectedRunId = null;
        this.filteredRuns = [...this.runs];
        this.render();
    }

    setupEventHandlers() {
        // Add event listeners for filters, etc.
        const showAllBtn = document.getElementById('showAllRunsBtn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => this.showAllRuns());
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        // Could integrate with a toast notification system
    }

    showError(message) {
        console.error('❌', message);
        this.showNotification(message, 'error');
    }

    async updateRunCategory(runId, category) {
        try {
            const response = await fetch(`/api/tower/runs/${runId}/category`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category })
            });

            if (response.ok) {
                // Update local data
                const run = this.runs.find(r => r.id === runId);
                if (run) {
                    run.category = category;
                }
                const filteredRun = this.filteredRuns.find(r => r.id === runId);
                if (filteredRun) {
                    filteredRun.category = category;
                }

                this.showNotification(`Run category updated to ${category || 'none'}`, 'success');
            } else {
                this.showNotification('Failed to update run category', 'error');
            }
        } catch (error) {
            console.error('Failed to update run category:', error);
            this.showNotification('Failed to update run category', 'error');
        }
    }
}

export default TowerAnalyticsManager;