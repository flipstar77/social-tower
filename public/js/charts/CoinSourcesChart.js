/**
 * Coin Sources Chart
 * Sankey diagram showing flow of coin income from different sources
 * Based on new battle report format
 */

class CoinSourcesChart {
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
                text: '💰 Coin Income Sources',
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
                borderColor: '#FFD700',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with coin data from battle report
     * @param {Object} coinData - Coin income data
     */
    updateChart(coinData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        const {
            coinsEarned = 0,
            cashFromGoldenTower = 0,
            coinsFromGoldenTower = 0,
            coinsFromBlackHole = 0,
            coinsFromSpotlight = 0,
            coinsFromOrb = 0,
            coinsFromCoinUpgrade = 0,
            coinsFromCoinBonuses = 0,
            coinsFromDeathWave = 0,
            coinsFetched = 0  // Guardian
        } = coinData;

        // Parse all coin values
        const parsed = {
            total: this.parseNumber(coinsEarned),
            goldenTower: this.parseNumber(coinsFromGoldenTower),
            blackHole: this.parseNumber(coinsFromBlackHole),
            spotlight: this.parseNumber(coinsFromSpotlight),
            orb: this.parseNumber(coinsFromOrb),
            coinUpgrade: this.parseNumber(coinsFromCoinUpgrade),
            coinBonuses: this.parseNumber(coinsFromCoinBonuses),
            deathWave: this.parseNumber(coinsFromDeathWave),
            guardian: this.parseNumber(coinsFetched)
        };

        // Calculate "Other" sources (base coins from kills, etc.)
        const knownSources = parsed.goldenTower + parsed.blackHole + parsed.spotlight +
                           parsed.orb + parsed.coinUpgrade + parsed.coinBonuses +
                           parsed.deathWave + parsed.guardian;
        const otherSources = Math.max(0, parsed.total - knownSources);

        // Prepare Sankey data
        const nodes = [
            { name: 'Coin Upgrades' },
            { name: 'Coin Bonuses' },
            { name: 'Golden Tower' },
            { name: 'Black Hole' },
            { name: 'Spotlight' },
            { name: 'Orb' },
            { name: 'Death Wave' },
            { name: 'Guardian' },
            { name: 'Other Sources' },
            { name: 'Total Coins Earned' }
        ];

        const links = [
            { source: 'Coin Upgrades', target: 'Total Coins Earned', value: parsed.coinUpgrade },
            { source: 'Coin Bonuses', target: 'Total Coins Earned', value: parsed.coinBonuses },
            { source: 'Golden Tower', target: 'Total Coins Earned', value: parsed.goldenTower },
            { source: 'Black Hole', target: 'Total Coins Earned', value: parsed.blackHole },
            { source: 'Spotlight', target: 'Total Coins Earned', value: parsed.spotlight },
            { source: 'Orb', target: 'Total Coins Earned', value: parsed.orb },
            { source: 'Death Wave', target: 'Total Coins Earned', value: parsed.deathWave },
            { source: 'Guardian', target: 'Total Coins Earned', value: parsed.guardian },
            { source: 'Other Sources', target: 'Total Coins Earned', value: otherSources }
        ].filter(link => link.value > 0);

        const option = {
            title: {
                text: '💰 Coin Income Flow',
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
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderColor: '#FFD700',
                borderWidth: 2,
                textStyle: { color: '#fff', fontSize: 14 },
                formatter: function(params) {
                    if (params.dataType === 'edge') {
                        const value = params.value;
                        const formatted = value >= 1e12 ? (value / 1e12).toFixed(2) + 'T' :
                                        value >= 1e9 ? (value / 1e9).toFixed(2) + 'B' :
                                        value >= 1e6 ? (value / 1e6).toFixed(2) + 'M' :
                                        value >= 1e3 ? (value / 1e3).toFixed(2) + 'K' :
                                        value.toLocaleString();
                        return `${params.data.source} → ${params.data.target}<br/>💰 ${formatted} coins`;
                    }
                    return params.name;
                }
            },
            series: [
                {
                    type: 'sankey',
                    layout: 'none',
                    top: '15%',
                    bottom: '10%',
                    left: '5%',
                    right: '5%',
                    nodeWidth: 30,
                    nodeGap: 12,
                    layoutIterations: 0,
                    emphasis: {
                        focus: 'adjacency'
                    },
                    data: nodes,
                    links: links,
                    lineStyle: {
                        color: 'gradient',
                        curveness: 0.5,
                        opacity: 0.6
                    },
                    itemStyle: {
                        borderWidth: 2,
                        borderColor: '#000'
                    },
                    label: {
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        formatter: function(params) {
                            if (params.name === 'Total Coins Earned') {
                                const total = parsed.total;
                                const formatted = total >= 1e12 ? (total / 1e12).toFixed(2) + 'T' :
                                              total >= 1e9 ? (total / 1e9).toFixed(2) + 'B' :
                                              total >= 1e6 ? (total / 1e6).toFixed(2) + 'M' :
                                              total >= 1e3 ? (total / 1e3).toFixed(2) + 'K' :
                                              total.toLocaleString();
                                return `💰 ${formatted}`;
                            }
                            return params.name;
                        }
                    }
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Create pie chart showing coin source percentages
     */
    updatePieChart(coinData) {
        const {
            coinsEarned = 0,
            coinsFromGoldenTower = 0,
            coinsFromBlackHole = 0,
            coinsFromSpotlight = 0,
            coinsFromOrb = 0,
            coinsFromCoinUpgrade = 0,
            coinsFromCoinBonuses = 0,
            coinsFromDeathWave = 0,
            coinsFetched = 0
        } = coinData;

        const option = {
            title: {
                text: '💰 Coin Sources Distribution',
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
                borderColor: '#FFD700',
                borderWidth: 1,
                textStyle: { color: '#fff' },
                formatter: function(params) {
                    const value = params.value || 0;
                    const formatted = value >= 1e12 ? (value / 1e12).toFixed(2) + 'T' :
                                    value >= 1e9 ? (value / 1e9).toFixed(2) + 'B' :
                                    value >= 1e6 ? (value / 1e6).toFixed(2) + 'M' :
                                    value >= 1e3 ? (value / 1e3).toFixed(2) + 'K' :
                                    value.toLocaleString();
                    return `${params.name}<br/>${params.marker}${formatted} (${params.percent}%)`;
                }
            },
            legend: {
                orient: 'vertical',
                right: 20,
                top: 'center',
                textStyle: { color: '#fff' }
            },
            series: [
                {
                    name: 'Coin Sources',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['40%', '50%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#000',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: '{b}\n{d}%'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold'
                        }
                    },
                    data: [
                        { value: this.parseNumber(coinsFromCoinBonuses), name: '💎 Coin Bonuses', itemStyle: { color: '#FFD700' } },
                        { value: this.parseNumber(coinsFromCoinUpgrade), name: '⬆️ Coin Upgrades', itemStyle: { color: '#FFA500' } },
                        { value: this.parseNumber(coinsFromGoldenTower), name: '🏰 Golden Tower', itemStyle: { color: '#FFD700' } },
                        { value: this.parseNumber(coinsFromBlackHole), name: '🌀 Black Hole', itemStyle: { color: '#9C27B0' } },
                        { value: this.parseNumber(coinsFromSpotlight), name: '💡 Spotlight', itemStyle: { color: '#FFEB3B' } },
                        { value: this.parseNumber(coinsFromOrb), name: '🔮 Orb', itemStyle: { color: '#2196F3' } },
                        { value: this.parseNumber(coinsFromDeathWave), name: '💀 Death Wave', itemStyle: { color: '#F44336' } },
                        { value: this.parseNumber(coinsFetched), name: '🛡️ Guardian', itemStyle: { color: '#4CAF50' } }
                    ].filter(item => item.value > 0)
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value || value === '0') return 0;

        const suffixes = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18, 's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30 };
        const match = String(value).match(/^([\d,.]+)([KMBTQSOND]?)$/i);
        if (!match) return 0;

        const num = parseFloat(match[1].replace(/,/g, ''));
        const suffix = match[2].toUpperCase();
        return num * (suffixes[suffix] || 1);
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
    if (window.coinSourcesChart) window.coinSourcesChart.resize();
});

window.CoinSourcesChart = CoinSourcesChart;
