/**
 * Resource Collection Chart
 * Visualizes shards, modules, gems, and medals collected
 */

class ResourceCollectionChart {
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
                text: '💎 Resource Collection',
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
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with resource data from battle report
     * @param {Object} resourceData - Resource statistics
     */
    updateChart(resourceData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

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
        } = resourceData;

        // Total shards (excluding reroll)
        const totalShards = cannonShards + armorShards + generatorShards + coreShards;
        const totalModules = commonModules + rareModules;

        const option = {
            title: {
                text: '💎 Resource Collection',
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
                orient: 'horizontal',
                bottom: 20,
                textStyle: { color: '#fff' },
                formatter: function(name) {
                    return name;
                }
            },
            series: [
                // Main resource categories (outer ring)
                {
                    name: 'Resource Categories',
                    type: 'pie',
                    radius: ['55%', '75%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#000',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: function(params) {
                            return `{name|${params.name}}\n{value|${params.value.toLocaleString()}}`;
                        },
                        rich: {
                            name: {
                                fontSize: 12,
                                color: '#ccc',
                                lineHeight: 16
                            },
                            value: {
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#fff',
                                lineHeight: 20
                            }
                        }
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: true,
                        length: 15,
                        length2: 10
                    },
                    data: [
                        {
                            value: gems,
                            name: '💎 Gems',
                            itemStyle: { color: '#E91E63' }
                        },
                        {
                            value: medals,
                            name: '🏅 Medals',
                            itemStyle: { color: '#FFC107' }
                        },
                        {
                            value: rerollShards,
                            name: '🔄 Reroll Shards',
                            itemStyle: { color: '#9C27B0' }
                        },
                        {
                            value: totalShards,
                            name: '🔧 Equipment Shards',
                            itemStyle: { color: '#4CAF50' }
                        },
                        {
                            value: totalModules,
                            name: '📦 Modules',
                            itemStyle: { color: '#673AB7' }
                        }
                    ].filter(item => item.value > 0)
                },
                // Shard breakdown (inner ring)
                {
                    name: 'Shard Details',
                    type: 'pie',
                    radius: ['35%', '50%'],
                    center: ['50%', '45%'],
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
                            color: '#fff',
                            formatter: function(params) {
                                return `${params.name}\n${params.value.toLocaleString()}`;
                            }
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        {
                            value: cannonShards,
                            name: '🔫 Cannon',
                            itemStyle: { color: '#F44336', opacity: 0.8 }
                        },
                        {
                            value: armorShards,
                            name: '🛡️ Armor',
                            itemStyle: { color: '#2196F3', opacity: 0.8 }
                        },
                        {
                            value: generatorShards,
                            name: '⚡ Generator',
                            itemStyle: { color: '#8BC34A', opacity: 0.8 }
                        },
                        {
                            value: coreShards,
                            name: '💠 Core',
                            itemStyle: { color: '#FF9800', opacity: 0.8 }
                        },
                        {
                            value: commonModules,
                            name: '📦 Common',
                            itemStyle: { color: '#607D8B', opacity: 0.8 }
                        },
                        {
                            value: rareModules,
                            name: '✨ Rare',
                            itemStyle: { color: '#9C27B0', opacity: 0.8 }
                        }
                    ].filter(item => item.value > 0)
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Create stacked bar chart for shard progression over time
     * @param {Array} historicalData - Array of resource data from multiple runs
     */
    updateProgressionChart(historicalData) {
        if (!this.chart || !historicalData || historicalData.length === 0) {
            return;
        }

        const dates = historicalData.map(run => run.date || 'Run ' + run.id);
        const cannonData = historicalData.map(run => run.cannonShards || 0);
        const armorData = historicalData.map(run => run.armorShards || 0);
        const generatorData = historicalData.map(run => run.generatorShards || 0);
        const coreData = historicalData.map(run => run.coreShards || 0);
        const rerollData = historicalData.map(run => run.rerollShards || 0);

        const option = {
            title: {
                text: '📊 Shard Collection Over Time',
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
            legend: {
                data: ['Cannon', 'Armor', 'Generator', 'Core', 'Reroll'],
                top: 45,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '8%',
                right: '8%',
                top: '22%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
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
                    name: 'Cannon',
                    type: 'bar',
                    stack: 'shards',
                    data: cannonData,
                    itemStyle: { color: '#F44336' }
                },
                {
                    name: 'Armor',
                    type: 'bar',
                    stack: 'shards',
                    data: armorData,
                    itemStyle: { color: '#2196F3' }
                },
                {
                    name: 'Generator',
                    type: 'bar',
                    stack: 'shards',
                    data: generatorData,
                    itemStyle: { color: '#8BC34A' }
                },
                {
                    name: 'Core',
                    type: 'bar',
                    stack: 'shards',
                    data: coreData,
                    itemStyle: { color: '#FF9800' }
                },
                {
                    name: 'Reroll',
                    type: 'bar',
                    stack: 'shards',
                    data: rerollData,
                    itemStyle: { color: '#9C27B0' }
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}

window.addEventListener('resize', () => {
    if (window.resourceCollectionChart) {
        window.resourceCollectionChart.resize();
    }
});

window.ResourceCollectionChart = ResourceCollectionChart;
