/**
 * Stats Calculator Module
 * Handles all statistical calculations and aggregations
 */
class StatsCalculator {
    constructor() {
        this.eventListeners = new Map();
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // Main stats calculation
    calculateStats(runs) {
        if (!Array.isArray(runs) || runs.length === 0) {
            return this.getEmptyStats();
        }

        const basicStats = this.calculateBasicStats(runs);
        const aggregateStats = this.calculateAggregateStats(runs);
        const rateStats = this.calculateRateStats(runs);

        const allStats = {
            ...basicStats,
            ...aggregateStats,
            ...rateStats
        };

        this.emit('statsCalculated', { stats: allStats, runCount: runs.length });
        return allStats;
    }

    // Basic statistics
    calculateBasicStats(runs) {
        return {
            total_runs: runs.length,
            max_tier: Math.max(...runs.map(r => r.tier || 0)),
            max_wave: Math.max(...runs.map(r => r.wave || 0)),
            max_damage: Math.max(...runs.map(r => this.parseNumericValue(r.damage_dealt) || 0)),
            avg_tier: this.calculateAverage(runs, 'tier'),
            avg_wave: this.calculateAverage(runs, 'wave'),
            total_enemies_killed: runs.reduce((sum, run) => sum + (run.total_enemies || 0), 0)
        };
    }

    // Aggregate statistics
    calculateAggregateStats(runs) {
        return {
            total_coins: runs.reduce((sum, run) => sum + (this.parseNumericValue(run.coins_earned) || 0), 0),
            total_cells: runs.reduce((sum, run) => sum + (run.cells_earned || 0), 0),
            total_reroll_shards: runs.reduce((sum, run) => sum + (run.reroll_shards_earned || 0), 0),
            total_damage_taken: runs.reduce((sum, run) => sum + (run.damage_taken || 0), 0),
            total_damage_dealt: runs.reduce((sum, run) => sum + (this.parseNumericValue(run.damage_dealt) || 0), 0)
        };
    }

    // Rate statistics (per hour calculations)
    calculateRateStats(runs) {
        const totalRealTimeHours = this.calculateTotalRealTimeHours(runs);
        const aggregateStats = this.calculateAggregateStats(runs);

        if (totalRealTimeHours === 0) {
            return {
                coins_per_hour: 0,
                cells_per_hour: 0,
                shards_per_hour: 0,
                damage_per_hour: 0,
                runs_per_hour: 0
            };
        }

        return {
            coins_per_hour: Math.round(aggregateStats.total_coins / totalRealTimeHours),
            cells_per_hour: Math.round(aggregateStats.total_cells / totalRealTimeHours),
            shards_per_hour: Math.round(aggregateStats.total_reroll_shards / totalRealTimeHours),
            damage_per_hour: Math.round(aggregateStats.total_damage_dealt / totalRealTimeHours),
            runs_per_hour: Number((runs.length / totalRealTimeHours).toFixed(2)),
            total_play_time_hours: Number(totalRealTimeHours.toFixed(2))
        };
    }

    // Statistics by category
    calculateCategoryStats(runs) {
        const categories = ['milestone', 'tournament', 'farm'];
        const categoryStats = {};

        categories.forEach(category => {
            const categoryRuns = runs.filter(run => run.category === category);
            categoryStats[category] = {
                count: categoryRuns.length,
                ...this.calculateStats(categoryRuns)
            };
        });

        // Also calculate uncategorized runs
        const uncategorizedRuns = runs.filter(run => !run.category);
        categoryStats.uncategorized = {
            count: uncategorizedRuns.length,
            ...this.calculateStats(uncategorizedRuns)
        };

        return categoryStats;
    }

    // Progression analysis
    calculateProgressionStats(runs) {
        if (runs.length < 2) return null;

        // Sort runs by timestamp
        const sortedRuns = [...runs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const first10 = sortedRuns.slice(0, Math.min(10, sortedRuns.length));
        const last10 = sortedRuns.slice(-Math.min(10, sortedRuns.length));

        const firstAvgTier = this.calculateAverage(first10, 'tier');
        const lastAvgTier = this.calculateAverage(last10, 'tier');

        return {
            tier_improvement: Number((lastAvgTier - firstAvgTier).toFixed(2)),
            first_10_avg_tier: Number(firstAvgTier.toFixed(2)),
            last_10_avg_tier: Number(lastAvgTier.toFixed(2)),
            improvement_percentage: firstAvgTier > 0 ? Number(((lastAvgTier - firstAvgTier) / firstAvgTier * 100).toFixed(1)) : 0
        };
    }

    // Performance metrics
    calculatePerformanceMetrics(runs) {
        const validRuns = runs.filter(run => run.tier && run.wave);
        if (validRuns.length === 0) return {};

        // Efficiency: damage per wave
        const efficiencyScores = validRuns.map(run => {
            const damage = this.parseNumericValue(run.damage_dealt) || 0;
            const wave = run.wave || 1;
            return damage / wave;
        });

        // Consistency: tier standard deviation
        const tiers = validRuns.map(run => run.tier);
        const avgTier = this.calculateAverage(validRuns, 'tier');
        const tierVariance = tiers.reduce((sum, tier) => sum + Math.pow(tier - avgTier, 2), 0) / tiers.length;
        const tierStdDev = Math.sqrt(tierVariance);

        return {
            avg_efficiency: Math.round(efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length),
            consistency_score: Number((100 - (tierStdDev / avgTier) * 100).toFixed(1)), // Higher is more consistent
            best_efficiency: Math.round(Math.max(...efficiencyScores)),
            tier_std_deviation: Number(tierStdDev.toFixed(2))
        };
    }

    // Utility methods
    calculateAverage(runs, field) {
        if (!runs.length) return 0;
        const sum = runs.reduce((total, run) => total + (run[field] || 0), 0);
        return Number((sum / runs.length).toFixed(2));
    }

    calculateTotalRealTimeHours(runs) {
        return runs.reduce((sum, run) => {
            const realTime = run.real_time || run['Real Time'] || '';
            const hours = this.parseRealTimeToHours(realTime);
            return sum + hours;
        }, 0);
    }

    parseRealTimeToHours(realTimeStr) {
        if (!realTimeStr || typeof realTimeStr !== 'string') return 0;

        try {
            // Handle formats like "1h 23m 45s", "23m 45s", "45s"
            const timeRegex = /(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+(?:\.\d+)?)s)?/;
            const match = realTimeStr.match(timeRegex);

            if (!match) return 0;

            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            const seconds = parseFloat(match[3] || 0);

            return hours + (minutes / 60) + (seconds / 3600);
        } catch (error) {
            console.warn('Error parsing real time:', realTimeStr, error);
            return 0;
        }
    }

    parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Handle formats like "1.23M", "456.78K", "7.89B"
        const str = String(value).replace(/,/g, '');
        const multipliers = { K: 1000, M: 1000000, B: 1000000000, T: 1000000000000 };

        const match = str.match(/^([\d.]+)([KMBT]?)$/i);
        if (!match) return 0;

        const num = parseFloat(match[1]);
        const suffix = match[2].toUpperCase();

        return num * (multipliers[suffix] || 1);
    }

    getEmptyStats() {
        return {
            total_runs: 0,
            max_tier: 0,
            max_wave: 0,
            max_damage: 0,
            avg_tier: 0,
            avg_wave: 0,
            total_enemies_killed: 0,
            total_coins: 0,
            total_cells: 0,
            total_reroll_shards: 0,
            total_damage_taken: 0,
            total_damage_dealt: 0,
            coins_per_hour: 0,
            cells_per_hour: 0,
            shards_per_hour: 0,
            damage_per_hour: 0,
            runs_per_hour: 0,
            total_play_time_hours: 0
        };
    }
}

// Export for use in other modules
window.StatsCalculator = StatsCalculator;