// Centralized field mappings for game statistics
// This ensures parser and display use the same field names

class FieldMappings {
    // Get all field mappings for parsing
    static getFieldMappings() {
        return {
            'Game Time': 'gameTime',
            'Real Time': 'realTime',
            'Tier': 'tier',
            'Wave': 'wave',
            'Killed By': 'killedBy',
            'Coins Earned': 'coins',
            'Cash Earned': 'cashEarned',
            'Interest Earned': 'interestEarned',
            'Gem Blocks Tapped': 'gemBlocksTapped',
            'Cells Earned': 'cellsEarned',
            'Reroll Shards Earned': 'rerollShardsEarned',
            'Damage Taken': 'damageTaken',
            'Damage Taken Wall': 'damageTakenWall',
            'Damage Taken While Berserked': 'damageTakenWhileBerserked',
            'Damage Gain From Berserk': 'damageGainFromBerserk',
            'Death Defy': 'deathDefy',
            'Damage Dealt': 'damage',
            'Projectiles Damage': 'projectilesDamage',
            'Rend Armor Damage': 'rendArmorDamage',
            'Projectiles Count': 'projectilesCount',
            'Lifesteal': 'lifesteal',
            'Thorn Damage': 'thornDamage',
            'Orb Damage': 'orbDamage',
            'Orb Hits': 'orbHits',
            'Land Mine Damage': 'landMineDamage',
            'Land Mines Spawned': 'landMinesSpawned',
            'Death Ray Damage': 'deathRayDamage',
            'Smart Missile Damage': 'smartMissileDamage',
            'Inner Land Mine Damage': 'innerLandMineDamage',
            'Chain Lightning Damage': 'chainLightningDamage',
            'Death Wave Damage': 'deathWaveDamage',
            'Swamp Damage': 'swampDamage',
            'Black Hole Damage': 'blackHoleDamage',
            'Waves Skipped': 'wavesSkipped',
            'Recovery Packages': 'recoveryPackages',
            'Free Attack Upgrade': 'freeAttackUpgrade',
            'Free Defense Upgrade': 'freeDefenseUpgrade',
            'Free Utility Upgrade': 'freeUtilityUpgrade',
            'HP From Death Wave': 'hpFromDeathWave',
            'Coins from Death Wave': 'coinsFromDeathWave',
            'Cash from Golden Tower': 'cashFromGoldenTower',
            'Coins from Golden Tower': 'coinsFromGoldenTower',
            'Coins from Blackhole': 'coinsFromBlackhole',
            'Coins from Spotlight': 'coinsFromSpotlight',
            'Coins from Orbs': 'coinsFromOrbs',
            'Coins from Coin Upgrade': 'coinsFromCoinUpgrade',
            'Coins from Coin Bonuses': 'coinsFromCoinBonuses',
            'Total Enemies': 'totalEnemies',
            'Basic': 'basicEnemies',
            'Fast': 'fastEnemies',
            'Tank': 'tankEnemies',
            'Ranged': 'rangedEnemies',
            'Boss': 'bossEnemies',
            'Protector': 'protectorEnemies',
            'Total Elites': 'totalElites',
            'Vampires': 'vampires',
            'Rays': 'rays',
            'Scatters': 'scatters',
            'Saboteurs': 'saboteurs',
            'Commanders': 'commanders',
            'Overcharges': 'overcharges',
            'Destroyed by Orbs': 'destroyedByOrbs',
            'Destroyed by Thorns': 'destroyedByThorns',
            'Destroyed by Death ray': 'destroyedByDeathRay',
            'Destroyed by Land Mine': 'destroyedByLandMine',
            'Flame bot damage': 'flameBotDamage',
            'Thunder bot stuns': 'thunderBotStuns',
            'Golden bot coins earned': 'goldenBotCoinsEarned',
            'Damage': 'damage',
            'Coins Stolen': 'coinsStolen',
            'Guardian catches': 'guardianCatches',
            'Coins Fetched': 'coinsFetched',
            'Gems': 'gems',
            'Medals': 'medals',
            'Reroll Shards': 'rerollShards',
            'Cannon Shards': 'cannonShards',
            'Armor Shards': 'armorShards',
            'Generator Shards': 'generatorShards',
            'Core Shards': 'coreShards',
            'Common Modules': 'commonModules',
            'Rare Modules': 'rareModules'
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
                fields: ['gameTime', 'realTime', 'tier', 'wave', 'killedBy', 'coinsPerHour', 'cellsPerHour', 'rerollShardsPerHour']
            },
            {
                category: '💰 Economy',
                fields: ['coins', 'cashEarned', 'interestEarned', 'gemBlocksTapped', 'cellsEarned', 'rerollShardsEarned']
            },
            {
                category: '💰 Coin Sources',
                fields: ['coinsFromDeathWave', 'cashFromGoldenTower', 'coinsFromGoldenTower', 'coinsFromBlackhole', 'coinsFromSpotlight', 'coinsFromOrbs', 'coinsFromCoinUpgrade', 'coinsFromCoinBonuses']
            },
            {
                category: '🛡️ Survivability',
                fields: ['damageTaken', 'damageTakenWall', 'damageTakenWhileBerserked', 'damageGainFromBerserk', 'deathDefy']
            },
            {
                category: '⚔️ Damage Output',
                fields: ['damage', 'projectilesDamage', 'rendArmorDamage', 'projectilesCount', 'lifesteal']
            },
            {
                category: '🔮 Tower Abilities',
                fields: ['thornDamage', 'orbDamage', 'orbHits', 'landMineDamage', 'landMinesSpawned', 'deathRayDamage', 'smartMissileDamage', 'innerLandMineDamage', 'chainLightningDamage', 'deathWaveDamage', 'swampDamage', 'blackHoleDamage']
            },
            {
                category: '👹 Enemies',
                fields: ['totalEnemies', 'basicEnemies', 'fastEnemies', 'tankEnemies', 'rangedEnemies', 'bossEnemies', 'protectorEnemies', 'totalElites', 'vampires', 'rays', 'scatters', 'saboteurs', 'commanders', 'overcharges', 'destroyedByOrbs', 'destroyedByThorns', 'destroyedByDeathRay', 'destroyedByLandMine']
            },
            {
                category: '📈 Progression',
                fields: ['wavesSkipped', 'recoveryPackages', 'freeAttackUpgrade', 'freeDefenseUpgrade', 'freeUtilityUpgrade', 'hpFromDeathWave']
            },
            {
                category: '💎 Loot',
                fields: ['gems', 'medals', 'rerollShards', 'cannonShards', 'armorShards', 'generatorShards', 'coreShards', 'commonModules', 'rareModules']
            },
            {
                category: '🤖 Bots',
                fields: ['flameBotDamage', 'thunderBotStuns', 'goldenBotCoinsEarned', 'damageMisc', 'coinsStolen', 'guardianCatches', 'coinsFetched']
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
