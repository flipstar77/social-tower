/**
 * Bot Performance Chart
 * Visualizes Flame Bot, Thunder Bot, and Golden Bot contributions
 */

class BotPerformanceChart {
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
                text: '🤖 Bot Performance',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#4CAF50',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            legend: {
                data: ['Flame Bot', 'Thunder Bot', 'Golden Bot'],
                top: 50,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '10%',
                right: '10%',
                bottom: '10%',
                top: '25%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Damage', 'Stuns', 'Coins Earned', 'Enemies Destroyed'],
                axisLabel: {
                    color: '#fff',
                    rotate: 0
                },
                axisLine: {
                    lineStyle: { color: '#444' }
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Value',
                    axisLabel: {
                        color: '#fff',
                        formatter: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    splitLine: {
                        lineStyle: { color: '#333' }
                    }
                }
            ],
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with Bot data from battle report
     * @param {Object} botData - Bot statistics
     */
    updateChart(botData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        const {
            flameBotDamage = 0,
            thunderBotStuns = 0,
            goldenBotCoins = 0,
            destroyedInGoldenBot = 0
        } = botData;

        const option = {
            title: {
                text: '🤖 Bot Performance',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#fff',
                    fontSize: 20,
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
                textStyle: { color: '#fff' },
                formatter: function(params) {
                    let result = `${params[0].axisValue}<br/>`;
                    params.forEach(item => {
                        if (item.value > 0) {
                            result += `${item.marker}${item.seriesName}: ${item.value.toLocaleString()}<br/>`;
                        }
                    });
                    return result;
                }
            },
            legend: {
                data: ['Flame Bot', 'Thunder Bot', 'Golden Bot'],
                top: 50,
                textStyle: { color: '#fff' }
            },
            grid: {
                left: '10%',
                right: '10%',
                bottom: '10%',
                top: '25%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Damage', 'Stuns', 'Coins Earned', 'Enemies Destroyed'],
                axisLabel: {
                    color: '#fff',
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: { color: '#444' }
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#fff',
                    formatter: function(value) {
                        if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
                        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                        return value.toLocaleString();
                    }
                },
                splitLine: {
                    lineStyle: { color: '#333' }
                }
            },
            series: [
                {
                    name: 'Flame Bot',
                    type: 'bar',
                    data: [
                        this.parseNumber(flameBotDamage),
                        0,
                        0,
                        0
                    ],
                    itemStyle: {
                        color: '#FF5722',
                        borderRadius: [5, 5, 0, 0]
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(255, 87, 34, 0.5)'
                        }
                    }
                },
                {
                    name: 'Thunder Bot',
                    type: 'bar',
                    data: [
                        0,
                        thunderBotStuns,
                        0,
                        0
                    ],
                    itemStyle: {
                        color: '#2196F3',
                        borderRadius: [5, 5, 0, 0]
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(33, 150, 243, 0.5)'
                        }
                    }
                },
                {
                    name: 'Golden Bot',
                    type: 'bar',
                    data: [
                        0,
                        0,
                        this.parseNumber(goldenBotCoins),
                        destroyedInGoldenBot
                    ],
                    itemStyle: {
                        color: '#FFD700',
                        borderRadius: [5, 5, 0, 0]
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(255, 215, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Parse number with suffix (K, M, B, T, etc.)
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
    if (window.botPerformanceChart) {
        window.botPerformanceChart.resize();
    }
});

window.BotPerformanceChart = BotPerformanceChart;
