/**
 * Handles data loading and API communication for Tower Analytics
 */
class TowerDataService {
    constructor() {
        this.baseUrl = '/api/tower';
    }

    async loadRuns() {
        try {
            const response = await fetch(`${this.baseUrl}/runs`);
            const data = await response.json();
            return data.success ? data.runs : [];
        } catch (error) {
            console.error('Failed to load runs:', error);
            return [];
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            const data = await response.json();
            return data.success ? data.stats : {};
        } catch (error) {
            console.error('Failed to load stats:', error);
            return {};
        }
    }

    async deleteRun(runId) {
        try {
            const response = await fetch(`${this.baseUrl}/runs/${runId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Failed to delete run:', error);
            return false;
        }
    }
}

export default TowerDataService;