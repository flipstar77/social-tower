// Supabase Configuration for Tower Discord Bot
const { createClient } = require('@supabase/supabase-js');

class SupabaseManager {
    constructor() {
        // These will need to be set as environment variables
        console.log('🔧 Debug - Environment variables:');
        console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
        console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

        this.supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
        this.supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-supabase-service-key';

        console.log('🔧 Debug - Final values:');
        console.log('   URL:', this.supabaseUrl);
        console.log('   KEY:', this.supabaseKey.substring(0, 20) + '...');

        if (this.supabaseUrl === 'your-supabase-url') {
            console.warn('⚠️  Supabase URL not configured. Set SUPABASE_URL environment variable.');
            return;
        }

        if (this.supabaseKey === 'your-supabase-service-key') {
            console.warn('⚠️  Supabase service key not configured. Set SUPABASE_SERVICE_KEY environment variable.');
            return;
        }

        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('🗄️  Supabase client initialized with service role key');
    }

    // User Management
    async createUser(discordId, username, discriminator) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    discord_id: discordId,
                    discord_username: username,
                    discord_discriminator: discriminator,
                    created_at: new Date().toISOString(),
                    is_linked: false
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserByDiscordId(discordId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('discord_id', discordId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching user:', error);
            return { success: false, error: error.message };
        }
    }

