// Chart Manager
// Responsible for chart initialization and updates

class ChartManager {
    constructor() {
        this.chart = null;
        this.sessions = [];
    }

    /**
     * Set sessions data for chart
     * @param {Array} sessions - Array of session objects
     */
    setSessions(sessions) {
        this.sessions = sessions || [];
    }

    /**
     * Initialize Chart.js chart
     */
    initialize() {
        const ctx = document.getElementById('mainChart');
        if (!ctx) {
            console.warn('Chart canvas not found');
            return;
        }

        const chartData = this.prepareChartData();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(89, 88, 141, 0.3)',
                            borderColor: 'rgba(89, 88, 141, 0.5)'
                        },
                        ticks: {
                            color: '#59588D',
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(89, 88, 141, 0.3)',
                            borderColor: 'rgba(89, 88, 141, 0.5)'
                        },
                        ticks: {
                            color: '#59588D',
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Prepare chart data from sessions
     * @returns {Object} Chart.js data object
     */
    prepareChartData() {
        const sessions = this.sessions.slice(-10); // Last 10 sessions
        const labels = sessions.map((_, index) => `Run ${index + 1}`);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Tier Progress',
                    data: sessions.map(s => s.tier || 0),
                    borderColor: '#FB49C0',
                    backgroundColor: 'rgba(251, 73, 192, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Wave Progress',
                    data: sessions.map(s => (s.wave || 0) / 1000), // Scale down for chart
                    borderColor: '#31AFD6',
                    backgroundColor: 'rgba(49, 175, 214, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Total Enemies (K)',
                    data: sessions.map(s => {
                        const totalEnemies = s.totalEnemies || s.total_enemies || 0;
                        return totalEnemies / 1000; // Scale down
                    }),
                    borderColor: '#F5A623',
                    backgroundColor: 'rgba(245, 166, 35, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }

    /**
     * Update chart with new data
     */
    update() {
        if (!this.chart) {
            console.warn('Chart not initialized');
            return;
        }

        const chartData = this.prepareChartData();
        this.chart.data = chartData;
        this.chart.update();
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
