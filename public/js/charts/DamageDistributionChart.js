/**
 * Damage Distribution Chart
 * Shows damage sources breakdown with new battle report fields
 */

class DamageDistributionChart {
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
                text: '💥 Damage Distribution',
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
                borderColor: '#FF5722',
                borderWidth: 1,
                textStyle: { color: '#fff' }
            },
            series: []
        };

        this.chart.setOption(option);
    }

    /**
     * Update chart with damage data from battle report
     * @param {Object} damageData - Damage statistics
     */
    updateChart(damageData) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        const {
            damageDealt = 0,
            projectilesDamage = 0,
            thornDamage = 0,
            orbDamage = 0,
            landMineDamage = 0,
            rendArmorDamage = 0,
            deathRayDamage = 0,
            smartMissileDamage = 0,
            innerLandMineDamage = 0,
            chainLightningDamage = 0,
            deathWaveDamage = 0,
            swampDamage = 0,
            blackHoleDamage = 0,
            flameBotDamage = 0,
            guardianDamage = 0
        } = damageData;

        // Parse all damage values
        const parsed = {
            total: this.parseNumber(damageDealt),
            projectiles: this.parseNumber(projectilesDamage),
            thorn: this.parseNumber(thornDamage),
            orb: this.parseNumber(orbDamage),
            landMine: this.parseNumber(landMineDamage),
            rendArmor: this.parseNumber(rendArmorDamage),
            deathRay: this.parseNumber(deathRayDamage),
            smartMissile: this.parseNumber(smartMissileDamage),
            innerLandMine: this.parseNumber(innerLandMineDamage),
            chainLightning: this.parseNumber(chainLightningDamage),
            deathWave: this.parseNumber(deathWaveDamage),
            swamp: this.parseNumber(swampDamage),
            blackHole: this.parseNumber(blackHoleDamage),
            flameBot: this.parseNumber(flameBotDamage),
            guardian: this.parseNumber(guardianDamage)
        };

        const option = {
            title: {
                text: `💥 Damage Distribution (${this.formatNumber(parsed.total)} Total)`,
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
                borderColor: '#FF5722',
                borderWidth: 2,
                textStyle: { color: '#fff', fontSize: 13 },
                formatter: function(params) {
                    const value = params.value || 0;
                    const formatted = value >= 1e30 ? (value / 1e30).toFixed(2) + 'N' :
                                    value >= 1e27 ? (value / 1e27).toFixed(2) + 'O' :
                                    value >= 1e24 ? (value / 1e24).toFixed(2) + 'S' :
                                    value >= 1e21 ? (value / 1e21).toFixed(2) + 's' :
                                    value >= 1e18 ? (value / 1e18).toFixed(2) + 'Q' :
                                    value >= 1e15 ? (value / 1e15).toFixed(2) + 'q' :
                                    value >= 1e12 ? (value / 1e12).toFixed(2) + 'T' :
                                    value >= 1e9 ? (value / 1e9).toFixed(2) + 'B' :
                                    value >= 1e6 ? (value / 1e6).toFixed(2) + 'M' :
                                    value.toLocaleString();
                    return `${params.name}<br/>${params.marker}${formatted} (${params.percent}%)`;
                }
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#fff', fontSize: 11 },
                formatter: function(name) {
                    return name.length > 15 ? name.substring(0, 15) + '...' : name;
                }
            },
            series: [
                {
                    name: 'Damage Sources',
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
                        formatter: function(params) {
                            if (params.percent < 3) return ''; // Hide small labels
                            return `{name|${params.name}}\n{percent|${params.percent}%}`;
                        },
                        rich: {
                            name: {
                                fontSize: 11,
                                color: '#ccc',
                                lineHeight: 14
                            },
                            percent: {
                                fontSize: 13,
                                fontWeight: 'bold',
                                color: '#fff',
                                lineHeight: 18
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
                        { value: parsed.projectiles, name: '🏹 Projectiles', itemStyle: { color: '#FF6B6B' } },
                        { value: parsed.orb, name: '🔮 Orb', itemStyle: { color: '#4ECDC4' } },
                        { value: parsed.chainLightning, name: '⚡ Chain Lightning', itemStyle: { color: '#FFD93D' } },
                        { value: parsed.thorn, name: '🌿 Thorns', itemStyle: { color: '#95E1D3' } },
                        { value: parsed.blackHole, name: '🌀 Black Hole', itemStyle: { color: '#9C27B0' } },
                        { value: parsed.landMine, name: '💣 Land Mine', itemStyle: { color: '#FF5722' } },
                        { value: parsed.innerLandMine, name: '💣 Inner Land Mine', itemStyle: { color: '#E64A19' } },
                        { value: parsed.smartMissile, name: '🚀 Smart Missile', itemStyle: { color: '#2196F3' } },
                        { value: parsed.deathWave, name: '💀 Death Wave', itemStyle: { color: '#F44336' } },
                        { value: parsed.swamp, name: '🌊 Swamp', itemStyle: { color: '#4CAF50' } },
                        { value: parsed.deathRay, name: '☠️ Death Ray', itemStyle: { color: '#E91E63' } },
                        { value: parsed.rendArmor, name: '🔪 Rend Armor', itemStyle: { color: '#FF9800' } },
                        { value: parsed.flameBot, name: '🔥 Flame Bot', itemStyle: { color: '#FF5722' } },
                        { value: parsed.guardian, name: '🛡️ Guardian', itemStyle: { color: '#673AB7' } }
                    ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)
                }
            ]
        };

        this.chart.setOption(option, true);
    }

    /**
     * Create bar chart for damage sources
     */
    updateBarChart(damageData) {
        const {
            damageDealt = 0,
            projectilesDamage = 0,
            thornDamage = 0,
            orbDamage = 0,
            landMineDamage = 0,
            rendArmorDamage = 0,
            deathRayDamage = 0,
            smartMissileDamage = 0,
            innerLandMineDamage = 0,
            chainLightningDamage = 0,
            deathWaveDamage = 0,
            swampDamage = 0,
            blackHoleDamage = 0,
            flameBotDamage = 0,
            guardianDamage = 0
        } = damageData;

        const sources = [
            { name: 'Projectiles', value: this.parseNumber(projectilesDamage), color: '#FF6B6B' },
            { name: 'Orb', value: this.parseNumber(orbDamage), color: '#4ECDC4' },
            { name: 'Chain Lightning', value: this.parseNumber(chainLightningDamage), color: '#FFD93D' },
            { name: 'Thorns', value: this.parseNumber(thornDamage), color: '#95E1D3' },
            { name: 'Black Hole', value: this.parseNumber(blackHoleDamage), color: '#9C27B0' },
            { name: 'Land Mine', value: this.parseNumber(landMineDamage), color: '#FF5722' },
            { name: 'Smart Missile', value: this.parseNumber(smartMissileDamage), color: '#2196F3' },
            { name: 'Death Wave', value: this.parseNumber(deathWaveDamage), color: '#F44336' },
            { name: 'Swamp', value: this.parseNumber(swampDamage), color: '#4CAF50' }
        ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);

        const option = {
            title: {
                text: '💥 Top Damage Sources',
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
                borderColor: '#FF5722',
                borderWidth: 1,
                textStyle: { color: '#fff' },
                formatter: function(params) {
                    const value = params[0].value;
                    const formatted = value >= 1e30 ? (value / 1e30).toFixed(2) + 'N' :
                                    value >= 1e27 ? (value / 1e27).toFixed(2) + 'O' :
                                    value >= 1e24 ? (value / 1e24).toFixed(2) + 'S' :
                                    value >= 1e21 ? (value / 1e21).toFixed(2) + 's' :
                                    value >= 1e18 ? (value / 1e18).toFixed(2) + 'Q' :
                                    value >= 1e15 ? (value / 1e15).toFixed(2) + 'q' :
                                    value >= 1e12 ? (value / 1e12).toFixed(2) + 'T' :
                                    value >= 1e9 ? (value / 1e9).toFixed(2) + 'B' :
                                    value.toLocaleString();
                    return `${params[0].name}<br/>💥 ${formatted}`;
                }
            },
            grid: {
                left: '15%',
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
                        if (value >= 1e24) return (value / 1e24).toFixed(0) + 'S';
                        if (value >= 1e21) return (value / 1e21).toFixed(0) + 's';
                        if (value >= 1e18) return (value / 1e18).toFixed(0) + 'Q';
                        if (value >= 1e15) return (value / 1e15).toFixed(0) + 'q';
                        if (value >= 1e12) return (value / 1e12).toFixed(0) + 'T';
                        if (value >= 1e9) return (value / 1e9).toFixed(0) + 'B';
                        return value;
                    }
                },
                splitLine: {
                    lineStyle: { color: '#333' }
                }
            },
            yAxis: {
                type: 'category',
                data: sources.map(s => s.name),
                axisLabel: { color: '#fff', fontSize: 12 },
                axisLine: {
                    lineStyle: { color: '#444' }
                }
            },
            series: [
                {
                    name: 'Damage',
                    type: 'bar',
                    data: sources.map(s => ({
                        value: s.value,
                        itemStyle: { color: s.color, borderRadius: [0, 5, 5, 0] }
                    })),
                    barWidth: '60%',
                    label: {
                        show: true,
                        position: 'right',
                        formatter: function(params) {
                            const value = params.value;
                            if (value >= 1e24) return (value / 1e24).toFixed(1) + 'S';
                            if (value >= 1e21) return (value / 1e21).toFixed(1) + 's';
                            if (value >= 1e18) return (value / 1e18).toFixed(1) + 'Q';
                            if (value >= 1e15) return (value / 1e15).toFixed(1) + 'q';
                            if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
                            if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                            return value.toLocaleString();
                        },
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 'bold'
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

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value || value === '0') return 0;

        const suffixes = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18, 's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30, 'D': 1e33 };
        const match = String(value).match(/^([\d,.]+)([KMBTQSOND]?)$/i);
        if (!match) return 0;

        const num = parseFloat(match[1].replace(/,/g, ''));
        const suffix = match[2].toUpperCase();
        return num * (suffixes[suffix] || 1);
    }

    formatNumber(value) {
        if (value >= 1e30) return (value / 1e30).toFixed(2) + 'N';
        if (value >= 1e27) return (value / 1e27).toFixed(2) + 'O';
        if (value >= 1e24) return (value / 1e24).toFixed(2) + 'S';
        if (value >= 1e21) return (value / 1e21).toFixed(2) + 's';
        if (value >= 1e18) return (value / 1e18).toFixed(2) + 'Q';
        if (value >= 1e15) return (value / 1e15).toFixed(2) + 'q';
        if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        return value.toLocaleString();
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
    if (window.damageDistributionChart) window.damageDistributionChart.resize();
});

window.DamageDistributionChart = DamageDistributionChart;
