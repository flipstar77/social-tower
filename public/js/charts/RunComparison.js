/**
 * RunComparison - Interactive run comparison and visualization
 * Allows selecting multiple runs and comparing their stats
 */

class RunComparison {
    constructor() {
        this.selectedRuns = [];
        this.allRuns = [];
        this.charts = new Map();
        this.enemyChartType = 'pie'; // Default chart type
    }

    /**
     * Initialize the comparison system
     */
    async init() {
        console.log('📊 Initializing Run Comparison...');
        await this.loadRuns();
        this.createComparisonUI();
        this.initializeCharts();
        this.setupAutoRefresh();
    }

    /**
     * Setup auto-refresh when new runs are submitted
     */
    setupAutoRefresh() {
        // Listen for custom event when new runs are added
        window.addEventListener('runsUpdated', async () => {
            console.log('🔄 Detected new run submission, refreshing...');
            await this.refresh();
        });

        // Also check periodically for new runs (every 30 seconds)
        this.refreshInterval = setInterval(async () => {
            await this.checkForNewRuns();
        }, 30000);
    }

    /**
     * Check for new runs and refresh if found
     */
    async checkForNewRuns() {
        try {
            const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl('api/tower/runs?limit=1') : '/api/tower/runs?limit=1';
            const response = window.discordAuth?.authenticatedFetch
                ? await window.discordAuth.authenticatedFetch(apiUrl)
                : await fetch(apiUrl);
            const data = await response.json();

            if (data.runs && data.runs.length > 0) {
                const latestRun = data.runs[0];
                const latestId = latestRun.id;

                // Check if this is a new run
                if (this.allRuns.length > 0 && this.allRuns[0].id !== latestId) {
                    console.log('🆕 New run detected, refreshing...');
                    this.showRefreshNotification(latestRun);
                    await this.refresh();
                }
            }
        } catch (error) {
            console.error('❌ Failed to check for new runs:', error);
        }
    }

    /**
     * Show notification when new run is detected
     */
    showRefreshNotification(run) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #F72585, #7209B7);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(247, 37, 133, 0.4);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        notification.innerHTML = `
            🆕 New run detected: T${run.tier} W${run.wave}
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Refresh the run list and UI
     */
    async refresh() {
        const previousSelection = this.selectedRuns.map(r => r.id);

        // Dispose old charts before recreating UI
        this.charts.forEach(chart => {
            try {
                chart.dispose();
            } catch (e) {
                console.warn('Failed to dispose chart:', e);
            }
        });
        this.charts.clear();

        await this.loadRuns();
        this.createComparisonUI();
        this.initializeCharts(); // Reinitialize charts after UI recreation

        // Restore previous selection if runs still exist
        const restoredSelection = [];
        previousSelection.forEach(id => {
            const checkbox = document.getElementById(`run-${id}`);
            if (checkbox) {
                checkbox.checked = true;
                const run = this.allRuns.find(r => r.id === id);
                if (run) {
                    this.selectedRuns.push(run);
                    restoredSelection.push(run);
                }
            }
        });

        this.updateVisualizeButton();

        // Re-visualize if there were selections before
        if (restoredSelection.length > 0) {
            console.log(`🔄 Re-visualizing ${restoredSelection.length} restored selections`);
            this.visualizeSelectedRuns();
        }

        console.log('✅ Run comparison refreshed');
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
                // Use authenticated fetch if available
                const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl('api/tower/runs?limit=50') : '/api/tower/runs?limit=50';
                const response = window.discordAuth?.authenticatedFetch
                    ? await window.discordAuth.authenticatedFetch(apiUrl)
                    : await fetch(apiUrl);
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0;">Enemy Distribution</h3>
                        <div class="chart-type-toggle">
                            <button class="chart-type-btn active" data-chart-type="pie">🥧 Pie</button>
                            <button class="chart-type-btn" data-chart-type="bar">📊 Bar</button>
                        </div>
                    </div>
                    <div id="enemy-distribution-chart" style="height: 450px;"></div>
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

        // Chart type toggle for enemy distribution
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.enemyChartType = e.target.dataset.chartType;
                this.updateEnemyDistribution();
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
     * Update enemy distribution chart (pie or bar)
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
            vampires: 0,
            rays: 0,
            scatters: 0,
            saboteurs: 0,
            commanders: 0,
            overcharges: 0
        };

