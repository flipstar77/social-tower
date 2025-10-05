/**
 * RunComparison - Interactive run comparison and visualization
 * Allows selecting multiple runs and comparing their stats
 */

class RunComparison {
    constructor() {
        this.selectedRuns = [];
        this.allRuns = [];
        this.charts = new Map();
    }

    /**
     * Initialize the comparison system
     */
    async init() {
        console.log('📊 Initializing Run Comparison...');
        await this.loadRuns();
        this.createComparisonUI();
        this.initializeCharts();
    }

    /**
     * Load runs from tower analytics
     */
    async loadRuns() {
        try {
            // Try migration manager first
            if (window.towerMigration?.analyticsManager?.runs) {
                this.allRuns = window.towerMigration.analyticsManager.runs;
            } else {
                const response = await fetch('/api/tower/runs?limit=50');
                const data = await response.json();
                this.allRuns = data.runs || [];
            }

            // Sort by date (newest first)
            this.allRuns.sort((a, b) => {
                const dateA = new Date(a.submitted_at || a.timestamp || a.created_at);
                const dateB = new Date(b.submitted_at || b.timestamp || b.created_at);
                return dateB - dateA; // Descending (newest first)
            });

            console.log(`✅ Loaded ${this.allRuns.length} runs for comparison`);
            if (this.allRuns.length > 0) {
                console.log(`📅 Latest run: T${this.allRuns[0]?.tier} W${this.allRuns[0]?.wave} (${new Date(this.allRuns[0]?.submitted_at).toLocaleString()})`);
            }
        } catch (error) {
            console.error('❌ Failed to load runs:', error);
        }
    }

