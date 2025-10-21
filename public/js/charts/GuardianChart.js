/**
 * Guardian Performance Chart
 * Visualizes Guardian damage, coins fetched, summoned enemies, and items collected
 */

class GuardianChart {
    constructor() {
        this.chart = null;
        this.container = null;
    }

    /**
     * Initialize the Guardian chart
     * @param {string} containerId - DOM element ID for the chart container
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        this.chart = echarts.init(this.container, 'dark');
        this.setupDefaultChart();
    }

    /**
     * Setup default empty chart
     */
    setupDefaultChart() {
        const option = {
            title: {
                text: '🛡️ Guardian Performance',
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
                borderColor: '#4CAF50',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            legend: {
                orient: 'vertical',
                right: 30,
                top: 'center',
                textStyle: { color: '#fff' }
            },
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with Guardian data from battle report
     * @param {Object} guardianData - Guardian statistics from battle report
     */
    updateChart(guardianData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        const {
            damage = 0,
            summonedEnemies = 0,
            coinsFetched = 0,
            coinsStolen = 0,
            gems = 0,
            medals = 0,
            rerollShards = 0,
            cannonShards = 0,
            armorShards = 0,
            generatorShards = 0,
            coreShards = 0,
            commonModules = 0,
            rareModules = 0
        } = guardianData;

        // Calculate Guardian efficiency
        const totalItemsFetched = gems + medals + rerollShards + cannonShards +
                                  armorShards + generatorShards + coreShards +
                                  commonModules + rareModules;

        const option = {
            title: {
                text: '🛡️ Guardian Performance',
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
                borderColor: '#4CAF50',
                borderWidth: 1,
                textStyle: { color: '#fff' },
                formatter: function(params) {
                    const value = params.value || 0;
                    const percent = params.percent || 0;
                    return `${params.name}<br/>${params.marker}${value.toLocaleString()} (${percent.toFixed(1)}%)`;
                }
            },
            legend: {
                orient: 'vertical',
                right: 30,
                top: 'center',
                textStyle: { color: '#fff' },
                formatter: function(name) {
                    return name;
                }
            },
            series: [
                {
                    name: 'Guardian Stats',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#000',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: '#fff',
                            formatter: function(params) {
                                return `{name|${params.name}}\n{value|${params.value.toLocaleString()}}`;
                            },
                            rich: {
                                name: {
                                    fontSize: 16,
                                    color: '#ccc',
                                    lineHeight: 20
                                },
                                value: {
                                    fontSize: 28,
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    lineHeight: 40
                                }
                            }
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        {
                            value: parseFloat(this.parseNumber(damage)),
                            name: '⚔️ Damage Dealt',
                            itemStyle: { color: '#FF6B6B' }
                        },
                        {
                            value: summonedEnemies,
                            name: '👾 Enemies Summoned',
                            itemStyle: { color: '#4ECDC4' }
                        },
                        {
                            value: parseFloat(this.parseNumber(coinsFetched)),
                            name: '💰 Coins Fetched',
                            itemStyle: { color: '#FFD93D' }
                        },
                        {
                            value: parseFloat(this.parseNumber(coinsStolen)),
                            name: '🪙 Coins Stolen',
                            itemStyle: { color: '#FFA726' }
                        },
                        {
                            value: totalItemsFetched,
                            name: '🎁 Items Collected',
                            itemStyle: { color: '#9C27B0' }
                        }
                    ].filter(item => item.value > 0) // Only show non-zero values
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Update chart with Guardian items breakdown
     * @param {Object} guardianData - Guardian statistics
     */
    updateItemsBreakdown(guardianData) {
        const {
            gems = 0,
            medals = 0,
            rerollShards = 0,
            cannonShards = 0,
            armorShards = 0,
            generatorShards = 0,
            coreShards = 0,
            commonModules = 0,
            rareModules = 0
        } = guardianData;

        const option = {
            title: {
                text: '🎁 Guardian Items Collected',
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
                borderColor: '#4CAF50',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '20%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Gems', 'Medals', 'Reroll', 'Cannon', 'Armor', 'Generator', 'Core', 'Common', 'Rare'],
                axisLabel: {
                    color: '#fff',
                    rotate: 45
                },
                axisLine: {
                    lineStyle: { color: '#444' }
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#fff' },
                splitLine: {
                    lineStyle: { color: '#333' }
                }
            },
            series: [
                {
                    name: 'Items',
                    type: 'bar',
                    data: [
                        { value: gems, itemStyle: { color: '#E91E63' } },
                        { value: medals, itemStyle: { color: '#FFC107' } },
                        { value: rerollShards, itemStyle: { color: '#9C27B0' } },
                        { value: cannonShards, itemStyle: { color: '#F44336' } },
                        { value: armorShards, itemStyle: { color: '#2196F3' } },
                        { value: generatorShards, itemStyle: { color: '#4CAF50' } },
                        { value: coreShards, itemStyle: { color: '#FF9800' } },
                        { value: commonModules, itemStyle: { color: '#607D8B' } },
                        { value: rareModules, itemStyle: { color: '#673AB7' } }
                    ],
                    barWidth: '60%',
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

    /**
     * Parse number with suffix (K, M, B, T, etc.)
     * @param {string|number} value - Value to parse
     * @returns {number} - Parsed number
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value || value === '0') return 0;

        const suffixes = {
            'K': 1e3,
            'M': 1e6,
            'B': 1e9,
            'T': 1e12,
            'q': 1e15,
            'Q': 1e18,
            's': 1e21,
            'S': 1e24,
            'O': 1e27,
            'N': 1e30,
            'D': 1e33
        };

        const match = String(value).match(/^([\d,.]+)([KMBTQSOND]?)$/i);
        if (!match) return 0;

        const num = parseFloat(match[1].replace(/,/g, ''));
        const suffix = match[2].toUpperCase();

        return num * (suffixes[suffix] || 1);
    }

    /**
     * Resize chart when window resizes
     */
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    /**
     * Dispose chart instance
     */
    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}

// Auto-resize on window resize
window.addEventListener('resize', () => {
    if (window.guardianChart) {
        window.guardianChart.resize();
    }
});

// Export for use
window.GuardianChart = GuardianChart;