        this.selectedRuns.forEach(run => {
            enemyData.basic += parseInt(run.basic_enemies || 0);
            enemyData.fast += parseInt(run.fast_enemies || 0);
            enemyData.tank += parseInt(run.tank_enemies || 0);
            enemyData.ranged += parseInt(run.ranged_enemies || 0);
            enemyData.boss += parseInt(run.boss_enemies || 0);
            enemyData.protector += parseInt(run.protector_enemies || 0);
            enemyData.vampires += parseInt(run.vampires || 0);
            enemyData.rays += parseInt(run.rays || 0);
            enemyData.scatters += parseInt(run.scatters || 0);
            enemyData.saboteurs += parseInt(run.saboteurs || 0);
            enemyData.commanders += parseInt(run.commanders || 0);
            enemyData.overcharges += parseInt(run.overcharges || 0);
        });

        // Filter out categories with very low counts and group small ones
        const total = Object.values(enemyData).reduce((a, b) => a + b, 0);
        const chartData = [];

        // Main enemy types
        if (enemyData.basic > 0) chartData.push({ value: enemyData.basic, name: 'Basic', itemStyle: { color: '#4CAF50' } });
        if (enemyData.fast > 0) chartData.push({ value: enemyData.fast, name: 'Fast', itemStyle: { color: '#FF9800' } });
        if (enemyData.tank > 0) chartData.push({ value: enemyData.tank, name: 'Tank', itemStyle: { color: '#F44336' } });
        if (enemyData.ranged > 0) chartData.push({ value: enemyData.ranged, name: 'Ranged', itemStyle: { color: '#2196F3' } });

        // Special enemy types
        if (enemyData.boss > 0) chartData.push({ value: enemyData.boss, name: 'Boss', itemStyle: { color: '#9C27B0' } });
        if (enemyData.protector > 0) chartData.push({ value: enemyData.protector, name: 'Protector', itemStyle: { color: '#673AB7' } });

        // Elite enemy types
        if (enemyData.vampires > 0) chartData.push({ value: enemyData.vampires, name: 'Vampires', itemStyle: { color: '#E91E63' } });
        if (enemyData.rays > 0) chartData.push({ value: enemyData.rays, name: 'Rays', itemStyle: { color: '#00BCD4' } });
        if (enemyData.scatters > 0) chartData.push({ value: enemyData.scatters, name: 'Scatters', itemStyle: { color: '#8BC34A' } });
        if (enemyData.saboteurs > 0) chartData.push({ value: enemyData.saboteurs, name: 'Saboteurs', itemStyle: { color: '#FFC107' } });
        if (enemyData.commanders > 0) chartData.push({ value: enemyData.commanders, name: 'Commanders', itemStyle: { color: '#FF5722' } });
        if (enemyData.overcharges > 0) chartData.push({ value: enemyData.overcharges, name: 'Overcharges', itemStyle: { color: '#607D8B' } });

        let option;

