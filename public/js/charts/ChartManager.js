/**
 * ChartManager - Manages dashboard charts using Apache ECharts
 * Implements Figma design system with dark theme
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.theme = {
            background: '#0A0D10',
            cardBg: '#0A0D10',
            textPrimary: '#FFFFFF',
            textSecondary: '#CED8E1',
            gridLine: '#324B55',
            colors: {
                primary: '#F72585',
                secondary: '#7209B7',
                tertiary: '#0A9396',
                accent: '#FFC300',
                cyan: '#00FAFF',
                success: '#00D5FF'
            }
        };
    }

    /**
     * Initialize all charts in the dashboard
     */
    async init() {
        console.log('🎨 Initializing ChartManager...');

        // Wait for ECharts library to load
        if (typeof echarts === 'undefined') {
            console.error('❌ ECharts library not loaded');
            return;
        }

        console.log('✅ ECharts library loaded, version:', echarts.version);

        // Initialize individual charts with error handling
        try {
            this.initVerticalBarChart();
            this.initHorizontalBars();
            this.initLineChart();
            this.initAreaChart();

            console.log('✅ ChartManager initialized with', this.charts.size, 'charts');

            // Log chart container dimensions
            ['chart-vertical-bars', 'chart-horizontal-bars', 'chart-line', 'chart-area'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    console.log(`📏 ${id}: ${el.offsetWidth}x${el.offsetHeight}px`);
                }
            });
        } catch (error) {
            console.error('❌ Error initializing charts:', error);
        }
    }

    /**
     * Vertical Bar Chart - Statistics of the month
     * Dual dataset with rounded bars
     */
    initVerticalBarChart() {
        const container = document.getElementById('chart-vertical-bars');
        if (!container) {
            console.warn('⚠️ Vertical bar chart container not found');
            return;
        }

        const chart = echarts.init(container);

        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: '10%',
                right: '5%',
                top: '15%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: {
                    lineStyle: {
                        color: this.theme.gridLine
                    }
                },
                axisLabel: {
                    color: this.theme.textPrimary,
                    fontSize: 12
                }
            },
            yAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        color: this.theme.gridLine,
                        type: 'solid'
                    }
                },
                axisLabel: {
                    color: this.theme.textPrimary,
                    fontSize: 12
                }
            },
            series: [
                {
                    name: 'Data one',
                    type: 'bar',
                    data: [120, 80, 150, 100, 110, 125, 140],
                    itemStyle: {
                        color: this.theme.colors.primary,
                        borderRadius: [30, 30, 0, 0]
                    },
                    barWidth: '20%'
                },
                {
                    name: 'Data two',
                    type: 'bar',
                    data: [60, 50, 80, 90, 120, 70, 85],
                    itemStyle: {
                        color: this.theme.colors.secondary,
                        borderRadius: [30, 30, 0, 0]
                    },
                    barWidth: '20%'
                }
            ],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: this.theme.colors.primary,
                textStyle: {
                    color: this.theme.textPrimary
                }
            }
        };

        chart.setOption(option);
        this.charts.set('verticalBars', chart);

        // Resize on window resize
        window.addEventListener('resize', () => chart.resize());
    }

    /**
     * Horizontal Progress Bars
     * Shows metrics with background/foreground bars
     */
    initHorizontalBars() {
        const container = document.getElementById('chart-horizontal-bars');
        if (!container) {
            console.warn('⚠️ Horizontal bars container not found');
            return;
        }

        const chart = echarts.init(container);

        const categories = ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7'];
        const maxValues = [100, 100, 100, 100, 100, 100, 100];
        const actualValues = [40, 85, 55, 70, 52, 38, 70];

        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: '5%',
                right: '5%',
                top: '5%',
                bottom: '5%',
                containLabel: false
            },
            xAxis: {
                type: 'value',
                max: 100,
                show: false
            },
            yAxis: {
                type: 'category',
                data: categories,
                show: false,
                inverse: true
            },
            series: [
                // Background bars
                {
                    type: 'bar',
                    data: maxValues,
                    itemStyle: {
                        color: '#151A20',
                        borderRadius: 60
                    },
                    barWidth: 16,
                    z: 1,
                    silent: true
                },
                // Foreground bars
                {
                    type: 'bar',
                    data: actualValues,
                    itemStyle: {
                        color: this.theme.colors.tertiary,
                        borderRadius: 60
                    },
                    barWidth: 16,
                    z: 2,
                    label: {
                        show: false
                    }
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                textStyle: {
                    color: this.theme.textPrimary
                }
            }
        };

        chart.setOption(option);
        this.charts.set('horizontalBars', chart);

        window.addEventListener('resize', () => chart.resize());
    }

    /**
     * Line Chart - Temperature/Altitude style
     * Shows trend with dots and connecting lines
     */
    initLineChart() {
        const container = document.getElementById('chart-line');
        if (!container) {
            console.warn('⚠️ Line chart container not found');
            return;
        }

        const chart = echarts.init(container);

        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: '12%',
                right: '5%',
                top: '10%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                data: ['-80', '-70', '-60', '-50', '-40', '-30', '-20', '-10'],
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: this.theme.textPrimary,
                    fontSize: 13
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: this.theme.gridLine,
                        type: 'solid'
                    }
                }
            },
            yAxis: {
                type: 'value',
                data: ['0 km', '25 km', '50 km', '75 km'],
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: this.theme.textPrimary,
                    fontSize: 13
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: this.theme.gridLine
                    }
                }
            },
            series: [
                {
                    type: 'line',
                    data: [75, 60, 25, 50, 30, 15, 45],
                    smooth: true,
                    lineStyle: {
                        color: this.theme.colors.accent,
                        width: 4
                    },
                    itemStyle: {
                        color: this.theme.colors.accent,
                        borderColor: this.theme.cardBg,
                        borderWidth: 2
                    },
                    symbol: 'circle',
                    symbolSize: 12,
                    emphasis: {
                        scale: true,
                        scaleSize: 15
                    }
                }
            ],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: this.theme.colors.accent,
                textStyle: {
                    color: this.theme.textPrimary
                }
            }
        };

        chart.setOption(option);
        this.charts.set('lineChart', chart);

        window.addEventListener('resize', () => chart.resize());
    }

    /**
     * Area Chart - Time series with gradient
     * Temperature theme with smooth curves
     */
    initAreaChart() {
        const container = document.getElementById('chart-area');
        if (!container) {
            console.warn('⚠️ Area chart container not found');
            return;
        }

        const chart = echarts.init(container);

        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: '5%',
                right: '5%',
                top: '10%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['8:00am', '10:00am', '12:00pm', '1:00pm', '3:00pm'],
                boundaryGap: false,
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: this.theme.textPrimary,
                    fontSize: 13
                }
            },
            yAxis: {
                type: 'value',
                show: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#151A20'
                    }
                }
            },
            series: [
                {
                    type: 'line',
                    data: [2.5, 3.8, 2.2, 4.1, 3.5],
                    smooth: true,
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                {
                                    offset: 0,
                                    color: 'rgba(0, 250, 255, 0.3)'
                                },
                                {
                                    offset: 1,
                                    color: 'rgba(0, 250, 255, 0)'
                                }
                            ]
                        }
                    },
                    lineStyle: {
                        color: this.theme.colors.cyan,
                        width: 3
                    },
                    itemStyle: {
                        color: this.theme.colors.cyan
                    },
                    symbol: 'none',
                    emphasis: {
                        itemStyle: {
                            borderWidth: 0
                        }
                    }
                }
            ],
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: this.theme.colors.cyan,
                textStyle: {
                    color: this.theme.textPrimary
                },
                axisPointer: {
                    type: 'line',
                    lineStyle: {
                        color: this.theme.colors.cyan,
                        type: 'dashed'
                    }
                }
            }
        };

        chart.setOption(option);
        this.charts.set('areaChart', chart);

        window.addEventListener('resize', () => chart.resize());
    }

    /**
     * Update chart with new data
     */
    updateChart(chartId, data) {
        const chart = this.charts.get(chartId);
        if (!chart) {
            console.warn(`⚠️ Chart ${chartId} not found`);
            return;
        }

        chart.setOption(data);
    }

    /**
     * Dispose all charts (cleanup)
     */
    dispose() {
        this.charts.forEach(chart => chart.dispose());
        this.charts.clear();
    }
}

// Export for use in other modules
window.ChartManager = ChartManager;
