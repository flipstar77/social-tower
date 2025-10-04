// Coin Income Streams Line Chart Module
class CoinIncomeChart {
    constructor() {
        this.chartInstance = null;
        this.container = null;
        this.toggleContainer = null;
        this.activeStreams = new Set([
            'coins_from_golden_tower',
            'coins_from_blackhole',
            'coins_from_death_wave',
            'coins_from_spotlight',
            'coins_from_coin_upgrade',
            'coins_from_coin_bonuses',
            'golden_bot_coins_earned',
            'coins_fetched'
        ]);

        // Color scheme for different income streams
        this.streamColors = {
            'coins_from_golden_tower': '#FFD700',
            'coins_from_blackhole': '#9932CC',
            'coins_from_death_wave': '#4169E1',
            'coins_from_spotlight': '#FFA500',
            'coins_from_coin_upgrade': '#26E2B3',
            'coins_from_coin_bonuses': '#FF6B6B',
            'golden_bot_coins_earned': '#32CD32',
            'coins_fetched': '#FF69B4'
        };

        this.streamLabels = {
            'coins_from_golden_tower': 'Golden Tower Coins',
            'coins_from_blackhole': 'Black Hole Coins',
            'coins_from_death_wave': 'Death Wave Coins',
            'coins_from_spotlight': 'Spotlight Coins',
            'coins_from_coin_upgrade': 'Coins from Upgrades',
            'coins_from_coin_bonuses': 'Coins from Bonuses',
            'golden_bot_coins_earned': 'Golden Bot Coins',
            'coins_fetched': 'Coins Fetched'
        };
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('Coin income chart container not found');
            return;
        }

