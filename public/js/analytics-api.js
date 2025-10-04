// Tower Analytics API Service
import { ANALYTICS_CONFIG } from './analytics-config.js';

export class AnalyticsAPI {
    constructor() {
        this.apiBase = ANALYTICS_CONFIG.API_BASE;
    }

    async fetchRuns(limit = 100) {
        try {
            const response = await fetch(`${this.apiBase}/runs?limit=${limit}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to fetch runs: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching runs:', error);
            throw error;
        }
    }

    async fetchStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to fetch stats: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }

    async fetchRates() {
        try {
            const response = await fetch(`${this.apiBase}/rates`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to fetch rates: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching rates:', error);
            throw error;
        }
    }

    async fetchProgress() {
        try {
            const response = await fetch(`${this.apiBase}/progress`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to fetch progress: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error;
        }
    }

    async fetchSessions() {
        try {
            const response = await fetch(`${this.apiBase}/sessions`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to fetch sessions: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    }

    async uploadFile(formData) {
        try {
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async fetchAllData() {
        try {
            const [runsResponse, statsResponse, ratesResponse] = await Promise.all([
                this.fetchRuns(),
                this.fetchStats(),
                this.fetchRates()
            ]);

            return {
                runs: runsResponse,
                stats: statsResponse,
                rates: ratesResponse
            };
        } catch (error) {
            console.error('Error fetching all data:', error);
            throw error;
        }
    }
}