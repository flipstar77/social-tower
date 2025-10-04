/**
 * Service for processing and parsing Tower statistics
 */
class StatsProcessor {
    /**
     * Parse Tower statistics from file content
     * @param {string} fileContent - Raw file content
     * @returns {Object|null} Parsed statistics or null if parsing failed
     */
    parseTowerStats(fileContent) {
        try {
            const lines = fileContent.split('\n');
            const stats = {};

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.includes('\t')) continue;

                const [key, value] = trimmed.split('\t').map(s => s.trim());

                // Convert the key to database column format
                const dbKey = this.convertKeyToDbColumn(key);
                if (dbKey) {
                    stats[dbKey] = this.parseStatValue(value);
                }
            }

            return stats;
        } catch (error) {
            console.error('Error parsing tower stats:', error);
            return null;
        }
    }

    /**
     * Convert display key to database column name
     * @param {string} key - Display key from stats file
     * @returns {string|null} Database column name or null if not mapped
     */
    convertKeyToDbColumn(key) {
        const keyMap = {
            'Game Time': 'game_time',
            'Real Time': 'real_time',
            'Tier': 'tier',
            'Wave': 'wave',
            'Killed By': 'killed_by',
            'Coins Earned': 'coins_earned',
            'Cash Earned': 'cash_earned',
            'Interest Earned': 'interest_earned',
            'Gem Blocks Tapped': 'gem_blocks_tapped',
            'Cells Earned': 'cells_earned',
            'Reroll Shards Earned': 'reroll_shards_earned',
            'Damage Taken': 'damage_taken',
            'Damage Taken Wall': 'damage_taken_wall',
            'Damage Taken While Berserked': 'damage_taken_berserked',
            'Damage Gain From Berserk': 'damage_gain_berserk',
            'Death Defy': 'death_defy',
            'Damage Dealt': 'damage_dealt',
            'Projectiles Damage': 'projectiles_damage',
            'Rend Armor Damage': 'rend_armor_damage',
            'Projectiles Count': 'projectiles_count',
            'Lifesteal': 'lifesteal',
            'Thorn Damage': 'thorn_damage',
            'Orb Damage': 'orb_damage',
            'Orb Hits': 'orb_hits',
            'Land Mine Damage': 'land_mine_damage',
            'Land Mines Spawned': 'land_mines_spawned',
            'Death Ray Damage': 'death_ray_damage',
            'Smart Missile Damage': 'smart_missile_damage',
            'Inner Land Mine Damage': 'inner_land_mine_damage',
            'Chain Lightning Damage': 'chain_lightning_damage',
            'Death Wave Damage': 'death_wave_damage',
            'Swamp Damage': 'swamp_damage',
            'Black Hole Damage': 'black_hole_damage',
            'Waves Skipped': 'waves_skipped',
            'Recovery Packages': 'recovery_packages',
            'Free Attack Upgrade': 'free_attack_upgrade',
            'Free Defense Upgrade': 'free_defense_upgrade',
            'Free Utility Upgrade': 'free_utility_upgrade',
            'HP From Death Wave': 'hp_from_death_wave',
            'Coins from Death Wave': 'coins_from_death_wave',
            'Cash from Golden Tower': 'cash_from_golden_tower',
            'Coins from Golden Tower': 'coins_from_golden_tower',
            'Coins from Blackhole': 'coins_from_blackhole',
            'Coins from Spotlight': 'coins_from_spotlight',
            'Coins from Orbs': 'coins_from_orbs',
            'Coins from Coin Upgrade': 'coins_from_coin_upgrade',
            'Coins from Coin Bonuses': 'coins_from_coin_bonuses',
            'Total Enemies': 'total_enemies',
            'Basic': 'basic_enemies',
            'Fast': 'fast_enemies',
            'Tank': 'tank_enemies',
            'Ranged': 'ranged_enemies',
            'Boss': 'boss_enemies',
            'Protector': 'protector_enemies',
            'Total Elites': 'total_elites',
            'Vampires': 'vampires',
            'Rays': 'rays',
            'Scatters': 'scatters',
            'Saboteurs': 'saboteurs',
            'Commanders': 'commanders',
            'Overcharges': 'overcharges',
            'Destroyed by Orbs': 'destroyed_by_orbs',
            'Destroyed by Thorns': 'destroyed_by_thorns',
            'Destroyed by Death ray': 'destroyed_by_death_ray',
            'Destroyed by Land Mine': 'destroyed_by_land_mine',
            'Flame bot damage': 'flame_bot_damage',
            'Thunder bot stuns': 'thunder_bot_stuns',
            'Golden bot coins earned': 'golden_bot_coins_earned',
            'Damage': 'damage_stolen',
            'Coins Stolen': 'coins_stolen',
            'Guardian catches': 'guardian_catches',
            'Coins Fetched': 'coins_fetched',
            'Gems': 'gems_earned',
            'Medals': 'medals_earned',
            'Reroll Shards': 'reroll_shards_earned_total',
            'Cannon Shards': 'cannon_shards',
            'Armor Shards': 'armor_shards',
            'Generator Shards': 'generator_shards',
            'Core Shards': 'core_shards',
            'Common Modules': 'common_modules',
            'Rare Modules': 'rare_modules'
        };

        return keyMap[key] || null;
    }

    /**
     * Parse a stat value handling different formats
     * @param {string|number} value - Value to parse
     * @returns {string|number} Parsed value
     */
    parseStatValue(value) {
        // Handle different number formats (K, M, B, T, q, Q, s, S, O, N, etc.)
        if (typeof value === 'string') {
            // Remove $ signs
            value = value.replace(/\$/g, '');

            // Handle European number format: comma as decimal separator
            // Replace comma with dot for decimal parsing
            value = value.replace(',', '.');

            // Handle time formats
            if (value.includes('h') || value.includes('m') || value.includes('s')) {
                return value; // Keep time as string
            }

            // Handle multiplier suffixes
            const multipliers = {
                'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18,
                's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30
            };

            const lastChar = value.slice(-1);
            if (multipliers[lastChar]) {
                const number = parseFloat(value.slice(0, -1));
                return isNaN(number) ? value : number * multipliers[lastChar];
            }

            // Try to parse as number
            const number = parseFloat(value);
            return isNaN(number) ? value : number;
        }

        return value;
    }

    /**
     * Parse time string to hours
     * @param {string} timeString - Time string like "2d 14h 15m 14s"
     * @returns {number} Time in hours
     */
    parseTimeToHours(timeString) {
        if (!timeString) return 0;

        let totalHours = 0;

        // Match patterns like "2d 14h 15m 14s"
        const dayMatch = timeString.match(/(\d+)d/);
        const hourMatch = timeString.match(/(\d+)h/);
        const minuteMatch = timeString.match(/(\d+)m/);

        if (dayMatch) totalHours += parseInt(dayMatch[1]) * 24;
        if (hourMatch) totalHours += parseInt(hourMatch[1]);
        if (minuteMatch) totalHours += parseInt(minuteMatch[1]) / 60;

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

        // Handle European number format: comma as decimal separator
        // Replace comma with dot for decimal parsing, remove $ signs
        const str = value.toString().replace(',', '.').replace(/\$/g, '');

        // Handle multiplier suffixes
        const multipliers = {
            'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18,
            's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30
        };

        const lastChar = str.slice(-1);
        if (multipliers[lastChar]) {
            const number = parseFloat(str.slice(0, -1));
            return isNaN(number) ? 0 : number * multipliers[lastChar];
        }

        const number = parseFloat(str);
        return isNaN(number) ? 0 : number;
    }
}

/**
 * Factory function to create stats processor
 */
function createStatsProcessor() {
    return new StatsProcessor();
}

module.exports = createStatsProcessor;