    /**
     * Create comparison UI
     */
    createComparisonUI() {
        const container = document.getElementById('run-comparison-container');
        if (!container) {
            console.warn('⚠️ Run comparison container not found');
            return;
        }

        container.innerHTML = `
            <div class="comparison-controls">
                <h2 class="section-title" style="color: #FFF; font-size: 24px; margin-bottom: 20px; font-weight: 600;">🔍 Compare Runs</h2>
                <div class="run-selector-grid">
                    ${this.allRuns.slice(0, 15).map((run, i) => `
                        <div class="run-selector-card ${i === 0 ? 'newest-run' : ''}" data-run-index="${i}">
                            ${i === 0 ? '<div class="new-badge">NEW!</div>' : ''}
                            <input type="checkbox" id="run-${run.id}" class="run-checkbox" data-run-id="${run.id}">
                            <label for="run-${run.id}" class="run-label">
                                <div class="run-tier">T${run.tier}</div>
                                <div class="run-wave">Wave ${run.wave}</div>
                                <div class="run-coins">${run.coins_earned || 'N/A'}</div>
                                <div class="run-time">${new Date(run.submitted_at).toLocaleDateString()}</div>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="comparison-actions">
                    <button id="visualize-btn" class="visualize-btn" disabled>
                        📊 Visualize Selected Runs
                    </button>
                    <button id="clear-selection-btn" class="clear-btn">
                        🗑️ Clear Selection
                    </button>
                </div>
            </div>

            <div class="comparison-charts-grid">
                <!-- Enemy Distribution Pie Chart -->
                <div class="comparison-chart-card">
                    <h3>Enemy Distribution</h3>
                    <div id="enemy-distribution-chart" style="height: 300px;"></div>
                </div>

                <!-- Hourly Coins by Tier -->
                <div class="comparison-chart-card">
                    <h3>Hourly Coins by Tier</h3>
                    <div id="hourly-coins-chart" style="height: 300px;"></div>
                </div>

                <!-- Run Comparison Line Chart -->
                <div class="comparison-chart-card full-width">
                    <h3>Run Progression Comparison</h3>
                    <div class="metric-selector">
                        <button class="metric-btn active" data-metric="wave">Waves</button>
                        <button class="metric-btn" data-metric="coins">Coins</button>
                        <button class="metric-btn" data-metric="cells">Cells</button>
                        <button class="metric-btn" data-metric="damage">Damage</button>
                    </div>
                    <div id="run-comparison-line-chart" style="height: 350px;"></div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Checkbox selection
        document.querySelectorAll('.run-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const runId = e.target.dataset.runId;
                if (e.target.checked) {
                    const run = this.allRuns.find(r => r.id === runId);
                    if (run && this.selectedRuns.length < 5) {
                        this.selectedRuns.push(run);
                    } else if (this.selectedRuns.length >= 5) {
                        e.target.checked = false;
                        alert('Maximum 5 runs can be selected');
                    }
                } else {
                    this.selectedRuns = this.selectedRuns.filter(r => r.id !== runId);
                }
                this.updateVisualizeButton();
            });
        });

        // Visualize button
        const visualizeBtn = document.getElementById('visualize-btn');
        if (visualizeBtn) {
            visualizeBtn.addEventListener('click', () => this.visualizeSelectedRuns());
        }

        // Clear selection
        const clearBtn = document.getElementById('clear-selection-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.selectedRuns = [];
                document.querySelectorAll('.run-checkbox').forEach(cb => cb.checked = false);
                this.updateVisualizeButton();
            });
        }

        // Metric selector
        document.querySelectorAll('.metric-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateComparisonChart(e.target.dataset.metric);
            });
        });
    }

    /**
     * Update visualize button state
     */
    updateVisualizeButton() {
        const btn = document.getElementById('visualize-btn');
        if (btn) {
            btn.disabled = this.selectedRuns.length === 0;
            btn.textContent = `📊 Visualize ${this.selectedRuns.length} Run${this.selectedRuns.length !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Initialize chart instances
     */
    initializeCharts() {
        if (typeof echarts === 'undefined') return;

        const enemyChart = echarts.init(document.getElementById('enemy-distribution-chart'));
        const hourlyChart = echarts.init(document.getElementById('hourly-coins-chart'));
        const comparisonChart = echarts.init(document.getElementById('run-comparison-line-chart'));

        this.charts.set('enemy', enemyChart);
        this.charts.set('hourly', hourlyChart);
        this.charts.set('comparison', comparisonChart);

        window.addEventListener('resize', () => {
            this.charts.forEach(chart => chart.resize());
        });
    }

    /**
     * Visualize selected runs
     */
    visualizeSelectedRuns() {
        if (this.selectedRuns.length === 0) return;

        console.log(`📊 Visualizing ${this.selectedRuns.length} runs`);

        this.updateEnemyDistribution();
        this.updateHourlyCoins();
        this.updateComparisonChart('wave');
    }

    /**
     * Update enemy distribution pie chart
     */
    updateEnemyDistribution() {
        const chart = this.charts.get('enemy');
        if (!chart || this.selectedRuns.length === 0) return;

        // Aggregate enemy data from selected runs
        const enemyData = {
            basic: 0,
            fast: 0,
            tank: 0,
            ranged: 0,
            boss: 0,
            protector: 0,
            elites: 0
        };

        this.selectedRuns.forEach(run => {
            enemyData.basic += parseInt(run.basic_enemies || 0);
            enemyData.fast += parseInt(run.fast_enemies || 0);
            enemyData.tank += parseInt(run.tank_enemies || 0);
            enemyData.ranged += parseInt(run.ranged_enemies || 0);
            enemyData.boss += parseInt(run.boss_enemies || 0);
            enemyData.protector += parseInt(run.protector_enemies || 0);
            enemyData.elites += parseInt(run.total_elites || 0);
        });

        // Filter out categories with very low counts and group small ones
        const total = Object.values(enemyData).reduce((a, b) => a + b, 0);
        const chartData = [];

        if (enemyData.basic > 0) chartData.push({ value: enemyData.basic, name: 'Basic', itemStyle: { color: '#4CAF50' } });
        if (enemyData.fast > 0) chartData.push({ value: enemyData.fast, name: 'Fast', itemStyle: { color: '#FF9800' } });
        if (enemyData.tank > 0) chartData.push({ value: enemyData.tank, name: 'Tank', itemStyle: { color: '#F44336' } });
        if (enemyData.ranged > 0) chartData.push({ value: enemyData.ranged, name: 'Ranged', itemStyle: { color: '#2196F3' } });

        // Group small categories as "Other"
        const otherCount = (enemyData.boss || 0) + (enemyData.protector || 0) + (enemyData.elites || 0);
        if (otherCount > 0) {
            chartData.push({
                value: otherCount,
                name: 'Boss/Elite/Protector',
                itemStyle: { color: '#9C27B0' }
            });
        }

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                textStyle: { color: '#fff' }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { color: '#fff', fontSize: 12 },
                formatter: (name) => {
                    const item = chartData.find(d => d.name === name);
                    if (!item) return name;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return `${name} (${percent}%)`;
                }
            },
            series: [{
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['60%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#0A0D10',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{d}%',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 'bold'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 18,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                data: chartData
            }]
        };

        chart.setOption(option);
        console.log('✅ Updated enemy distribution chart');
    }

    /**
     * Update hourly coins by tier bar chart
     */
    updateHourlyCoins() {
        const chart = this.charts.get('hourly');
        if (!chart || this.selectedRuns.length === 0) return;

        // Group by tier
        const tierData = {};
        this.selectedRuns.forEach(run => {
            const tier = run.tier;
            const coins = this.parseNumber(run.coins_earned || '0');
            const hours = this.parseTime(run.real_time || run.run_duration || '1h');
            const hourlyCoins = coins / Math.max(hours, 1);

            if (!tierData[tier]) {
                tierData[tier] = { total: 0, count: 0 };
            }
            tierData[tier].total += hourlyCoins;
            tierData[tier].count += 1;
        });

        const tiers = Object.keys(tierData).sort((a, b) => b - a);
        const avgHourly = tiers.map(tier =>
            tierData[tier].total / tierData[tier].count
        );

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(0,0,0,0.8)',
                textStyle: { color: '#fff' },
                formatter: (params) => {
                    const value = params[0].value;
                    return `${params[0].name}<br/>Avg: ${this.formatNumber(value)}/hr`;
                }
            },
            grid: {
                left: '15%',
                right: '10%',
                bottom: '20%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: tiers.map(t => `Tier ${t}`),
                axisLabel: {
                    color: '#fff',
                    rotate: 0,
                    fontSize: 12
                },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#fff',
                    formatter: (value) => this.formatNumber(value)
                },
                splitLine: { lineStyle: { color: '#324B55' } }
            },
            series: [{
                type: 'bar',
                data: avgHourly,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#F72585' },
                        { offset: 1, color: '#7209B7' }
                    ]),
                    borderRadius: [10, 10, 0, 0]
                },
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    formatter: (params) => this.formatNumber(params.value),
                    color: '#fff',
                    fontSize: 11
                }
            }]
        };

        chart.setOption(option);
        console.log('✅ Updated hourly coins chart');
    }

    /**
     * Update comparison line chart
     */
    updateComparisonChart(metric = 'wave') {
        const chart = this.charts.get('comparison');
        if (!chart || this.selectedRuns.length === 0) return;

        const series = this.selectedRuns.map((run, i) => {
            let value;
            switch (metric) {
                case 'wave':
                    value = parseInt(run.wave || 0);
                    break;
                case 'coins':
                    value = this.parseNumber(run.coins_earned || '0');
                    break;
                case 'cells':
                    value = this.parseNumber(run.cells_earned || '0');
                    break;
                case 'damage':
                    value = this.parseNumber(run.damage_dealt || '0');
                    break;
                default:
                    value = 0;
            }

            const colors = ['#F72585', '#7209B7', '#0A9396', '#FFC300', '#00FAFF'];
            return {
                name: `T${run.tier} W${run.wave}`,
                type: 'line',
                data: [value],
                smooth: true,
                lineStyle: { width: 3, color: colors[i % colors.length] },
                itemStyle: { color: colors[i % colors.length] },
                emphasis: { focus: 'series' }
            };
        });

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0,0,0,0.8)',
                textStyle: { color: '#fff' }
            },
            legend: {
                data: series.map(s => s.name),
                textStyle: { color: '#fff' },
                top: 0
            },
            grid: {
                left: '10%',
                right: '5%',
                bottom: '10%',
                top: '15%'
            },
            xAxis: {
                type: 'category',
                data: ['Run Comparison'],
                axisLabel: { color: '#fff' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#fff' },
                splitLine: { lineStyle: { color: '#324B55' } }
            },
            series: series
        };

        chart.setOption(option);
        console.log(`✅ Updated comparison chart (${metric})`);
    }

    /**
     * Parse number from string (handles K, M, B, T suffixes)
     */
    parseNumber(str) {
        if (!str) return 0;
        const match = str.match(/([\d,.]+)([KMBTQ])?/);
        if (!match) return 0;

        const num = parseFloat(match[1].replace(/,/g, ''));
        const suffix = match[2];

        const multipliers = {
            'K': 1e3,
            'M': 1e6,
            'B': 1e9,
            'T': 1e12,
            'Q': 1e15
        };

        return num * (multipliers[suffix] || 1);
    }

    /**
     * Parse time to hours
     */
    parseTime(str) {
        if (!str) return 1;
        const match = str.match(/(\d+)h/);
        return match ? parseInt(match[1]) : 1;
    }

    /**
     * Format number with K/M/B/T suffix
     */
    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(1) + 'Q';
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(0);
    }
}

// Export
window.RunComparison = RunComparison;
