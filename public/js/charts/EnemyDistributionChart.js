/**
 * Enemy Distribution Chart
 * Shows enemy types defeated and destruction methods
 */

class EnemyDistributionChart {
    constructor() {
        this.chart = null;
        this.container = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        this.chart = echarts.init(this.container, 'dark');
        this.setupDefaultChart();
    }

    setupDefaultChart() {
        const option = {
            title: {
                text: '👾 Enemy Distribution',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#E91E63',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with enemy data from battle report
     * @param {Object} enemyData - Enemy statistics
     */
    updateChart(enemyData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        const {
            totalEnemies = 0,
            basic = 0,
            fast = 0,
            tank = 0,
            ranged = 0,
            boss = 0,
            protector = 0,
            totalElites = 0,
            vampires = 0,
            rays = 0,
            scatters = 0,
            saboteur = 0,
            commander = 0,
            overcharge = 0,
            destroyedByOrbs = 0,
            destroyedByThorns = 0,
            destroyedByDeathRay = 0,
            destroyedByLandMine = 0,
            destroyedInSpotlight = 0,
            destroyedInGoldenBot = 0
        } = enemyData;

        const option = {
            title: {
                text: `👾 Enemy Distribution (${totalEnemies.toLocaleString()} Total)`,
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#E91E63',
                borderWidth: 1,
                textStyle: { color: '#fff' },
                formatter: function(params) {
                    return `${params.name}<br/>${params.marker}${params.value.toLocaleString()} (${params.percent}%)`;
                }
            },
            legend: {
                orient: 'vertical',
                right: 20,
                top: 'center',
                textStyle: { color: '#fff', fontSize: 11 }
            },
            series: [
                // Inner circle: Basic enemy types
                {
                    name: 'Basic Types',
                    type: 'pie',
                    radius: ['25%', '45%'],
                    center: ['40%', '50%'],
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#000',
                        borderWidth: 2
                    },
                    label: {
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#fff'
                        }
                    },
                    data: [
                        { value: basic, name: '⚪ Basic', itemStyle: { color: '#9E9E9E' } },
                        { value: fast, name: '⚡ Fast', itemStyle: { color: '#2196F3' } },
                        { value: tank, name: '🛡️ Tank', itemStyle: { color: '#FF9800' } },
                        { value: ranged, name: '🏹 Ranged', itemStyle: { color: '#F44336' } },
                        { value: boss, name: '👑 Boss', itemStyle: { color: '#9C27B0' } },
                        { value: protector, name: '🛡️ Protector', itemStyle: { color: '#4CAF50' } }
                    ].filter(item => item.value > 0)
                },
                // Outer circle: Elite types
                {
                    name: 'Elite Types',
                    type: 'pie',
                    radius: ['50%', '70%'],
                    center: ['40%', '50%'],
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#000',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: '{b}\n{c}',
                        fontSize: 11
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    data: [
                        { value: vampires, name: '🧛 Vampires', itemStyle: { color: '#C62828' } },
                        { value: rays, name: '☀️ Rays', itemStyle: { color: '#FDD835' } },
                        { value: scatters, name: '💥 Scatters', itemStyle: { color: '#E91E63' } },
                        { value: saboteur, name: '🔪 Saboteur', itemStyle: { color: '#6A1B9A' } },
                        { value: commander, name: '👨‍✈️ Commander', itemStyle: { color: '#1565C0' } },
                        { value: overcharge, name: '⚡ Overcharge', itemStyle: { color: '#00ACC1' } }
                    ].filter(item => item.value > 0)
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Show destruction methods breakdown
     */
    updateDestructionChart(enemyData) {
        const {
            totalEnemies = 0,
            destroyedByOrbs = 0,
            destroyedByThorns = 0,
            destroyedByDeathRay = 0,
            destroyedByLandMine = 0,
            destroyedInSpotlight = 0,
            destroyedInGoldenBot = 0
        } = enemyData;

        // Calculate direct kills (not by special methods)
        const specialKills = destroyedByOrbs + destroyedByThorns + destroyedByDeathRay +
                           destroyedByLandMine + destroyedInSpotlight + destroyedInGoldenBot;
        const directKills = Math.max(0, totalEnemies - specialKills);

        const option = {
            title: {
                text: '⚔️ Destruction Methods',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#E91E63',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '12%',
                right: '10%',
                top: '18%',
                bottom: '12%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                axisLabel: {
                    color: '#fff',
                    formatter: function(value) {
                        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                        return value.toLocaleString();
                    }
                },
                splitLine: {
                    lineStyle: { color: '#333' }
                }
            },
            yAxis: {
                type: 'category',
                data: ['Direct Kills', 'Orbs', 'Thorns', 'Death Ray', 'Land Mine', 'Spotlight', 'Golden Bot'],
                axisLabel: { color: '#fff', fontSize: 12 },
                axisLine: {
                    lineStyle: { color: '#444' }
                }
            },
            series: [
                {
                    name: 'Enemies Destroyed',
                    type: 'bar',
                    data: [
                        { value: directKills, itemStyle: { color: '#9E9E9E' } },
                        { value: destroyedByOrbs, itemStyle: { color: '#2196F3' } },
                        { value: destroyedByThorns, itemStyle: { color: '#8BC34A' } },
                        { value: destroyedByDeathRay, itemStyle: { color: '#E91E63' } },
                        { value: destroyedByLandMine, itemStyle: { color: '#FF5722' } },
                        { value: destroyedInSpotlight, itemStyle: { color: '#FFEB3B' } },
                        { value: destroyedInGoldenBot, itemStyle: { color: '#FFD700' } }
                    ],
                    barWidth: '60%',
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) {
                            return params.value.toLocaleString();
                        },
                        color: '#fff',
                        fontSize: 11
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    resize() {
        if (this.chart) this.chart.resize();
    }

    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}

window.addEventListener('resize', () => {
    if (window.enemyDistributionChart) window.enemyDistributionChart.resize();
});

window.EnemyDistributionChart = EnemyDistributionChart;
