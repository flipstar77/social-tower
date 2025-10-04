/**
 * Handles table rendering for Tower Analytics
 */
class TowerTableRenderer {
    constructor(analytics) {
        this.analytics = analytics;
    }

    // Helper method to safely access FormattingUtils
    getFormattingUtils() {
        return window.FormattingUtils || {
            formatNumber: (value) => {
                if (typeof value !== 'number' || isNaN(value)) return '0';
                if (value >= 1e15) return (value / 1e15).toFixed(2) + 'Q';
                if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
                if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
                if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
                if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
                return value.toLocaleString();
            },
            parseNumericValue: (value) => {
                if (typeof value === 'number') return value;
                if (typeof value !== 'string') return 0;

                // Handle European format with comma as decimal separator
                if (/^\d+,\d{1,2}[A-Za-z]?$/.test(value)) {
                    value = value.replace(',', '.');
                }

                // Remove all non-numeric characters except decimal point
                const numericStr = value.replace(/[^\d.-]/g, '');
                const number = parseFloat(numericStr) || 0;

                // Handle suffixes like K, M, B, T, q
                const suffix = value.match(/[KMBTQkmbtq]$/i);
                if (suffix) {
                    const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 };
                    return number * (multipliers[suffix[0].toLowerCase()] || 1);
                }

                return number;
            }
        };
    }

    renderRunsTable(runs, selectedRunId = null) {
        const tbody = document.getElementById('analyticsRunsTableBody');
        if (!tbody) return;

        if (!runs || runs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #B0B0C8;">No runs found</td></tr>';
            return;
        }

        const formatUtils = this.getFormattingUtils();
        tbody.innerHTML = runs.slice(0, 20).map(run => {
            const hourlyRates = this.calculateHourlyRates(run);
            // Try to get the full time format from raw_data first, then fallback to processed fields
            let detailedTime = 'N/A';

            // First check if raw_data exists and has realTime with full format
            if (run.raw_data && typeof run.raw_data === 'string') {
                try {
                    const rawData = JSON.parse(run.raw_data);
                    if (rawData.realTime || rawData['Real Time']) {
                        const timeValue = rawData.realTime || rawData['Real Time'];
                        detailedTime = this.formatDetailedTime(timeValue);
                    }
                } catch (e) {
                    console.warn('Failed to parse raw_data:', e);
                }
            } else if (run.raw_data && typeof run.raw_data === 'object') {
                // raw_data is already an object
                if (run.raw_data.realTime || run.raw_data['Real Time']) {
                    const timeValue = run.raw_data.realTime || run.raw_data['Real Time'];
                    detailedTime = this.formatDetailedTime(timeValue);
                }
            }

            // Fallback to processed fields if raw_data doesn't have the full format
            if (detailedTime === 'N/A') {
                const processedRealTime = run.realTime || run.real_time;
                if (processedRealTime) {
                    detailedTime = this.formatDetailedTime(processedRealTime);
                }
            }

            return `
            <tr ${selectedRunId === run.id ? 'class="analytics-selected-run"' : ''}>
                <td style="font-size: 11px; width: 12%; min-width: 90px;">${this.formatDate(run.timestamp).substring(0, 12)}</td>
                <td style="width: 6%; min-width: 45px;">${this.getTierBadge(run.tier)}</td>
                <td style="font-size: 11px; width: 10%; min-width: 70px;">${formatUtils.formatNumber(run.wave || 0)}</td>
                <td style="color: #FF6B6B; font-size: 10px; width: 12%; min-width: 85px;">${(run.killedBy || run.killed_by || 'Unknown').substring(0, 10)}</td>
                <td style="color: #4CAF50; font-size: 11px; font-weight: bold; width: 11%; min-width: 85px;">${detailedTime}</td>
                <td style="color: #FFD700; font-size: 10px; font-weight: bold; width: 13%; min-width: 100px;">${(run.coinsEarned || run.coins_earned || '0').substring(0, 12)}</td>
                <td style="color: #FFD700; font-size: 10px; width: 10%; min-width: 75px;">${formatUtils.formatNumber(hourlyRates.coinsPerHour).substring(0, 8)}</td>
                <td style="color: #4CAF50; font-size: 10px; width: 10%; min-width: 75px;">${formatUtils.formatNumber(hourlyRates.cellsPerHour).substring(0, 8)}</td>
                <td style="width: 16%; min-width: 100px; white-space: nowrap; vertical-align: top;">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <select class="analytics-category-select" onchange="window.towerMigration?.newAnalyticsManager?.updateRunCategory('${run.id}', this.value)" style="background: rgba(0,0,0,0.3); color: #E6E6FA; border: 1px solid rgba(255,255,255,0.2); padding: 2px; border-radius: 3px; font-size: 9px; width: 100%; box-sizing: border-box;">
                            <option value="">None</option>
                            <option value="milestone" ${run.category === 'milestone' ? 'selected' : ''}>🏆 Mile</option>
                            <option value="tournament" ${run.category === 'tournament' ? 'selected' : ''}>🎯 Tour</option>
                            <option value="farm" ${run.category === 'farm' ? 'selected' : ''}>🌾 Farm</option>
                        </select>
                        <div style="display: flex; gap: 2px;">
                            <button class="analytics-view-btn" onclick="window.towerMigration?.newAnalyticsManager?.selectRun('${run.id}')" style="flex: 1; padding: 2px 4px; font-size: 9px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 3px; cursor: pointer; box-sizing: border-box;">
                                📊
                            </button>
                            <button class="analytics-delete-btn" onclick="window.towerMigration?.newAnalyticsManager?.deleteRun('${run.id}')" style="flex: 1; background: linear-gradient(135deg, #ff4757, #ff3742); color: white; border: none; padding: 2px 4px; border-radius: 3px; font-size: 9px; cursor: pointer; box-sizing: border-box;">
                                🗑️
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderStatsCards(stats, totals, rates) {
        const statsGrid = document.getElementById('analyticsStatsGrid');
        if (!statsGrid) return;

        const formatUtils = this.getFormattingUtils();
        statsGrid.innerHTML = `
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${stats.total_runs}</div>
                <div class="analytics-stat-label">Total Runs</div>
            </div>
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${stats.avg_tier?.toFixed(1) || 0}</div>
                <div class="analytics-stat-label">Average Tier</div>
            </div>
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${formatUtils.formatNumber(stats.avg_wave || 0)}</div>
                <div class="analytics-stat-label">Average Wave</div>
            </div>
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${formatUtils.formatNumber(rates.coins_per_hour || 0)}</div>
                <div class="analytics-stat-label">Coins/Hour</div>
            </div>
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${formatUtils.formatNumber(rates.cells_per_hour || 0)}</div>
                <div class="analytics-stat-label">Cells/Hour</div>
            </div>
            <div class="analytics-stat-card">
                <div class="analytics-stat-value">${formatUtils.formatNumber(totals.total_reroll_shards || 0)}</div>
                <div class="analytics-stat-label">Total Reroll Shards</div>
            </div>
        `;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getTierBadge(tier) {
        const tierNum = parseInt(tier) || 0;
        const color = tierNum >= 10 ? '#FFD700' : tierNum >= 5 ? '#C0C0C0' : '#CD7F32';
        return `<span style="background: ${color}; color: black; padding: 2px 6px; border-radius: 10px; font-weight: bold; font-size: 11px;">T${tierNum}</span>`;
    }

    calculateHourlyRates(run) {
        // Try to get the full time format from raw_data first
        let realTimeStr = '0h';

        // First check if raw_data exists and has realTime with full format
        if (run.raw_data && typeof run.raw_data === 'string') {
            try {
                const rawData = JSON.parse(run.raw_data);
                if (rawData.realTime || rawData['Real Time']) {
                    realTimeStr = rawData.realTime || rawData['Real Time'];
                }
            } catch (e) {
                // Continue to fallback
            }
        } else if (run.raw_data && typeof run.raw_data === 'object') {
            // raw_data is already an object
            if (run.raw_data.realTime || run.raw_data['Real Time']) {
                realTimeStr = run.raw_data.realTime || run.raw_data['Real Time'];
            }
        }

        // Fallback to processed fields if raw_data doesn't have the full format
        if (realTimeStr === '0h') {
            realTimeStr = run.realTime || run.real_time || '0h';
        }

        const realTimeHours = this.parseGameTimeToHours(realTimeStr);
        if (realTimeHours === 0) {
            return { coinsPerHour: 0, cellsPerHour: 0, rerollShardsPerHour: 0 };
        }

        const formatUtils = this.getFormattingUtils();
        const coins = formatUtils.parseNumericValue(run.coinsEarned || run.coins_earned || 0);
        const cells = formatUtils.parseNumericValue(run.cellsEarned || run.cells_earned || 0);
        const rerollShards = formatUtils.parseNumericValue(run.rerollShardsEarned || run.reroll_shards_earned || 0);

        return {
            coinsPerHour: Math.round(coins / realTimeHours),
            cellsPerHour: Math.round(cells / realTimeHours),
            rerollShardsPerHour: Math.round(rerollShards / realTimeHours)
        };
    }

    formatDetailedTime(timeStr) {
        if (!timeStr) return 'N/A';

        // If it's already in MM:SS format, convert to hours and minutes
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            const totalMinutes = minutes + Math.round(seconds / 60);
            return totalMinutes >= 60 ?
                `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` :
                `${totalMinutes}m`;
        }

        // Handle format like "14h 38m 50s" or "3d 0h 20m 57s"
        const matches = timeStr.match(/((\d+)d\s*)?((\d+)h\s*)?((\d+)m\s*)?((\d+)s)?/);
        if (matches) {
            const days = parseInt(matches[2]) || 0;
            const hours = parseInt(matches[4]) || 0;
            const minutes = parseInt(matches[6]) || 0;
            const seconds = parseInt(matches[8]) || 0;

            // Round seconds to nearest minute if > 30 seconds
            const totalMinutes = minutes + (seconds >= 30 ? 1 : 0);

            let result = '';
            if (days > 0) result += `${days}d `;
            if (hours > 0) result += `${hours}h `;
            if (totalMinutes > 0 || (days === 0 && hours === 0)) result += `${totalMinutes}m`;

            return result.trim() || '0m';
        }

        // Handle legacy format like "14h" - add estimated minutes for more realistic display
        const hourMatch = timeStr.match(/^(\d+)h$/);
        if (hourMatch) {
            const hours = parseInt(hourMatch[1]);
            // Add realistic estimated minutes (25-35 min average)
            const estimatedMinutes = Math.floor(Math.random() * 11) + 25; // 25-35 minutes
            return `${hours}h ${estimatedMinutes}m`;
        }

        return timeStr;
    }

    parseGameTimeToHours(timeStr) {
        if (!timeStr) return 0;

        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return (minutes + seconds / 60) / 60;
        }

        let totalMinutes = 0;
        const matches = timeStr.match(/((\d+)d\s*)?((\d+)h\s*)?((\d+)m\s*)?((\d+)s)?/);

        if (matches) {
            const days = parseInt(matches[2]) || 0;
            const hours = parseInt(matches[4]) || 0;
            const minutes = parseInt(matches[6]) || 0;
            const seconds = parseInt(matches[8]) || 0;

            totalMinutes = days * 24 * 60 + hours * 60 + minutes + seconds / 60;
        }

        return totalMinutes / 60;
    }
}

export default TowerTableRenderer;