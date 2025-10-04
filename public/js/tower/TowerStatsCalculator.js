/**
 * Pure calculation logic for Tower Analytics
 */
class TowerStatsCalculator {
    // Helper method to safely access FormattingUtils
    static getFormattingUtils() {
        return window.FormattingUtils || {
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
    static calculateStats(runs) {
        if (!runs || runs.length === 0) {
            return {
                total_runs: 0,
                avg_tier: 0,
                avg_wave: 0,
                max_tier: 0,
                max_wave: 0,
                max_damage: 0,
                total_enemies_killed: 0
            };
        }

        return {
            total_runs: runs.length,
            max_tier: Math.max(...runs.map(r => parseInt(r.tier) || 0)),
            max_wave: Math.max(...runs.map(r => parseInt(r.wave) || 0)),
            max_damage: Math.max(...runs.map(r => r.damage_dealt || 0)),
            avg_tier: runs.reduce((sum, run) => sum + (parseInt(run.tier) || 0), 0) / runs.length,
            avg_wave: runs.reduce((sum, run) => sum + (parseInt(run.wave) || 0), 0) / runs.length,
            total_enemies_killed: runs.reduce((sum, run) => sum + (parseInt(run.total_enemies) || 0), 0)
        };
    }

    static calculateTotals(runs) {
        if (!runs || runs.length === 0) {
            return { total_coins: 0, total_cells: 0, total_reroll_shards: 0 };
        }

        const formatUtils = this.getFormattingUtils();
        return {
            total_coins: runs.reduce((sum, run) =>
                sum + formatUtils.parseNumericValue(run.coinsEarned || run.coins_earned || 0), 0),
            total_cells: runs.reduce((sum, run) =>
                sum + formatUtils.parseNumericValue(run.cellsEarned || run.cells_earned || 0), 0),
            total_reroll_shards: runs.reduce((sum, run) =>
                sum + formatUtils.parseNumericValue(run.rerollShardsEarned || run.reroll_shards_earned || 0), 0),
        };
    }

    static calculateRates(runs) {
        if (!runs || runs.length === 0) {
            return { coins_per_hour: 0, cells_per_hour: 0 };
        }

        const totalRealTimeHours = runs.reduce((sum, run) => {
            return sum + this.parseGameTimeToHours(run.realTime || run.real_time || run['Real Time'] || '0h 0m');
        }, 0);

        const totals = this.calculateTotals(runs);

        if (totalRealTimeHours === 0) {
            return { coins_per_hour: 0, cells_per_hour: 0 };
        }

        return {
            coins_per_hour: Math.round(totals.total_coins / totalRealTimeHours),
            cells_per_hour: Math.round(totals.total_cells / totalRealTimeHours),
        };
    }

    static parseGameTimeToHours(timeStr) {
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

export default TowerStatsCalculator;