        this.createChartHTML();
        this.createToggleControls();
        this.loadStoredPreferences();
    }

    createChartHTML() {
        this.container.innerHTML = `
            <div class="analytics-cards-container">
                <div class="analytics-cards-header">
                    <h2 class="analytics-chart-title">📊 Coin Income Streams Over Time</h2>
                    <div class="coin-chart-controls">
                        <button class="glass-button" onclick="coinIncomeChart.toggleAllStreams()">Toggle All</button>
                        <button class="glass-button" onclick="coinIncomeChart.resetZoom()">Reset Zoom</button>
                    </div>
                </div>

                <div class="coin-toggle-controls" id="coinToggleControls">
                    <!-- Toggle buttons will be generated here -->
                </div>

                <div class="coin-chart-wrapper">
                    <canvas id="coinIncomeLineChart" width="400" height="200"></canvas>
                </div>

                <div class="coin-chart-stats">
                    <div class="stats-summary" id="coinStatsSummary">
                        <!-- Summary stats will be displayed here -->
                    </div>
                </div>
            </div>
        `;

        this.toggleContainer = document.getElementById('coinToggleControls');
    }

    createToggleControls() {
        this.toggleContainer.innerHTML = '';

        Object.keys(this.streamLabels).forEach(streamKey => {
            const isActive = this.activeStreams.has(streamKey);
            const color = this.streamColors[streamKey];
            const label = this.streamLabels[streamKey];

            const toggleBtn = document.createElement('button');
            toggleBtn.className = `coin-stream-toggle ${isActive ? 'active' : ''}`;
            toggleBtn.style.setProperty('--stream-color', color);
            toggleBtn.setAttribute('data-stream', streamKey);
            toggleBtn.innerHTML = `
                <span class="stream-indicator" style="background-color: ${color}"></span>
                <span class="stream-label">${label}</span>
            `;

            toggleBtn.addEventListener('click', () => this.toggleStream(streamKey));
            this.toggleContainer.appendChild(toggleBtn);
        });
    }

    toggleStream(streamKey) {
        if (this.activeStreams.has(streamKey)) {
            this.activeStreams.delete(streamKey);
        } else {
            this.activeStreams.add(streamKey);
        }

        this.updateToggleButton(streamKey);
        this.updateChart();
        this.savePreferences();
    }

    updateToggleButton(streamKey) {
        const button = this.toggleContainer.querySelector(`[data-stream="${streamKey}"]`);
        if (button) {
            button.classList.toggle('active', this.activeStreams.has(streamKey));
        }
    }

    toggleAllStreams() {
        const allActive = this.activeStreams.size === Object.keys(this.streamLabels).length;

        if (allActive) {
            this.activeStreams.clear();
        } else {
            Object.keys(this.streamLabels).forEach(key => this.activeStreams.add(key));
        }

        // Update all toggle buttons
        Object.keys(this.streamLabels).forEach(key => this.updateToggleButton(key));
        this.updateChart();
        this.savePreferences();
    }

    async loadData() {
        try {
            console.log('🚀 Loading coin data...');

            // First try to get data from TowerAnalytics instance if available
            if (window.towerAnalytics && window.towerAnalytics.runs && window.towerAnalytics.runs.length > 0) {
                console.log('📊 Using data from TowerAnalytics:', window.towerAnalytics.runs.length, 'runs');
                return window.towerAnalytics.runs;
            }

            // Fallback to API call
            console.log('🚀 Fetching from API...');
            const response = await fetch('http://localhost:6078/api/tower/runs');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();

            // Handle different response formats
            if (Array.isArray(data)) {
                console.log('📊 Loaded coin data from API:', data.length, 'runs');
                return data;
            } else if (data && data.runs && Array.isArray(data.runs)) {
                console.log('📊 Loaded coin data from API (nested):', data.runs.length, 'runs');
                return data.runs;
            } else {
                console.warn('⚠️ Unexpected API response format:', data);
                return [];
            }
        } catch (error) {
            console.error('❌ Error loading coin data:', error);
            return [];
        }
    }

    processDataForChart(runs) {
        console.log('🔄 Processing data for chart. Runs:', runs?.length || 'undefined', 'Active streams:', this.activeStreams.size);

        if (!runs || !Array.isArray(runs) || runs.length === 0) {
            console.warn('⚠️ No valid runs data available');
            return { datasets: [] };
        }

        // Sort runs by timestamp
        const sortedRuns = runs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        console.log('📅 Date range:', sortedRuns[0]?.timestamp, 'to', sortedRuns[sortedRuns.length - 1]?.timestamp);

        const datasets = [];

        this.activeStreams.forEach(streamKey => {
            const data = sortedRuns.map(run => ({
                x: new Date(run.timestamp),
                y: this.parseNumericValue(run[streamKey] || '0')
            }));

            const maxValue = Math.max(...data.map(d => d.y));
            console.log(`💰 ${streamKey}: max value = ${this.formatNumber(maxValue)}`);

            // Special debugging for spotlight coins
            if (streamKey === 'coins_from_spotlight') {
                console.log('🔍 Spotlight debugging:');
                console.log('Raw values from runs:', sortedRuns.map(run => run[streamKey]).slice(0, 3));
                console.log('Parsed values:', data.map(d => d.y).slice(0, 3));
            }

            datasets.push({
                label: this.streamLabels[streamKey],
                data: data,
                borderColor: this.streamColors[streamKey],
                backgroundColor: this.streamColors[streamKey] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        });

        console.log('📊 Created datasets:', datasets.length);
        return { datasets };
    }

    parseNumericValue(value) {
        if (!value || value === '0' || value === '' || value === null || value === undefined) return 0;

        const str = value.toString().trim().replace(/,/g, '');

        // Handle ALL Tower game formats (including Q, S, etc.)
        const match = str.match(/^([\d.]+)([A-Z]?)$/i);

        if (!match) {
            console.warn('⚠️ Could not parse numeric value:', value);
            return 0;
        }

        const num = parseFloat(match[1]);
        if (isNaN(num)) {
            console.warn('⚠️ NaN result for value:', value);
            return 0;
        }

        const suffix = match[2].toUpperCase();

        // Complete Tower game notation system
        const multipliers = {
            '': 1,                     // No suffix (hundreds, thousands)
            'K': 1e3,                  // Thousand
            'M': 1e6,                  // Million
            'B': 1e9,                  // Billion
            'G': 1e9,                  // Billion (alternate)
            'T': 1e12,                 // Trillion
            'Q': 1e15,                 // Quadrillion
            'P': 1e18,                 // Quintillion (P used in some versions)
            'E': 1e21,                 // Sextillion (E used in some versions)
            'S': 1e21,                 // Sextillion (S used in Tower)
            'Z': 1e24,                 // Septillion
            'Y': 1e27,                 // Octillion
            'N': 1e30,                 // Nonillion
            'D': 1e33,                 // Decillion
            'U': 1e36,                 // Undecillion
            'DD': 1e39,                // Duodecillion
            'TD': 1e42,                // Tredecillion
            'QD': 1e45,                // Quattuordecillion
            'QUD': 1e48,               // Quindecillion
            'SD': 1e51,                // Sexdecillion
            'SPD': 1e54,               // Septendecillion
            'OD': 1e57,                // Octodecillion
            'ND': 1e60,                // Novemdecillion
            'V': 1e63                  // Vigintillion
        };

        const result = num * (multipliers[suffix] || 1);

        // Debug log for spotlight values
        if (str.includes('spotlight') || value.toString().includes('201')) {
            console.log('🔍 Parsing spotlight value:', value, '→', result);
        }

        return result;
    }

    async updateChart() {
        const runs = await this.loadData();
        const chartData = this.processDataForChart(runs);

        if (this.chartInstance) {
            this.chartInstance.data = chartData;
            this.chartInstance.update('none');
        } else {
            this.createChart(chartData);
        }

        this.updateSummaryStats(runs);
    }

    createChart(chartData) {
        const ctx = document.getElementById('coinIncomeLineChart');
        if (!ctx) {
            console.error('❌ Chart canvas not found');
            return;
        }

        console.log('📈 Creating chart with data:', chartData);

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 750
                    },
                    plugins: {
                        title: {
                            display: false
                        },
                        legend: {
                            display: false // We use custom toggles instead
                        },
                        tooltip: {
                            backgroundColor: 'rgba(35, 35, 35, 0.9)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    return `${context.dataset.label}: ${coinIncomeChart.formatNumber(value)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                displayFormats: {
                                    hour: 'MMM dd HH:mm'
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#8A8B8C'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#8A8B8C',
                                callback: function(value) {
                                    return coinIncomeChart.formatNumber(value);
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            console.log('✅ Chart created successfully');
        } catch (error) {
            console.error('❌ Error creating chart:', error);
        }
    }

    updateSummaryStats(runs) {
        if (runs.length === 0) return;

        const latestRun = runs[runs.length - 1];
        const totalCoins = this.activeStreams.size > 0 ?
            Array.from(this.activeStreams).reduce((sum, stream) =>
                sum + this.parseNumericValue(latestRun[stream] || '0'), 0) : 0;

        const summaryContainer = document.getElementById('coinStatsSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="summary-card">
                    <div class="summary-value">${this.formatNumber(totalCoins)}</div>
                    <div class="summary-label">Total from Active Streams</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${this.activeStreams.size}</div>
                    <div class="summary-label">Active Income Streams</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${runs.length}</div>
                    <div class="summary-label">Total Runs Analyzed</div>
                </div>
            `;
        }
    }

    formatNumber(num) {
        if (num === 0) return '0';
        if (num < 1000) return num.toFixed(0);

        // Complete Tower game notation system matching the parser
        const thresholds = [
            { value: 1e63, suffix: 'V' },   // Vigintillion
            { value: 1e60, suffix: 'ND' },  // Novemdecillion
            { value: 1e57, suffix: 'OD' },  // Octodecillion
            { value: 1e54, suffix: 'SPD' }, // Septendecillion
            { value: 1e51, suffix: 'SD' },  // Sexdecillion
            { value: 1e48, suffix: 'QUD' }, // Quindecillion
            { value: 1e45, suffix: 'QD' },  // Quattuordecillion
            { value: 1e42, suffix: 'TD' },  // Tredecillion
            { value: 1e39, suffix: 'DD' },  // Duodecillion
            { value: 1e36, suffix: 'U' },   // Undecillion
            { value: 1e33, suffix: 'D' },   // Decillion
            { value: 1e30, suffix: 'N' },   // Nonillion
            { value: 1e27, suffix: 'Y' },   // Octillion
            { value: 1e24, suffix: 'Z' },   // Septillion
            { value: 1e21, suffix: 'S' },   // Sextillion (Tower notation)
            { value: 1e18, suffix: 'E' },   // Quintillion (sometimes P)
            { value: 1e15, suffix: 'Q' },   // Quadrillion
            { value: 1e12, suffix: 'T' },   // Trillion
            { value: 1e9, suffix: 'B' },    // Billion
            { value: 1e6, suffix: 'M' },    // Million
            { value: 1e3, suffix: 'K' }     // Thousand
        ];

        for (const threshold of thresholds) {
            if (num >= threshold.value) {
                const scaled = num / threshold.value;
                // Format with appropriate decimal places
                if (scaled >= 100) {
                    return scaled.toFixed(0) + threshold.suffix;
                } else if (scaled >= 10) {
                    return scaled.toFixed(1).replace(/\.0$/, '') + threshold.suffix;
                } else {
                    return scaled.toFixed(2).replace(/\.?0+$/, '') + threshold.suffix;
                }
            }
        }

        return num.toFixed(0);
    }

    resetZoom() {
        if (this.chartInstance) {
            this.chartInstance.resetZoom();
        }
    }

    savePreferences() {
        localStorage.setItem('coinIncomeChart:activeStreams', JSON.stringify(Array.from(this.activeStreams)));
    }

    loadStoredPreferences() {
        try {
            const stored = localStorage.getItem('coinIncomeChart:activeStreams');
            if (stored) {
                this.activeStreams = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.warn('Failed to load coin chart preferences:', error);
        }
    }
}

// Global instance
window.coinIncomeChart = new CoinIncomeChart();