    async linkUserToDashboard(discordId, linkCode) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update({
                    is_linked: true,
                    link_code: linkCode,
                    linked_at: new Date().toISOString()
                })
                .eq('discord_id', discordId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error linking user:', error);
            return { success: false, error: error.message };
        }
    }

    // Server Management
    async registerServer(serverId, serverName, ownerId) {
        try {
            const { data, error } = await this.supabase
                .from('servers')
                .insert([{
                    discord_server_id: serverId,
                    server_name: serverName,
                    owner_discord_id: ownerId,
                    created_at: new Date().toISOString(),
                    is_active: true,
                    settings: {
                        leaderboard_enabled: true,
                        competition_enabled: true,
                        auto_roles: false
                    }
                }])
                .select();

            if (error && error.code !== '23505') throw error; // Ignore duplicate key
            return { success: true, data: data?.[0] };
        } catch (error) {
            console.error('❌ Error registering server:', error);
            return { success: false, error: error.message };
        }
    }

    async getServerSettings(serverId) {
        try {
            const { data, error } = await this.supabase
                .from('servers')
                .select('*')
                .eq('discord_server_id', serverId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching server settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Ensure user exists in database (for web uploads)
    async ensureUserExists(discordUserId, username = null) {
        try {
            // Check if user exists
            const { data: existingUser, error: checkError } = await this.supabase
                .from('users')
                .select('discord_id')
                .eq('discord_id', discordUserId)
                .single();

            if (existingUser) {
                console.log('✅ User already exists in database');
                return { success: true };
            }

            // User doesn't exist, create them
            console.log('📝 Creating new user in database:', discordUserId);
            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    discord_id: discordUserId,
                    username: username || `User_${discordUserId}`,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                // If error is duplicate key (user was created by another request), that's OK
                if (error.code === '23505') {
                    console.log('✅ User was created by concurrent request');
                    return { success: true };
                }
                throw error;
            }

            console.log('✅ User created successfully');
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error ensuring user exists:', error);
            return { success: false, error: error.message };
        }
    }

    // Run Data Management
    async saveRun(runData) {
        try {
            console.log('🔄 Starting database save operation...');
            console.log('📝 Fields to save:', Object.keys(runData).length);
            console.log('💾 Required fields present:', {
                tier: !!runData.tier,
                wave: !!runData.wave,
                discordUserId: !!runData.discordUserId,
                serverId: !!runData.serverId
            });
            console.log('🔢 Large number fields:', {
                damage: runData.damage,
                chainLightningDamage: runData.chainLightningDamage,
                deathRayDamage: runData.deathRayDamage
            });

            // Ensure user exists in database first
            if (runData.discordUserId) {
                await this.ensureUserExists(runData.discordUserId, runData.username);
            }

            const { data, error } = await this.supabase
                .from('tower_runs')
                .insert([{
                    discord_user_id: runData.discordUserId,
                    discord_server_id: runData.serverId || null,
                    tier: runData.tier,
                    wave: runData.wave,
                    damage_dealt: runData.damage,
                    coins_earned: runData.coins,
                    run_duration: runData.duration || '0',

                    // Time data
                    game_time: runData.gameTime,
                    real_time: runData.realTime,

                    // Death info
                    killed_by: runData.killedBy,

                    // Currency data
                    cash_earned: runData.cashEarned,

                    // Damage breakdown
                    projectiles_damage: runData.projectilesDamage,
                    orb_damage: runData.orbDamage,
                    death_wave_damage: runData.deathWaveDamage,
                    black_hole_damage: runData.blackHoleDamage,
                    chain_lightning_damage: runData.chainLightningDamage,
                    land_mine_damage: runData.landMineDamage,
                    smart_missile_damage: runData.smartMissileDamage,
                    thorn_damage: runData.thornDamage,

                    // Combat stats
                    total_enemies: runData.totalEnemies,
                    waves_skipped: runData.wavesSkipped,

                    // Economic data
                    interest_earned: runData.interestEarned,
                    gem_blocks_tapped: runData.gemBlocksTapped,
                    cells_earned: runData.cellsEarned,
                    reroll_shards_earned: runData.rerollShardsEarned,
                    coins_from_death_wave: runData.coinsFromDeathWave,
                    cash_from_golden_tower: runData.cashFromGoldenTower,
                    coins_from_golden_tower: runData.coinsFromGoldenTower,
                    coins_from_blackhole: runData.coinsFromBlackhole,
                    coins_from_spotlight: runData.coinsFromSpotlight,
                    coins_from_orbs: runData.coinsFromOrbs,
                    coins_from_coin_upgrade: runData.coinsFromCoinUpgrade,
                    coins_from_coin_bonuses: runData.coinsFromCoinBonuses,

                    // Damage taken
                    damage_taken: runData.damageTaken,
                    damage_taken_wall: runData.damageTakenWall,
                    damage_taken_while_berserked: runData.damageTakenWhileBerserked,
                    damage_gain_from_berserk: runData.damageGainFromBerserk,

                    // Additional damage sources
                    rend_armor_damage: runData.rendArmorDamage,
                    death_ray_damage: runData.deathRayDamage,
                    inner_land_mine_damage: runData.innerLandMineDamage,
                    swamp_damage: runData.swampDamage,

                    // Combat details
                    projectiles_count: runData.projectilesCount,
                    lifesteal: runData.lifesteal,
                    orb_hits: runData.orbHits,
                    land_mines_spawned: runData.landMinesSpawned,
                    death_defy: runData.deathDefy,

                    // Enemy types
                    basic_enemies: runData.basicEnemies,
                    fast_enemies: runData.fastEnemies,
                    tank_enemies: runData.tankEnemies,
                    ranged_enemies: runData.rangedEnemies,
                    boss_enemies: runData.bossEnemies,
                    protector_enemies: runData.protectorEnemies,
                    total_elites: runData.totalElites,
                    vampires: runData.vampires,
                    rays: runData.rays,
                    scatters: runData.scatters,
                    saboteurs: runData.saboteurs,
                    commanders: runData.commanders,
                    overcharges: runData.overcharges,

                    // Kill methods
                    destroyed_by_orbs: runData.destroyedByOrbs,
                    destroyed_by_thorns: runData.destroyedByThorns,
                    destroyed_by_death_ray: runData.destroyedByDeathRay,
                    destroyed_by_land_mine: runData.destroyedByLandMine,

                    // Upgrades and bonuses
                    recovery_packages: runData.recoveryPackages,
                    free_attack_upgrade: runData.freeAttackUpgrade,
                    free_defense_upgrade: runData.freeDefenseUpgrade,
                    free_utility_upgrade: runData.freeUtilityUpgrade,
                    hp_from_death_wave: runData.hpFromDeathWave,

                    // Resources
                    gems: runData.gems,
                    medals: runData.medals,
                    reroll_shards: runData.rerollShards,
                    cannon_shards: runData.cannonShards,
                    armor_shards: runData.armorShards,
                    generator_shards: runData.generatorShards,
                    core_shards: runData.coreShards,
                    common_modules: runData.commonModules,
                    rare_modules: runData.rareModules,

                    // Bot stats
                    flame_bot_damage: runData.flameBotDamage,
                    thunder_bot_stuns: runData.thunderBotStuns,
                    golden_bot_coins_earned: runData.goldenBotCoinsEarned,
                    guardian_catches: runData.guardianCatches,
                    coins_fetched: runData.coinsFetched,
                    coins_stolen: runData.coinsStolen,
                    damage_misc: runData.damageMisc,

                    submitted_at: new Date().toISOString(),
                    submission_source: 'discord_bot',
                    raw_data: runData
                }])
                .select();

            console.log('📊 Database query executed, checking results...');
            if (error) {
                console.error('❌ Database error occurred:', error);
                console.error('❌ Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            } else {
                console.log('✅ Database insertion successful:', !!data);
            }
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error saving run:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            return { success: false, error: error.message };
        }
    }

    async getUserRuns(discordId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('tower_runs')
                .select('*')
                .eq('discord_user_id', discordId)
                .order('submitted_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching user runs:', error);
            return { success: false, error: error.message };
        }
    }

    async getServerLeaderboard(serverId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('tower_runs')
                .select(`
                    *,
                    users!discord_user_id (discord_username)
                `)
                .eq('discord_server_id', serverId)
                .order('tier', { ascending: false })
                .order('wave', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching server leaderboard:', error);
            return { success: false, error: error.message };
        }
    }

    async getGlobalLeaderboard(limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('tower_runs')
                .select(`
                    *,
                    users!discord_user_id (discord_username)
                `)
                .order('tier', { ascending: false })
                .order('wave', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching global leaderboard:', error);
            return { success: false, error: error.message };
        }
    }

    // Link Code Management
    async createLinkCode(discordId) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            const { data, error } = await this.supabase
                .from('link_codes')
                .insert([{
                    discord_id: discordId,
                    code: code,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
                    is_used: false
                }])
                .select();

            if (error) throw error;
            return { success: true, code, data: data[0] };
        } catch (error) {
            console.error('❌ Error creating link code:', error);
            return { success: false, error: error.message };
        }
    }

    async validateLinkCode(code) {
        try {
            const { data, error } = await this.supabase
                .from('link_codes')
                .select('*')
                .eq('code', code)
                .eq('is_used', false)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error validating link code:', error);
            return { success: false, error: error.message };
        }
    }

    async useLinkCode(code) {
        try {
            const { data, error } = await this.supabase
                .from('link_codes')
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('code', code)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error using link code:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = SupabaseManager;