        if (this.enemyChartType === 'bar') {
            // Bar Chart Configuration
            option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: (params) => {
                        const item = params[0];
                        const percent = ((item.value / total) * 100).toFixed(1);
                        return `${item.name}<br/>Count: ${item.value.toLocaleString()}<br/>Percentage: ${percent}%`;
                    },
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    textStyle: { color: '#fff' }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: chartData.map(d => d.name),
                    axisLabel: {
                        color: '#fff',
                        fontSize: 12,
                        rotate: 0
                    },
                    axisLine: {
                        lineStyle: { color: 'rgba(255,255,255,0.2)' }
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        color: '#fff',
                        fontSize: 12,
                        formatter: (value) => {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                            return value;
                        }
                    },
                    axisLine: {
                        lineStyle: { color: 'rgba(255,255,255,0.2)' }
                    },
                    splitLine: {
                        lineStyle: { color: 'rgba(255,255,255,0.1)' }
                    }
                },
                series: [{
                    type: 'bar',
                    data: chartData.map(d => ({
                        value: d.value,
                        itemStyle: d.itemStyle
                    })),
                    barWidth: '60%',
                    itemStyle: {
                        borderRadius: [8, 8, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        formatter: (params) => {
                            const percent = ((params.value / total) * 100).toFixed(1);
                            return `${percent}%`;
                        }
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
        } else {
            // Pie Chart Configuration (improved label positioning)
            option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    textStyle: { color: '#fff' }
                },
                legend: {
                    orient: 'horizontal',
                    left: 'center',
                    bottom: 0,
                    textStyle: { color: '#fff', fontSize: 9 },
                    itemWidth: 12,
                    itemHeight: 12,
                    itemGap: 8,
                    padding: [5, 0, 0, 0],
                    formatter: (name) => {
                        const item = chartData.find(d => d.name === name);
                        if (!item) return name;
                        const percent = ((item.value / total) * 100).toFixed(1);
                        return `${name} (${percent}%)`;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['40%', '75%'],
                    center: ['50%', '42%'],
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
                        fontWeight: 'bold',
                        distanceToLabelLine: 3
                    },
                    labelLine: {
                        show: true,
                        length: 10,
                        length2: 5,
                        smooth: true,
                        lineStyle: {
                            color: 'rgba(255, 255, 255, 0.3)',
                            width: 1
                        }
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
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
        }

        chart.setOption(option, true); // Use notMerge=true for clean replacement
        console.log(`✅ Updated enemy distribution chart (${this.enemyChartType})`);
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

            console.log(`💰 Hourly Coins Debug - T${tier}:`, {
                coinsStr: run.coins_earned,
                coinsParsed: coins,
                timeStr: run.real_time || run.run_duration,
                hoursParsed: hours,
                hourlyCoins: hourlyCoins
            });

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

        // Handle European decimal notation (comma as decimal separator)
        // If it looks like "28,66K" (1-3 digits, comma, 1-2 digits, suffix) convert comma to dot for decimal
        let cleanStr = str;
        if (/^\d{1,3},\d{1,2}[KMBTqQsSNOo]?$/i.test(str)) {
            cleanStr = str.replace(',', '.');
        } else {
            // Otherwise remove commas (thousands separators like 1,234,567)
            cleanStr = str.replace(/,/g, '');
        }

        const match = cleanStr.match(/([\d.]+)([KMBTqQsSNOo])?/);
        if (!match) return 0;

        const num = parseFloat(match[1]);
        const suffix = match[2];

        const multipliers = {
            'K': 1e3, 'k': 1e3,
            'M': 1e6, 'm': 1e6,
            'B': 1e9, 'b': 1e9,
            'T': 1e12, 't': 1e12,
            'q': 1e15, 'Q': 1e18,
            's': 1e21, 'S': 1e24,
            'O': 1e27, 'o': 1e27,
            'N': 1e30, 'n': 1e30
        };

        return num * (multipliers[suffix] || 1);
    }

    /**
     * Parse time to hours
     */
    parseTime(str) {
        if (!str) return 1;

        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        // Match days (e.g., "1d")
        const daysMatch = str.match(/(\d+)d/);
        if (daysMatch) hours += parseInt(daysMatch[1]) * 24;

        // Match hours (e.g., "7h")
        const hoursMatch = str.match(/(\d+)h/);
        if (hoursMatch) hours += parseInt(hoursMatch[1]);

        // Match minutes (e.g., "25m")
        const minutesMatch = str.match(/(\d+)m/);
        if (minutesMatch) minutes = parseInt(minutesMatch[1]);

        // Match seconds (e.g., "32s")
        const secondsMatch = str.match(/(\d+)s/);
        if (secondsMatch) seconds = parseInt(secondsMatch[1]);

        // Convert to hours
        const totalHours = hours + (minutes / 60) + (seconds / 3600);
        return Math.max(totalHours, 0.01); // Minimum 0.01 hours to avoid division by zero
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
