// Unified Database - Supabase with Mock Fallback
// Database layer using Supabase when available, mock data as fallback

const { createClient } = require('@supabase/supabase-js');

class UnifiedDatabase {
    constructor() {
        this.supabase = null;
        this.sqlite = null;
        this.initialized = false;
        this.useSupabase = false;
    }

    async initialize() {
        try {
            // Try Supabase first
            try {
                await this.initializeSupabase();
                this.useSupabase = true;
                console.log('✅ Unified Database initialized successfully');
                console.log('   Using: Supabase');
            } catch (supabaseError) {
                console.log('⚠️ Supabase not available, using mock data:', supabaseError.message);
                await this.initializeMockData();
                this.useSupabase = false;
                console.log('✅ Unified Database initialized successfully');
                console.log('   Using: Mock data (local)');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize unified database:', error);
            throw error;
        }
    }

    async initializeSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey ||
            supabaseUrl === 'your-supabase-url' ||
            supabaseKey === 'your-supabase-service-key') {
            throw new Error('Supabase credentials not configured');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);

        // Test connection
        const { data, error } = await this.supabase
            .from('tower_runs')
            .select('count')
            .limit(1);

        if (error) {
            throw new Error(`Supabase connection failed: ${error.message}`);
        }

        console.log('✅ Supabase database connected');
    }

    async initializeMockData() {
        // Create a mock Supabase-like interface
        this.supabase = {
            from: (table) => {
                return new MockQueryBuilder(table);
            }
        };

        console.log('✅ Mock data interface initialized');
    }

    // Unified method to save tower runs
    async saveRun(runData) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const normalizedData = this.normalizeRunData(runData);
            const result = await this.saveToSupabase(normalizedData);
            return result;
        } catch (error) {
            console.error('❌ Failed to save run:', error);
            throw error;
        }
    }

    // Unified method to get runs
    async getRuns(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            limit = 100,
            offset = 0,
            discordUserId = null
        } = options;

        try {
            const runs = await this.getRunsFromSupabase({ limit, offset, discordUserId });
            return runs;
        } catch (error) {
            console.error('❌ Failed to get runs:', error);
            throw error;
        }
    }

    // Delete all runs (for testing/cleanup)
    async deleteAllRuns() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const { error } = await this.supabase
                .from('tower_runs')
                .delete()
                .gte('id', '00000000-0000-0000-0000-000000000000');

            if (error) throw error;

            console.log('✅ All runs deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete runs:', error);
            throw error;
        }
    }

    // Normalize run data format
    normalizeRunData(runData) {
        // Create a copy without isTournament (will be stored in raw_data only)
        const { isTournament, ...restData } = runData;

        return {
            timestamp: runData.timestamp || runData.submitted_at || runData.created_at || new Date().toISOString(),
            tier: runData.tier,
            wave: runData.wave,
            damage_dealt: runData.damage_dealt || runData.damage || runData.damageDealt,
            coins_earned: runData.coins_earned || runData.coins || runData.coinsEarned,
            run_duration: runData.run_duration || runData.duration,
            game_time: runData.game_time || runData.gameTime,
            real_time: runData.real_time || runData.realTime,
            killed_by: runData.killed_by || runData.killedBy,
            discord_user_id: runData.discord_user_id || runData.discordUserId,
            discord_server_id: runData.discord_server_id || runData.serverId,
            source: runData.source || (runData.discordUserId ? 'discord' : 'api'),
            // Include all additional fields for comprehensive stats (except isTournament)
            ...restData,
            // Store isTournament separately for raw_data
            _isTournament: isTournament
        };
    }

    async saveToSupabase(data) {
        // Convert camelCase field names to snake_case for Supabase
        const convertedData = this.convertFieldNamesForSupabase(data);

        const { error, data: result } = await this.supabase
            .from('tower_runs')
            .insert(convertedData)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    // Convert camelCase field names to snake_case for Supabase compatibility
    convertFieldNamesForSupabase(data) {
        const converted = {};

        // Field name mapping from Discord bot format to Supabase format
        const fieldMapping = {
            // Already correct names
            'tier': 'tier',
            'wave': 'wave',
            'damage_dealt': 'damage_dealt',
            'coins_earned': 'coins_earned',
            'run_duration': 'run_duration',
            'game_time': 'game_time',
            'real_time': 'real_time',
            'killed_by': 'killed_by',
            'discord_user_id': 'discord_user_id',
            'discord_server_id': 'discord_server_id',
            'source': 'submission_source',

            // CamelCase to snake_case conversions
            'damage': 'damage_dealt',
            'coins': 'coins_earned',
            'duration': 'run_duration',
            'timestamp': 'submitted_at',
            // 'isTournament': 'is_tournament', // TODO: Add this column to Supabase schema
            'damageDealt': 'damage_dealt',
            'coinsEarned': 'coins_earned',
            'gameTime': 'game_time',
            'realTime': 'real_time',
            'killedBy': 'killed_by',
            'discordUserId': 'discord_user_id',
            'serverId': 'discord_server_id',
            'discordServerId': 'discord_server_id',
            'cashEarned': 'cash_earned',
            'interestEarned': 'interest_earned',
            'gemBlocksTapped': 'gem_blocks_tapped',
            'cellsEarned': 'cells_earned',
            'rerollShardsEarned': 'reroll_shards_earned',
            'coinsFromDeathWave': 'coins_from_death_wave',
            'cashFromGoldenTower': 'cash_from_golden_tower',
            'coinsFromGoldenTower': 'coins_from_golden_tower',
            'coinsFromBlackhole': 'coins_from_blackhole',
            'coinsFromSpotlight': 'coins_from_spotlight',
            'coinsFromOrbs': 'coins_from_orbs',
            'coinsFromCoinUpgrade': 'coins_from_coin_upgrade',
            'coinsFromCoinBonuses': 'coins_from_coin_bonuses',
            'projectilesDamage': 'projectiles_damage',
            'orbDamage': 'orb_damage',
            'deathWaveDamage': 'death_wave_damage',
            'blackHoleDamage': 'black_hole_damage',
            'chainLightningDamage': 'chain_lightning_damage',
            'landMineDamage': 'land_mine_damage',
            'smartMissileDamage': 'smart_missile_damage',
            'thornDamage': 'thorn_damage',
            'rendArmorDamage': 'rend_armor_damage',
            'deathRayDamage': 'death_ray_damage',
            'innerLandMineDamage': 'inner_land_mine_damage',
            'swampDamage': 'swamp_damage',
            'damageTaken': 'damage_taken',
            'damageTakenWall': 'damage_taken_wall',
            'damageTakenWhileBerserked': 'damage_taken_while_berserked',
            'damageGainFromBerserk': 'damage_gain_from_berserk',
            'projectilesCount': 'projectiles_count',
            'lifesteal': 'lifesteal',
            'orbHits': 'orb_hits',
            'landMinesSpawned': 'land_mines_spawned',
            'deathDefy': 'death_defy',
            'totalEnemies': 'total_enemies',
            'wavesSkipped': 'waves_skipped',
            'basicEnemies': 'basic_enemies',
            'fastEnemies': 'fast_enemies',
            'tankEnemies': 'tank_enemies',
            'rangedEnemies': 'ranged_enemies',
            'bossEnemies': 'boss_enemies',
            'protectorEnemies': 'protector_enemies',
            'totalElites': 'total_elites',
            'vampires': 'vampires',
            'rays': 'rays',
            'scatters': 'scatters',
            'saboteurs': 'saboteurs',
            'commanders': 'commanders',
            'overcharges': 'overcharges',
            'destroyedByOrbs': 'destroyed_by_orbs',
            'destroyedByThorns': 'destroyed_by_thorns',
            'destroyedByDeathRay': 'destroyed_by_death_ray',
            'destroyedByLandMine': 'destroyed_by_land_mine',
            'recoveryPackages': 'recovery_packages',
            'freeAttackUpgrade': 'free_attack_upgrade',
            'freeDefenseUpgrade': 'free_defense_upgrade',
            'freeUtilityUpgrade': 'free_utility_upgrade',
            'hpFromDeathWave': 'hp_from_death_wave',
            'gems': 'gems',
            'medals': 'medals',
            'rerollShards': 'reroll_shards',
            'cannonShards': 'cannon_shards',
            'armorShards': 'armor_shards',
            'generatorShards': 'generator_shards',
            'coreShards': 'core_shards',
            'commonModules': 'common_modules',
            'rareModules': 'rare_modules',
            'flameBotDamage': 'flame_bot_damage',
            'thunderBotStuns': 'thunder_bot_stuns',
            'goldenBotCoinsEarned': 'golden_bot_coins_earned',
            'guardianCatches': 'guardian_catches',
            'coinsFetched': 'coins_fetched',
            'coinsStolen': 'coins_stolen',
            'damageMisc': 'damage_misc'
        };

        // Apply field name conversions
        for (const [key, value] of Object.entries(data)) {
            // Skip isTournament and _isTournament - they will be stored in raw_data only
            if (key === 'isTournament' || key === '_isTournament') continue;

            const mappedKey = fieldMapping[key] || key;
            converted[mappedKey] = value;
        }

        // Add timestamp and metadata
        converted.submitted_at = converted.submitted_at || new Date().toISOString();
        converted.submission_source = converted.submission_source || 'discord_bot';

        // Store original data as JSONB - make sure to include isTournament
        converted.raw_data = {
            ...data,
            // Ensure isTournament is in raw_data for filtering (use _isTournament if available)
            isTournament: data._isTournament !== undefined ? data._isTournament : (data.isTournament || false)
        };

        return converted;
    }

    async getRunsFromSupabase({ limit, offset, discordUserId }) {
        // CRITICAL SECURITY: Always require user ID for data isolation
        if (!discordUserId) {
            console.warn('⚠️ No user ID provided to getRunsFromSupabase - returning empty array for security');
            return [];
        }

        let query = this.supabase
            .from('tower_runs')
            .select('*')
            .eq('discord_user_id', discordUserId)  // CRITICAL: Always filter by user
            .order('submitted_at', { ascending: false });

        // Apply limit and offset
        if (limit) {
            query = query.limit(limit);
        }
        if (offset) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;
        if (error) throw error;

        console.log(`🔐 Fetched ${(data || []).length} runs for user ${discordUserId}`);

        return (data || []).map(run => ({
            ...run,
            source: 'discord',
            timestamp: run.submitted_at || run.created_at
        }));
    }

    // Health check method
    async healthCheck() {
        const health = {
            supabase: false,
            initialized: this.initialized
        };

        try {
            if (this.supabase) {
                const { error } = await this.supabase.from('tower_runs').select('count').limit(1);
                health.supabase = !error;
            }
        } catch (error) {
            console.warn('Supabase health check failed:', error.message);
        }

        return health;
    }
}

// Mock Query Builder to mimic Supabase API
class MockQueryBuilder {
    constructor(table) {
        this.table = table;
        this.selectColumns = '*';
        this.whereConditions = [];
        this.orderByClause = '';
        this.limitValue = null;
    }

    select(columns = '*') {
        this.selectColumns = columns;
        return this;
    }

    eq(column, value) {
        this.whereConditions.push({ column, value });
        return this;
    }

    order(column, options = {}) {
        this.orderByClause = { column, ascending: options.ascending };
        return this;
    }

    limit(count) {
        this.limitValue = count;
        return this;
    }

    async execute() {
        // Return mock data based on the table
        if (this.table === 'tower_runs') {
            return {
                data: [], // Empty array for now
                error: null
            };
        }
        return { data: [], error: null };
    }

    // Alias for execute to match Supabase API
    then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
    }

    catch(onRejected) {
        return this.execute().catch(onRejected);
    }
}

// Export singleton instance
module.exports = new UnifiedDatabase();