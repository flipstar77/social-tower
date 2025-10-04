// Tower Analytics Chart Manager
import { ANALYTICS_CONFIG } from './analytics-config.js';
import { AnalyticsUtils } from './analytics-utils.js';

export class ChartManager {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            enemyChartType: ANALYTICS_CONFIG.DEFAULT_CHART_OPTIONS.enemyChartType,
            damageChartType: ANALYTICS_CONFIG.DEFAULT_CHART_OPTIONS.damageChartType,
            selectedEnemyTypes: new Set(ANALYTICS_CONFIG.ENEMY_TYPES),
            selectedDamageTypes: new Set(ANALYTICS_CONFIG.DAMAGE_TYPES)
        };
    }

    createBaseChartConfig(type = 'bar') {
        return {
            type: type,
            options: {
                responsive: ANALYTICS_CONFIG.CHART_OPTIONS.RESPONSIVE,
                maintainAspectRatio: ANALYTICS_CONFIG.CHART_OPTIONS.MAINTAIN_ASPECT_RATIO,
                interaction: ANALYTICS_CONFIG.CHART_OPTIONS.INTERACTION,
                hover: ANALYTICS_CONFIG.CHART_OPTIONS.HOVER,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || context.parsed || 0;
                                return `${context.label}: ${AnalyticsUtils.formatNumber(value)}`;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            color: '#E6E6FA',
                            font: { size: 12 }
                        }
                    }
                }
            }
        };
    }

    async renderProgressChart(api) {
        try {
            const data = await api.fetchProgress();

            if (!data.success || !data.progress.length) {
                document.getElementById('progressChart').innerHTML =
                    '<div class="analytics-loading">No progress data available</div>';
                return;
            }

            if (this.charts.progress) {
                this.charts.progress.destroy();
            }

            const ctx = document.getElementById('progressChart').getContext('2d');
            const config = this.createBaseChartConfig('line');

            config.data = {
                labels: data.progress.map(p => new Date(p.date).toLocaleDateString()),
                datasets: [{
                    label: 'Highest Tier',
                    data: data.progress.map(p => p.highest_tier),
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Highest Wave',
                    data: data.progress.map(p => p.highest_wave),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };

            config.options.scales = {
                x: {
                    ticks: { color: '#E6E6FA' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#E6E6FA' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };

            this.charts.progress = new Chart(ctx, config);

        } catch (error) {
            console.error('Error rendering progress chart:', error);
            document.getElementById('progressChart').innerHTML =
                '<div class="analytics-error">Error loading progress data</div>';
        }
    }

    renderTierDistribution(runs) {
        const tierCounts = {};
        runs.forEach(run => {
            const tier = run.tier || 1;
            tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        });

        if (this.charts.tier) {
            this.charts.tier.destroy();
        }

        const ctx = document.getElementById('tierChart').getContext('2d');
        const config = this.createBaseChartConfig('bar');

        config.data = {
            labels: Object.keys(tierCounts).sort((a, b) => Number(a) - Number(b)),
            datasets: [{
                label: 'Runs per Tier',
                data: Object.keys(tierCounts).sort((a, b) => Number(a) - Number(b)).map(tier => tierCounts[tier]),
                backgroundColor: 'rgba(255, 215, 0, 0.7)',
                borderColor: '#FFD700',
                borderWidth: 2
            }]
        };

        config.options.scales = {
            x: {
                title: { display: true, text: 'Tier', color: '#E6E6FA' },
                ticks: { color: '#E6E6FA' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                title: { display: true, text: 'Number of Runs', color: '#E6E6FA' },
                ticks: { color: '#E6E6FA' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        };

        this.charts.tier = new Chart(ctx, config);
    }

    renderDamageBreakdown(runs) {
        const damageTotals = AnalyticsUtils.aggregateDamageData(runs, this.chartOptions.selectedDamageTypes);

        const filteredData = Object.entries(damageTotals)
            .filter(([_, value]) => value > 0)
            .sort(([,a], [,b]) => b - a);

        if (filteredData.length === 0) {
            document.getElementById('damageChart').innerHTML =
                '<div class="analytics-loading">No damage data available</div>';
            return;
        }

        if (this.charts.damage) {
            this.charts.damage.destroy();
        }

        const ctx = document.getElementById('damageChart').getContext('2d');
        const config = this.createBaseChartConfig(this.chartOptions.damageChartType);

        const labels = filteredData.map(([label]) => label);
        const values = filteredData.map(([, value]) => value);

        config.data = {
            labels: labels,
            datasets: [{
                label: 'Damage by Source',
                data: values,
                backgroundColor: ANALYTICS_CONFIG.COLORS.DAMAGE_SOURCES.slice(0, labels.length),
                borderColor: ANALYTICS_CONFIG.COLORS.DAMAGE_SOURCES.slice(0, labels.length).map(color => color + 'CC'),
                borderWidth: 2
            }]
        };

        if (this.chartOptions.damageChartType === 'bar') {
            config.options.scales = {
                x: {
                    ticks: { color: '#E6E6FA', maxRotation: 45 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: {
                        color: '#E6E6FA',
                        callback: (value) => AnalyticsUtils.formatNumber(value)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        }

        this.charts.damage = new Chart(ctx, config);
    }

    renderEnemyBreakdown(runs) {
        const enemyTotals = AnalyticsUtils.aggregateEnemyData(runs, this.chartOptions.selectedEnemyTypes);

        const filteredData = Object.entries(enemyTotals)
            .filter(([_, value]) => value > 0)
            .sort(([,a], [,b]) => b - a);

        if (filteredData.length === 0) {
            document.getElementById('enemyChart').innerHTML =
                '<div class="analytics-loading">No enemy data available</div>';
            return;
        }

        if (this.charts.enemy) {
            this.charts.enemy.destroy();
        }

        const ctx = document.getElementById('enemyChart').getContext('2d');
        const config = this.createBaseChartConfig(this.chartOptions.enemyChartType);

        const labels = filteredData.map(([label]) => label);
        const values = filteredData.map(([, value]) => value);

        config.data = {
            labels: labels,
            datasets: [{
                label: 'Enemies Defeated',
                data: values,
                backgroundColor: ANALYTICS_CONFIG.COLORS.ENEMY_TYPES.slice(0, labels.length),
                borderColor: ANALYTICS_CONFIG.COLORS.ENEMY_TYPES.slice(0, labels.length).map(color => color + 'CC'),
                borderWidth: 2
            }]
        };

        if (this.chartOptions.enemyChartType === 'bar') {
            config.options.scales = {
                x: {
                    ticks: { color: '#E6E6FA', maxRotation: 45 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: {
                        color: '#E6E6FA',
                        callback: (value) => AnalyticsUtils.formatNumber(value)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        }

        this.charts.enemy = new Chart(ctx, config);
    }

    changeEnemyChartType(type) {
        this.chartOptions.enemyChartType = type;
    }

    changeDamageChartType(type) {
        this.chartOptions.damageChartType = type;
    }

    toggleEnemyType(type) {
        if (this.chartOptions.selectedEnemyTypes.has(type)) {
            this.chartOptions.selectedEnemyTypes.delete(type);
        } else {
            this.chartOptions.selectedEnemyTypes.add(type);
        }
    }

    toggleDamageType(type) {
        if (this.chartOptions.selectedDamageTypes.has(type)) {
            this.chartOptions.selectedDamageTypes.delete(type);
        } else {
            this.chartOptions.selectedDamageTypes.add(type);
        }
    }

    renderAllCharts(runs, api) {
        this.renderProgressChart(api);
        this.renderTierDistribution(runs);
        this.renderDamageBreakdown(runs);
        this.renderEnemyBreakdown(runs);
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}