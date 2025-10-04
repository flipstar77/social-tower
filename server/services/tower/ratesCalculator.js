/**
 * Service for calculating rates and totals from Tower run data
 */
class RatesCalculator {
    /**
     * Calculate rates and totals from raw run data
     * @param {Array} runs - Array of run data
     * @returns {Object} Object containing totals and rates
     */
    calculateRates(runs) {
        const totals = this.calculateTotals(runs);
        const rates = this.calculateRatesFromTotals(totals);

        return { totals, rates };
    }

    /**
     * Calculate totals from run data
     * @param {Array} runs - Array of run data
     * @returns {Object} Totals object
     */
    calculateTotals(runs) {
        const totals = {
            total_coins: 0,
            total_cells: 0,
            total_reroll_shards: 0,
            total_cannon_shards: 0,
            total_armor_shards: 0,
            total_generator_shards: 0,
            total_core_shards: 0,
            total_common_modules: 0,
            total_rare_modules: 0,
            total_gems: 0,
            total_medals: 0,
            total_coins_fetched: 0,
            total_game_time: 0,
            total_real_time: 0,
            total_waves: 0,
            total_damage_taken: 0,
            total_damage_taken_wall: 0,
            total_damage_taken_berserked: 0,
            total_coins_from_golden_tower: 0,
            total_coins_from_blackhole: 0,
            total_coins_from_death_wave: 0,
            total_coins_from_spotlight: 0,
            total_coins_from_orbs: 0,
            total_coins_from_coin_upgrade: 0,
            total_coins_from_coin_bonuses: 0,
            total_cash_from_golden_tower: 0,
            total_golden_bot_coins_earned: 0
        };

        runs.forEach(run => {
            totals.total_coins += this.parseNumericValue(run.coins_earned);
            totals.total_cells += this.parseNumericValue(run.cells_earned);
            totals.total_reroll_shards += run.reroll_shards_earned_total || 0;
            totals.total_cannon_shards += run.cannon_shards || 0;
            totals.total_armor_shards += run.armor_shards || 0;
            totals.total_generator_shards += run.generator_shards || 0;
            totals.total_core_shards += run.core_shards || 0;
            totals.total_common_modules += run.common_modules || 0;
            totals.total_rare_modules += run.rare_modules || 0;
            totals.total_gems += run.gems_earned || 0;
            totals.total_medals += run.medals_earned || 0;
            totals.total_coins_fetched += this.parseNumericValue(run.coins_fetched);
            totals.total_waves += run.wave || 0;

            // Damage totals
            totals.total_damage_taken += this.parseNumericValue(run.damage_taken);
            totals.total_damage_taken_wall += this.parseNumericValue(run.damage_taken_wall);
            totals.total_damage_taken_berserked += this.parseNumericValue(run.damage_taken_berserked);

            // Coin source totals
            totals.total_coins_from_golden_tower += this.parseNumericValue(run.coins_from_golden_tower);
            totals.total_coins_from_blackhole += this.parseNumericValue(run.coins_from_blackhole);
            totals.total_coins_from_death_wave += this.parseNumericValue(run.coins_from_death_wave);
            totals.total_coins_from_spotlight += this.parseNumericValue(run.coins_from_spotlight);
            totals.total_coins_from_orbs += this.parseNumericValue(run.coins_from_orbs);
            totals.total_coins_from_coin_upgrade += this.parseNumericValue(run.coins_from_coin_upgrade);
            totals.total_coins_from_coin_bonuses += this.parseNumericValue(run.coins_from_coin_bonuses);
            totals.total_cash_from_golden_tower += this.parseNumericValue(run.cash_from_golden_tower);
            totals.total_golden_bot_coins_earned += this.parseNumericValue(run.golden_bot_coins_earned);

            // Parse time strings (e.g., "2d 14h 15m 14s")
            totals.total_game_time += this.parseTimeToHours(run.game_time);
            totals.total_real_time += this.parseTimeToHours(run.real_time);
        });

        return totals;
    }

