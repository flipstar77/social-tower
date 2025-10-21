/**
 * Progression Charts - Shows how metrics grow over time
 * Displays Coins/Hour, Cells/Hour, and Damage progression
 */

class ProgressionCharts {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.runs = [];
        this.charts = {};
    }

    /**
     * Initialize charts with run data
     */
    async init(runs) {
        if (!runs || runs.length === 0) {
            console.warn('⚠️ No runs provided to ProgressionCharts');
            return;
        }

        this.runs = runs;
        this.createChartsContainer();
        this.renderCoinsPerHourChart();
        this.renderCellsPerHourChart();
        this.renderDamageProgressionChart();
    }

    /**
     * Create the container structure
     */
    createChartsContainer() {
        if (!this.container) {
            console.error('❌ Container not found for ProgressionCharts');
            return;
        }

        this.container.innerHTML = `
            <div class="progression-charts">
                <div class="chart-section">
                    <h3>Coins/Hour Progression</h3>
                    <canvas id="coins-hour-chart" width="800" height="300"></canvas>
                </div>
                <div class="chart-section">
                    <h3>Cells/Hour Progression</h3>
                    <canvas id="cells-hour-chart" width="800" height="300"></canvas>
                </div>
                <div class="chart-section">
                    <h3>Damage Progression</h3>
                    <canvas id="damage-progression-chart" width="800" height="300"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * Calculate Coins/Hour from run data
     */
    calculateCoinsPerHour(run) {
        const coins = this.parseValue(run.coins_earned);
        const hours = this.parseTimeToHours(run.real_time || run.run_duration);

        if (hours > 0 && coins > 0) {
            return coins / hours;
        }
        return 0;
    }

    /**
     * Calculate Cells/Hour from run data
     */
    calculateCellsPerHour(run) {
        const cells = this.parseValue(run.cells_earned);
        const hours = this.parseTimeToHours(run.real_time || run.run_duration);

        if (hours > 0 && cells > 0) {
            return cells / hours;
        }
        return 0;
    }

    /**
     * Parse time string to hours
     */
    parseTimeToHours(timeString) {
        if (!timeString) return 0;

        const match = timeString.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
        if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            const seconds = parseInt(match[3]) || 0;
            return hours + minutes / 60 + seconds / 3600;
        }
        return 0;
    }

    /**
     * Parse numeric value (handles K, M, B, T suffixes)
     */
    parseValue(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        const str = String(value).replace(/,/g, '');
        const multipliers = { K: 1000, M: 1000000, B: 1000000000, T: 1000000000000, q: 1000000000000000 };

        for (const [suffix, multiplier] of Object.entries(multipliers)) {
            if (str.endsWith(suffix)) {
                return parseFloat(str.slice(0, -1)) * multiplier;
            }
        }

        return parseFloat(str) || 0;
    }

    /**
     * Format number with suffix
     */
    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'q';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(0);
    }

    /**
     * Render Coins/Hour progression chart
     */
    renderCoinsPerHourChart() {
        const sortedRuns = [...this.runs]
            .sort((a, b) => new Date(a.submitted_at || a.timestamp) - new Date(b.submitted_at || b.timestamp));

        const data = sortedRuns.map((run, index) => ({
            x: index + 1,
            y: this.calculateCoinsPerHour(run),
            date: new Date(run.submitted_at || run.timestamp).toLocaleDateString()
        }));

        this.renderLineChart('coins-hour-chart', data, 'Coins/Hour', '#10b981');
    }

    /**
     * Render Cells/Hour progression chart
     */
    renderCellsPerHourChart() {
        const sortedRuns = [...this.runs]
            .sort((a, b) => new Date(a.submitted_at || a.timestamp) - new Date(b.submitted_at || b.timestamp));

        const data = sortedRuns.map((run, index) => ({
            x: index + 1,
            y: this.calculateCellsPerHour(run),
            date: new Date(run.submitted_at || run.timestamp).toLocaleDateString()
        }));

        this.renderLineChart('cells-hour-chart', data, 'Cells/Hour', '#a78bfa');
    }

    /**
     * Render Damage progression chart
     */
    renderDamageProgressionChart() {
        const sortedRuns = [...this.runs]
            .sort((a, b) => new Date(a.submitted_at || a.timestamp) - new Date(b.submitted_at || b.timestamp));

        const data = sortedRuns.map((run, index) => ({
            x: index + 1,
            y: this.parseValue(run.damage_dealt),
            date: new Date(run.submitted_at || run.timestamp).toLocaleDateString(),
            tier: run.tier,
            wave: run.wave
        }));

        this.renderLineChart('damage-progression-chart', data, 'Total Damage', '#ef4444');
    }

    /**
     * Generic line chart renderer using Canvas
     */
    renderLineChart(canvasId, data, label, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        if (data.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }

        // Calculate scales
        const maxY = Math.max(...data.map(d => d.y));
        const minY = Math.min(...data.map(d => d.y));
        const yRange = maxY - minY || 1;

        const scaleX = (width - 2 * padding) / (data.length - 1 || 1);
        const scaleY = (height - 2 * padding) / yRange;

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * (height - 2 * padding);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxY - (i / 5) * yRange;
            ctx.fillStyle = '#999';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatNumber(value), padding - 10, y + 4);
        }

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + index * scaleX;
            const y = height - padding - (point.y - minY) * scaleY;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        data.forEach((point, index) => {
            const x = padding + index * scaleX;
            const y = height - padding - (point.y - minY) * scaleY;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, width / 2, 30);

        // X-axis label
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Run Number', width / 2, height - 10);

        console.log(`✅ Rendered ${label} chart with ${data.length} data points`);
    }
}

// Export for global use
window.ProgressionCharts = ProgressionCharts;
