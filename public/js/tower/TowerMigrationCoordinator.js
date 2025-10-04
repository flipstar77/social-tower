/**
 * Coordinates the migration from monolithic to modular Tower Analytics
 */
import TowerAnalyticsManager from './TowerAnalyticsManager.js';
import TowerTableRenderer from './TowerTableRenderer.js';

class TowerMigrationCoordinator {
    constructor() {
        this.newAnalyticsManager = null;
        this.migrationEnabled = true;
        this.componentsReplaced = {
            tableRenderer: false,
            dataService: false,
            statsCalculator: false
        };
    }

    async initialize() {
        if (!this.migrationEnabled) return;

        try {
            console.log('🔄 Initializing Tower Analytics Migration...');

            // Initialize new modular system
            this.newAnalyticsManager = new TowerAnalyticsManager();
            await this.newAnalyticsManager.initialize();

            // Replace table renderer immediately (user's main concern)
            this.replaceTableRenderer();

            console.log('✅ Migration coordinator initialized');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            this.migrationEnabled = false;
        }
    }

    replaceTableRenderer() {
        if (!window.towerAnalytics || this.componentsReplaced.tableRenderer) return;

        try {
            // Override the monolithic table rendering methods
            const originalRenderRunsTable = window.towerAnalytics.renderRunsTable;
            const originalRenderStatsCards = window.towerAnalytics.renderStatsCards;

            // Replace with modular table renderer - ensure it uses the new manager's data
            window.towerAnalytics.renderRunsTable = (runs, selectedRunId) => {
                console.log('🔄 Using modular table renderer');
                this.newAnalyticsManager.tableRenderer.renderRunsTable(runs || this.newAnalyticsManager.filteredRuns, selectedRunId || this.newAnalyticsManager.selectedRunId);
            };

            window.towerAnalytics.renderStatsCards = (stats, totals, rates) => {
                console.log('🔄 Using modular stats cards renderer');
                this.newAnalyticsManager.tableRenderer.renderStatsCards(stats, totals, rates);
            };

            // Override selectRun to use the new manager's method
            const originalSelectRun = window.towerAnalytics.selectRun;
            window.towerAnalytics.selectRun = async (runId) => {
                console.log('🔄 Using modular selectRun');
                await this.newAnalyticsManager.selectRun(runId);
            };

            // Override deleteRun to use the new manager's method
            const originalDeleteRun = window.towerAnalytics.deleteRun;
            window.towerAnalytics.deleteRun = async (runId) => {
                console.log('🔄 Using modular deleteRun');
                await this.newAnalyticsManager.deleteRun(runId);
            };

            // Override updateRunCategory to use the new manager's method
            window.towerAnalytics.updateRunCategory = async (runId, category) => {
                console.log('🔄 Using modular updateRunCategory');
                await this.newAnalyticsManager.updateRunCategory(runId, category);
            };

            // Override render method to use modular system
            const originalRender = window.towerAnalytics.render;
            window.towerAnalytics.render = () => {
                console.log('🔄 Using modular render');
                this.newAnalyticsManager.render();
            };

            this.componentsReplaced.tableRenderer = true;
            console.log('✅ Table renderer replaced with modular version');
        } catch (error) {
            console.error('❌ Failed to replace table renderer:', error);
        }
    }

    // Method to progressively replace other components
    replaceStatsCalculator() {
        if (!window.towerAnalytics || this.componentsReplaced.statsCalculator) return;

        try {
            // Replace stats calculation methods
            const TowerStatsCalculator = this.newAnalyticsManager.constructor.TowerStatsCalculator;

            window.towerAnalytics.calculateStats = (runs) => {
                return TowerStatsCalculator.calculateStats(runs);
            };

            window.towerAnalytics.calculateTotals = (runs) => {
                return TowerStatsCalculator.calculateTotals(runs);
            };

            window.towerAnalytics.calculateRates = (runs) => {
                return TowerStatsCalculator.calculateRates(runs);
            };

            this.componentsReplaced.statsCalculator = true;
            console.log('✅ Stats calculator replaced with modular version');
        } catch (error) {
            console.error('❌ Failed to replace stats calculator:', error);
        }
    }

    replaceDataService() {
        if (!window.towerAnalytics || this.componentsReplaced.dataService) return;

        try {
            // Replace data loading methods
            const dataService = this.newAnalyticsManager.dataService;

            window.towerAnalytics.loadRuns = async () => {
                return await dataService.loadRuns();
            };

            window.towerAnalytics.loadStats = async () => {
                return await dataService.loadStats();
            };

            this.componentsReplaced.dataService = true;
            console.log('✅ Data service replaced with modular version');
        } catch (error) {
            console.error('❌ Failed to replace data service:', error);
        }
    }

    // Method to check migration status
    getMigrationStatus() {
        return {
            enabled: this.migrationEnabled,
            components: this.componentsReplaced,
            nextSteps: this.getNextSteps()
        };
    }

    getNextSteps() {
        const steps = [];
        if (!this.componentsReplaced.statsCalculator) {
            steps.push('Replace stats calculator');
        }
        if (!this.componentsReplaced.dataService) {
            steps.push('Replace data service');
        }
        if (steps.length === 0) {
            steps.push('Migration complete - ready to remove monolithic code');
        }
        return steps;
    }
}

export default TowerMigrationCoordinator;