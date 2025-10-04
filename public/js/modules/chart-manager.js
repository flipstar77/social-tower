// Chart Management Module
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = this.getDefaultChartOptions();
    }

    // Create or update a chart
    createChart(canvasId, type, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`📊 Canvas with id '${canvasId}' not found`);
            return null;
        }

        // Destroy existing chart if it exists
        this.destroyChart(canvasId);

        try {
            const ctx = canvas.getContext('2d');
            const chartOptions = this.mergeOptions(type, options);

            const chart = new Chart(ctx, {
                type: type,
                data: data,
                options: chartOptions
            });

            this.charts.set(canvasId, chart);
            console.log(`📊 Created ${type} chart: ${canvasId}`);
            return chart;
        } catch (error) {
            console.error(`📊 Error creating chart ${canvasId}:`, error);
            return null;
        }
    }

    // Update existing chart data
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`📊 Chart '${canvasId}' not found for update`);
            return false;
        }

        try {
            chart.data = newData;
            chart.update();
            return true;
        } catch (error) {
            console.error(`📊 Error updating chart ${canvasId}:`, error);
            return false;
        }
    }

    // Destroy a specific chart
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
            console.log(`📊 Destroyed chart: ${canvasId}`);
            return true;
        }
        return false;
    }

    // Destroy all charts
    destroyAllCharts() {
        this.charts.forEach((chart, canvasId) => {
            chart.destroy();
            console.log(`📊 Destroyed chart: ${canvasId}`);
        });
        this.charts.clear();
    }

    // Get a chart instance
    getChart(canvasId) {
        return this.charts.get(canvasId);
    }

    // Check if chart exists
    hasChart(canvasId) {
        return this.charts.has(canvasId);
    }

    // Get all active charts
    getAllCharts() {
        return Array.from(this.charts.entries());
    }

    // Default chart options
    getDefaultChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#E6E6FA',
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#FFD700',
                    bodyColor: '#E6E6FA',
                    borderColor: '#FFD700',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#B0B0C8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#B0B0C8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };
    }

    // Chart type specific options
    getChartTypeOptions(type) {
        const typeOptions = {
            line: {
                elements: {
                    line: {
                        tension: 0.3
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            },
            doughnut: {
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            },
            pie: {
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            },
            bar: {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };

        return typeOptions[type] || {};
    }

    // Merge default options with custom options
    mergeOptions(type, customOptions) {
        const defaultOpts = this.defaultOptions;
        const typeOpts = this.getChartTypeOptions(type);

        return this.deepMerge(defaultOpts, typeOpts, customOptions);
    }

    // Deep merge utility for options
    deepMerge(...objects) {
        const result = {};

        for (const obj of objects) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        result[key] = this.deepMerge(result[key] || {}, obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                }
            }
        }

        return result;
    }

    // Create progress chart (line chart for wave/damage progression)
    createProgressChart(canvasId, runs, valueField, label) {
        const data = {
            labels: runs.map((_, index) => `Run ${index + 1}`),
            datasets: [{
                label: label,
                data: runs.map(run => run[valueField] || 0),
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: `${label} Progression`,
                    color: '#FFD700'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = FormattingUtils.formatNumber(context.parsed.y || 0);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => FormattingUtils.formatNumber(value)
                    }
                }
            }
        };

        return this.createChart(canvasId, 'line', data, options);
    }

    // Create distribution chart (doughnut for tier/category distribution)
    createDistributionChart(canvasId, data, title) {
        const chartData = {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
                    '#FFC107', '#FF9800', '#FF5722', '#F44336',
                    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                    '#2196F3', '#03A9F4', '#00BCD4', '#009688'
                ],
                borderWidth: 2,
                borderColor: '#1A1A3E'
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#FFD700'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        return this.createChart(canvasId, 'doughnut', chartData, options);
    }

    // Create comparison chart (bar chart for comparing values)
    createComparisonChart(canvasId, categories, values, title, color = '#FFD700') {
        const data = {
            labels: categories,
            datasets: [{
                label: title,
                data: values,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#FFD700'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = FormattingUtils.formatNumber(context.parsed.y || 0);
                            return `${context.label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => FormattingUtils.formatNumber(value)
                    }
                }
            }
        };

        return this.createChart(canvasId, 'bar', data, options);
    }
}

// Global chart manager instance
if (typeof window !== 'undefined') {
    window.ChartManager = ChartManager;
    window.chartManager = new ChartManager();
}