    /**
     * Calculate rates from totals
     * @param {Object} totals - Totals object
     * @returns {Object} Rates object
     */
    calculateRatesFromTotals(totals) {
        // Calculate rates using real time for hourly rates (actual play time without pauses)
        const rates = {
            coins_per_hour: totals.total_real_time > 0 ? totals.total_coins / totals.total_real_time : 0,
            coins_per_wave: totals.total_waves > 0 ? totals.total_coins / totals.total_waves : 0,
            cells_per_hour: totals.total_real_time > 0 ? totals.total_cells / totals.total_real_time : 0,
            cells_per_wave: totals.total_waves > 0 ? totals.total_cells / totals.total_waves : 0,
            reroll_shards_per_hour: totals.total_real_time > 0 ? totals.total_reroll_shards / totals.total_real_time : 0,
            shards_per_wave: totals.total_waves > 0 ? totals.total_reroll_shards / totals.total_waves : 0,
            gems_per_hour: totals.total_real_time > 0 ? totals.total_gems / totals.total_real_time : 0,
            waves_per_hour: totals.total_real_time > 0 ? totals.total_waves / totals.total_real_time : 0
        };

        return rates;
    }

    /**
     * Parse time string to hours
     * @param {string} timeString - Time string like "2d 14h 15m 14s" or "14h 38m 50s Tier"
     * @returns {number} Time in hours
     */
    parseTimeToHours(timeString) {
        if (!timeString) return 0;

        // Remove any extra text at the end (like "Real Time", "Tier", etc.)
        const cleanedTime = timeString.replace(/\s+(Real Time|Tier|Game Time).*$/i, '').trim();

        let totalHours = 0;

        // Match patterns like "2d 14h 15m 14s"
        const dayMatch = cleanedTime.match(/(\d+)d/);
        const hourMatch = cleanedTime.match(/(\d+)h/);
        const minuteMatch = cleanedTime.match(/(\d+)m/);
        const secondMatch = cleanedTime.match(/(\d+)s/);

        if (dayMatch) totalHours += parseInt(dayMatch[1]) * 24;
        if (hourMatch) totalHours += parseInt(hourMatch[1]);
        if (minuteMatch) totalHours += parseInt(minuteMatch[1]) / 60;
        if (secondMatch) totalHours += parseInt(secondMatch[1]) / 3600;

        return totalHours;
    }

    /**
     * Parse numeric value with multiplier support
     * @param {string|number} value - Value to parse
     * @returns {number} Parsed numeric value
     */
    parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Remove $ signs and spaces
        let str = value.toString().replace(/\$/g, '').replace(/\s/g, '').trim();

        // Handle multiplier suffixes first
        const multipliers = {
            'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18,
            's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30, 'D': 1e33, 'U': 1e36,
            'Dd': 1e39, 'Td': 1e42, 'Qd': 1e45, 'Qnd': 1e48, 'Sd': 1e51, 'Spd': 1e54,
            'Od': 1e57, 'Nd': 1e60, 'V': 1e63, 'Uv': 1e66, 'Dv': 1e69, 'Tv': 1e72
        };

        // Check for multiplier at the end
        let multiplier = 1;
        for (const [suffix, mult] of Object.entries(multipliers)) {
            if (str.endsWith(suffix)) {
                multiplier = mult;
                str = str.slice(0, -suffix.length);
                break;
            }
        }

        // Handle European number format: comma as decimal separator
        // In format like "217,87" the comma is the decimal separator
        // Replace comma with dot for parsing
        str = str.replace(',', '.');

        const number = parseFloat(str);
        return isNaN(number) ? 0 : number * multiplier;
    }
}

/**
 * Factory function to create rates calculator
 */
function createRatesCalculator() {
    return new RatesCalculator();
}

module.exports = createRatesCalculator;