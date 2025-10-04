// Centralized field mappings for game statistics
// This ensures parser and display use the same field names

class FieldMappings {
    // Get all field mappings for parsing
    static getFieldMappings() {
        return {
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
            'Damage Taken While Berserked': 'damage_taken_while_berserked',
            'Damage Gain From Berserk': 'damage_gain_from_berserk',
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
            'Damage': 'damage',
            'Coins Stolen': 'coins_stolen',
            'Guardian catches': 'guardian_catches',
            'Coins Fetched': 'coins_fetched',
            'Gems': 'gems',
            'Medals': 'medals',
            'Reroll Shards': 'reroll_shards',
            'Cannon Shards': 'cannon_shards',
            'Armor Shards': 'armor_shards',
            'Generator Shards': 'generator_shards',
            'Core Shards': 'core_shards',
            'Common Modules': 'common_modules',
            'Rare Modules': 'rare_modules'
        };
    }

    // Get display configuration for stats (label + default value)
    static getDisplayFields() {
        const mappings = this.getFieldMappings();
        const displayFields = [];

        for (const [label, fieldKey] of Object.entries(mappings)) {
            let defaultValue = '0';

            // Set appropriate default values based on field type
            if (label.includes('Time')) {
                defaultValue = '0h 0m 0s';
            } else if (label.includes('Cash') || label.includes('$')) {
                defaultValue = '$0';
            } else if (label === 'Killed By') {
                defaultValue = 'N/A';
            } else if (label.includes('Berserk') && label.includes('Gain')) {
                defaultValue = 'x0';
            }

            displayFields.push({
                label: label,
                key: fieldKey,
                defaultValue: defaultValue
            });
        }

        return displayFields;
    }

    // Get grouped display fields with category headers
    static getGroupedDisplayFields() {
        return [
            {
                category: '⏱️ Run Overview',
                fields: ['game_time', 'real_time', 'tier', 'wave', 'killed_by', 'coins_per_hour', 'cells_per_hour', 'reroll_shards_per_hour']
            },
            {
                category: '💰 Economy',
                fields: ['coins_earned', 'cash_earned', 'interest_earned', 'gem_blocks_tapped', 'cells_earned', 'reroll_shards_earned']
            },
            {
                category: '💰 Coin Sources',
                fields: ['coins_from_death_wave', 'cash_from_golden_tower', 'coins_from_golden_tower', 'coins_from_blackhole', 'coins_from_spotlight', 'coins_from_orbs', 'coins_from_coin_upgrade', 'coins_from_coin_bonuses']
            },
            {
                category: '🛡️ Survivability',
                fields: ['damage_taken', 'damage_taken_wall', 'damage_taken_while_berserked', 'damage_gain_from_berserk', 'death_defy']
            },
            {
                category: '⚔️ Damage Output',
                fields: ['damage_dealt', 'projectiles_damage', 'rend_armor_damage', 'projectiles_count', 'lifesteal']
            },
            {
                category: '🔮 Tower Abilities',
                fields: ['thorn_damage', 'orb_damage', 'orb_hits', 'land_mine_damage', 'land_mines_spawned', 'death_ray_damage', 'smart_missile_damage', 'inner_land_mine_damage', 'chain_lightning_damage', 'death_wave_damage', 'swamp_damage', 'black_hole_damage']
            },
            {
                category: '👹 Enemies',
                fields: ['total_enemies', 'basic_enemies', 'fast_enemies', 'tank_enemies', 'ranged_enemies', 'boss_enemies', 'protector_enemies', 'total_elites', 'vampires', 'rays', 'scatters', 'saboteurs', 'commanders', 'overcharges', 'destroyed_by_orbs', 'destroyed_by_thorns', 'destroyed_by_death_ray', 'destroyed_by_land_mine']
            },
            {
                category: '📈 Progression',
                fields: ['waves_skipped', 'recovery_packages', 'free_attack_upgrade', 'free_defense_upgrade', 'free_utility_upgrade', 'hp_from_death_wave']
            },
            {
                category: '💎 Loot',
                fields: ['gems', 'medals', 'reroll_shards', 'cannon_shards', 'armor_shards', 'generator_shards', 'core_shards', 'common_modules', 'rare_modules']
            },
            {
                category: '🤖 Bots',
                fields: ['flame_bot_damage', 'thunder_bot_stuns', 'golden_bot_coins_earned', 'damage_misc', 'coins_stolen', 'guardian_catches', 'coins_fetched']
            }
        ];
    }

    // Get a specific field key by label
    static getFieldKey(label) {
        const mappings = this.getFieldMappings();
        return mappings[label] || null;
    }

    // Get all field keys (for validation)
    static getAllFieldKeys() {
        return Object.values(this.getFieldMappings());
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FieldMappings = FieldMappings;
}
