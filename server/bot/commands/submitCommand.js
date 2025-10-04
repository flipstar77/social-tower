const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const unifiedDb = require('../../database/unifiedDatabase');

/**
 * Submit Command Module
 * Handles submission of Tower run data by parsing full stats from the game
 */
class SubmitCommand {
    constructor() {
        this.command = new SlashCommandBuilder()
            .setName('submit')
            .setDescription('Submit your Tower run data by pasting full stats from the game')
            .addStringOption(option =>
                option.setName('stats')
                    .setDescription('Paste your full stats from the game exactly as they appear')
                    .setRequired(true));
    }

    /**
     * Execute the submit command
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance containing supabase and other utilities
     */
    async execute(interaction, bot) {
        try {
            // Check if interaction is still valid before deferring
            if (!interaction.isRepliable()) {
                console.log('❌ Interaction is not repliable');
                return;
            }

            await interaction.deferReply({ ephemeral: false });
            console.log('✅ Interaction deferred successfully');
            const statsPaste = interaction.options.getString('stats');
            console.log('📥 Received submit command with stats length:', statsPaste ? statsPaste.length : 0);

            // Validate that stats paste is provided
            if (!statsPaste) {
                return await this.safeEditReply(interaction, {
                    content: '❌ Please paste your full stats from the game.',
                    ephemeral: true
                });
            }

            // Parse the stats paste
            const parsedStats = this.parseStatsPaste(statsPaste);

            // Extract required fields
            const tier = parsedStats.tier;
            const wave = parsedStats.wave;
            const damageStr = parsedStats.damageDealt || 'Unknown';
            const coinsStr = parsedStats.coinsEarned || 'Unknown';

            // Parse damage and coins
            const damage = damageStr ? this.parseNumber(damageStr) : 0;
            const coins = coinsStr ? this.parseNumber(coinsStr) : 0;

            // Extract duration from parsed stats or use default
            const duration = parsedStats.runDuration ? parsedStats.runDuration : '0';

            // Validate required data from parsed stats
            if (!tier || !wave) {
                console.log('❌ Missing tier or wave:', { tier, wave, parsedStats });
                return await this.safeEditReply(interaction, {
                    content: '❌ Could not find Tier and Wave in your stats paste. Please make sure you copied the complete stats from the game.',
                    ephemeral: true
                });
            }

            // Since tier and wave are now strings, just check they exist
            console.log('✅ Found tier and wave:', { tier, wave });

            if (!bot.supabase) {
                // Test mode - show parsed data without saving
                return await this.handleTestMode(interaction, parsedStats, tier, wave, damageStr, coinsStr, statsPaste);
            }

            // Note: User and server existence checks removed - not critical for saving runs
            // The database will handle discord_user_id and discord_server_id fields directly

            // Save run data - include all parsed stats
            const runData = this.buildRunData(interaction, tier, wave, damageStr, coinsStr, duration, parsedStats);

            console.log('💾 About to save run to database...');
            console.log('📊 Run data contains', Object.keys(runData).length, 'fields');
            console.log('🔍 Sample fields:', Object.keys(runData).slice(0, 10));

            // Use unified database for better integration and sync
            const result = await unifiedDb.saveRun(runData);
            const success = !!result; // Unified DB returns result object, not {success: boolean}

            console.log('✅ Database save completed, result:', success ? 'SUCCESS' : 'FAILED');

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎉 Run Submitted Successfully!')
                    .addFields(
                        { name: '🏰 Tier', value: tier.toString(), inline: true },
                        { name: '🌊 Wave', value: wave.toString(), inline: true },
                        { name: '💥 Damage', value: damageStr, inline: true },
                        { name: '🪙 Coins', value: coinsStr, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Tower Bot' });

                if (duration && duration !== '0') embed.addFields({ name: '⏱️ Duration', value: duration, inline: true });

                await this.safeEditReply(interaction, { embeds: [embed] });
            } else {
                console.error('❌ Supabase saveRun failed:', result);
                await this.safeEditReply(interaction, {
                    content: '❌ Failed to submit run. Please try again.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('💥 Error in handleSubmitCommand:', error);
            console.error('Error stack:', error.stack);

            // Try to respond to the user
            await this.safeEditReply(interaction, {
                content: '❌ An error occurred while processing your submission. Please try again.',
                ephemeral: true
            });
        }
    }

    /**
     * Handle test mode when Supabase is not configured
     */
    async handleTestMode(interaction, parsedStats, tier, wave, damageStr, coinsStr, statsPaste) {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🧪 Test Mode - Data Received!')
            .setDescription('⚠️ **Supabase not configured** - Data not saved, but bot is working!')
            .addFields(
                { name: '🏰 Tier', value: tier ? tier.toString() : 'Not provided', inline: true },
                { name: '🌊 Wave', value: wave ? wave.toString() : 'Not provided', inline: true },
                { name: '💥 Damage', value: damageStr || 'Not provided', inline: true },
                { name: '🪙 Coins', value: coinsStr || 'Not provided', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Tower Bot - Test Mode' });

        // Add additional stats if parsed from full stats paste
        if (statsPaste && Object.keys(parsedStats).length > 0) {
            if (parsedStats.gameTime) embed.addFields({ name: '🕐 Game Time', value: parsedStats.gameTime, inline: true });
            if (parsedStats.realTime) embed.addFields({ name: '⏱️ Real Time', value: parsedStats.realTime, inline: true });
            if (parsedStats.killedBy) embed.addFields({ name: '💀 Killed By', value: parsedStats.killedBy, inline: true });
            if (parsedStats.totalEnemies) embed.addFields({ name: '👹 Total Enemies', value: parsedStats.totalEnemies.toLocaleString(), inline: true });
            if (parsedStats.wavesSkipped) embed.addFields({ name: '⏭️ Waves Skipped', value: parsedStats.wavesSkipped.toLocaleString(), inline: true });
            if (parsedStats.orbDamage) embed.addFields({ name: '🔮 Orb Damage', value: parsedStats.orbDamage, inline: true });
            if (parsedStats.deathWaveDamage) embed.addFields({ name: '🌊 Death Wave Damage', value: parsedStats.deathWaveDamage, inline: true });
            if (parsedStats.blackHoleDamage) embed.addFields({ name: '⚫ Black Hole Damage', value: parsedStats.blackHoleDamage, inline: true });
            if (parsedStats.chainLightningDamage) embed.addFields({ name: '⚡ Chain Lightning Damage', value: parsedStats.chainLightningDamage, inline: true });
            if (parsedStats.landMineDamage) embed.addFields({ name: '💣 Land Mine Damage', value: parsedStats.landMineDamage, inline: true });
            if (parsedStats.smartMissileDamage) embed.addFields({ name: '🚀 Smart Missile Damage', value: parsedStats.smartMissileDamage, inline: true });
            if (parsedStats.thornDamage) embed.addFields({ name: '🌹 Thorn Damage', value: parsedStats.thornDamage, inline: true });

            embed.setDescription('⚠️ **Supabase not configured** - Data not saved, but bot parsed your full stats successfully!');
        }

        return await this.safeEditReply(interaction, { embeds: [embed] });
    }

    /**
     * Build the complete run data object with all parsed statistics
     */
    buildRunData(interaction, tier, wave, damageStr, coinsStr, duration, parsedStats) {
        return {
            discordUserId: interaction.user.id,
            serverId: interaction.guild?.id || null,
            tier,
            wave,
            damage: damageStr, // Store original formatted string
            coins: coinsStr,   // Store original formatted string
            duration, // Store as string
            isTournament: parsedStats.isTournament || false, // Stored in raw_data JSONB field

            // Time data
            gameTime: parsedStats.gameTime,
            realTime: parsedStats.realTime,

            // Death info
            killedBy: parsedStats.killedBy,

            // Currency data
            cashEarned: parsedStats.cashEarned,

            // Damage breakdown
            projectilesDamage: parsedStats.projectilesDamage,
            orbDamage: parsedStats.orbDamage,
            deathWaveDamage: parsedStats.deathWaveDamage,
            blackHoleDamage: parsedStats.blackHoleDamage,
            chainLightningDamage: parsedStats.chainLightningDamage,
            landMineDamage: parsedStats.landMineDamage,
            smartMissileDamage: parsedStats.smartMissileDamage,
            thornDamage: parsedStats.thornDamage,

            // Combat stats
            totalEnemies: parsedStats.totalEnemies,
            wavesSkipped: parsedStats.wavesSkipped,

            // Economic data
            interestEarned: parsedStats.interestEarned,
            gemBlocksTapped: parsedStats.gemBlocksTapped,
            cellsEarned: parsedStats.cellsEarned,
            rerollShardsEarned: parsedStats.rerollShardsEarned,
            coinsFromDeathWave: parsedStats.coinsFromDeathWave,
            cashFromGoldenTower: parsedStats.cashFromGoldenTower,
            coinsFromGoldenTower: parsedStats.coinsFromGoldenTower,
            coinsFromBlackhole: parsedStats.coinsFromBlackhole,
            coinsFromSpotlight: parsedStats.coinsFromSpotlight,
            coinsFromOrbs: parsedStats.coinsFromOrbs,
            coinsFromCoinUpgrade: parsedStats.coinsFromCoinUpgrade,
            coinsFromCoinBonuses: parsedStats.coinsFromCoinBonuses,

            // Damage taken
            damageTaken: parsedStats.damageTaken,
            damageTakenWall: parsedStats.damageTakenWall,
            damageTakenWhileBerserked: parsedStats.damageTakenWhileBerserked,
            damageGainFromBerserk: parsedStats.damageGainFromBerserk,

            // Additional damage sources
            rendArmorDamage: parsedStats.rendArmorDamage,
            deathRayDamage: parsedStats.deathRayDamage,
            innerLandMineDamage: parsedStats.innerLandMineDamage,
            swampDamage: parsedStats.swampDamage,

            // Combat details
            projectilesCount: parsedStats.projectilesCount,
            lifesteal: parsedStats.lifesteal,
            orbHits: parsedStats.orbHits,
            landMinesSpawned: parsedStats.landMinesSpawned,
            deathDefy: parsedStats.deathDefy,

            // Enemy types
            basicEnemies: parsedStats.basicEnemies,
            fastEnemies: parsedStats.fastEnemies,
            tankEnemies: parsedStats.tankEnemies,
            rangedEnemies: parsedStats.rangedEnemies,
            bossEnemies: parsedStats.bossEnemies,
            protectorEnemies: parsedStats.protectorEnemies,
            totalElites: parsedStats.totalElites,
            vampires: parsedStats.vampires,
            rays: parsedStats.rays,
            scatters: parsedStats.scatters,
            saboteurs: parsedStats.saboteurs,
            commanders: parsedStats.commanders,
            overcharges: parsedStats.overcharges,

            // Kill methods
            destroyedByOrbs: parsedStats.destroyedByOrbs,
            destroyedByThorns: parsedStats.destroyedByThorns,
            destroyedByDeathRay: parsedStats.destroyedByDeathRay,
            destroyedByLandMine: parsedStats.destroyedByLandMine,

            // Upgrades and bonuses
            recoveryPackages: parsedStats.recoveryPackages,
            freeAttackUpgrade: parsedStats.freeAttackUpgrade,
            freeDefenseUpgrade: parsedStats.freeDefenseUpgrade,
            freeUtilityUpgrade: parsedStats.freeUtilityUpgrade,
            hpFromDeathWave: parsedStats.hpFromDeathWave,

            // Resources
            gems: parsedStats.gems,
            medals: parsedStats.medals,
            rerollShards: parsedStats.rerollShards,
            cannonShards: parsedStats.cannonShards,
            armorShards: parsedStats.armorShards,
            generatorShards: parsedStats.generatorShards,
            coreShards: parsedStats.coreShards,
            commonModules: parsedStats.commonModules,
            rareModules: parsedStats.rareModules,

            // Bot stats
            flameBotDamage: parsedStats.flameBotDamage,
            thunderBotStuns: parsedStats.thunderBotStuns,
            goldenBotCoinsEarned: parsedStats.goldenBotCoinsEarned,
            guardianCatches: parsedStats.guardianCatches,
            coinsFetched: parsedStats.coinsFetched,
            coinsStolen: parsedStats.coinsStolen,
            damageMisc: parsedStats.damageMisc
        };
    }

    /**
     * Parse stats paste from the game into structured data
     */
    parseStatsPaste(statsPaste) {
        console.log('🔍 Parsing stats paste...');
        console.log('Stats paste length:', statsPaste.length);
        console.log('Raw stats paste:', JSON.stringify(statsPaste.substring(0, 200) + '...'));

        const stats = {};

        // Check if it's the tab/space-separated single-line format (Discord copy-paste format)
        // This happens when Discord collapses the formatting into a single line
        let lines = statsPaste.split('\n');
        if (lines.length === 1 || (lines.length <= 3 && lines.join('').length > 500)) {
            console.log('🔄 Detected single-line format (tab/space-separated)');
            return this.parseTabSeparatedStats(statsPaste);
        }

        // Original multi-line format parsing
        console.log('Total lines:', lines.length);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            console.log('🔍 Processing line:', JSON.stringify(trimmedLine));

            // Try multiple splitting approaches for robustness
            let parts = [];

            // Method 1: Split on 2+ spaces or tab
            parts = trimmedLine.split(/\s{2,}|\t/);
            if (parts.length === 2) {
                console.log('✅ Method 1 (2+ spaces/tab) worked:', parts);
            } else {
                // Method 2: Split on single space and rejoin (for cases where Discord collapsed multiple spaces)
                const allParts = trimmedLine.split(/\s+/);
                if (allParts.length >= 2) {
                    // Find the split point by looking for common patterns
                    for (let i = 1; i < allParts.length; i++) {
                        const key = allParts.slice(0, i).join(' ');
                        const value = allParts.slice(i).join(' ');

                        // Check if this looks like a valid key-value pair
                        if (this.isValidStatsKey(key)) {
                            parts = [key, value];
                            console.log('✅ Method 2 (smart split) worked:', parts);
                            break;
                        }
                    }
                }
            }

            if (parts.length !== 2) {
                console.log('⚠️ Skipping line (could not parse):', trimmedLine);
                continue;
            }

            const key = parts[0].trim();
            const value = parts[1].trim();
            console.log(`📊 Found: "${key}" = "${value}"`);

            if (key.toLowerCase() === 'tier' || key.toLowerCase() === 'wave') {
                console.log(`🎯 Important field found: ${key} = ${value}`);
            }

            this.addStatToObject(stats, key, value);
        }

        return stats;
    }

    /**
     * Parse tab-separated single-line stats format
     */
    parseTabSeparatedStats(statsPaste) {
        console.log('🔄 Parsing tab-separated format using regex matching...');
        console.log('📝 Input data preview (first 200 chars):', statsPaste.substring(0, 200));
        console.log('📏 Full data length:', statsPaste.length);
        const stats = {};

        // Define patterns for all the stats we want to extract
        // Support both tab and multiple spaces as separators
        const patterns = {
            // Core stats - support "14+" format for tournaments
            'tier': /Tier[\t\s]+(\d+\+?)/,
            'wave': /Wave[\t\s]+([\d,]+)/,
            'damage dealt': /Damage Dealt[\t\s]+([^\s\t]+)/,
            'coins earned': /Coins Earned[\t\s]+([^\s\t]+)/,
            'game time': /Game Time[\t\s]+((?:\d+d\s+)?\d+h\s+\d+m\s+\d+s)/,
            'real time': /Real Time[\t\s]+((?:\d+d\s+)?\d+h\s+\d+m\s+\d+s)/,
            'killed by': /Killed By[\t\s]+([^\s\t]+)/,

            // Economic data
            'cash earned': /Cash Earned[\t\s]+([^\s\t]+)/,
            'interest earned': /Interest Earned[\t\s]+([^\s\t]+)/,
            'gem blocks tapped': /Gem Blocks Tapped[\t\s]+([\d,]+)/,
            'cells earned': /Cells Earned[\t\s]+([^\s\t]+)/,
            'reroll shards earned': /Reroll Shards Earned[\t\s]+([^\s\t]+)/,
            'coins from death wave': /Coins from Death Wave[\t\s]+([^\s\t]+)/,
            'cash from golden tower': /Cash from Golden Tower[\t\s]+([^\s\t]+)/,
            'coins from golden tower': /Coins from Golden Tower[\t\s]+([^\s\t]+)/,
            'coins from blackhole': /Coins from Blackhole[\t\s]+([^\s\t]+)/,
            'coins from spotlight': /Coins from Spotlight[\t\s]+([^\s\t]+)/,
            'coins from orbs': /Coins from Orbs[\t\s]+([^\s\t]+)/,
            'coins from coin upgrade': /Coins from Coin Upgrade[\t\s]+([^\s\t]+)/,
            'coins from coin bonuses': /Coins from Coin Bonuses[\t\s]+([^\s\t]+)/,

            // Damage taken
            'damage taken': /Damage Taken[\t\s]+([^\s\t]+)/,
            'damage taken wall': /Damage Taken Wall[\t\s]+([^\s\t]+)/,
            'damage taken while berserked': /Damage Taken While Berserked[\t\s]+([^\s\t]+)/,
            'damage gain from berserk': /Damage Gain From Berserk[\t\s]+([^\s\t]+)/,

            // Damage sources
            'projectiles damage': /Projectiles Damage[\t\s]+([^\s\t]+)/,
            'rend armor damage': /Rend Armor Damage[\t\s]+([^\s\t]+)/,
            'orb damage': /Orb Damage[\t\s]+([^\s\t]+)/,
            'death wave damage': /Death Wave Damage[\t\s]+([^\s\t]+)/,
            'black hole damage': /Black Hole Damage[\t\s]+([^\s\t]+)/,
            'chain lightning damage': /Chain Lightning Damage[\t\s]+([^\s\t]+)/,
            'land mine damage': /Land Mine Damage[\t\s]+([^\s\t]+)/,
            'smart missile damage': /Smart Missile Damage[\t\s]+([^\s\t]+)/,
            'thorn damage': /Thorn Damage[\t\s]+([^\s\t]+)/,
            'death ray damage': /Death Ray Damage[\t\s]+([^\s\t]+)/,
            'inner land mine damage': /Inner Land Mine Damage[\t\s]+([^\s\t]+)/,
            'swamp damage': /Swamp Damage[\t\s]+([^\s\t]+)/,

            // Combat details
            'projectiles count': /Projectiles Count[\t\s]+([^\s\t]+)/,
            'lifesteal': /Lifesteal[\t\s]+([^\s\t]+)/,
            'orb hits': /Orb Hits[\t\s]+([^\s\t]+)/,
            'land mines spawned': /Land Mines Spawned[\t\s]+([\d,]+)/,
            'death defy': /Death Defy[\t\s]+([\d,]+)/,

            // Enemy types
            'total enemies': /Total Enemies[\t\s]+([\d,]+)/,
            'basic': /Basic[\t\s]+([\d,]+)/,
            'fast': /Fast[\t\s]+([\d,]+)/,
            'tank': /Tank[\t\s]+([\d,]+)/,
            'ranged': /Ranged[\t\s]+([\d,]+)/,
            'boss': /Boss[\t\s]+([\d,]+)/,
            'protector': /Protector[\t\s]+([\d,]+)/,
            'total elites': /Total Elites[\t\s]+([\d,]+)/,
            'vampires': /Vampires[\t\s]+([\d,]+)/,
            'rays': /Rays[\t\s]+([\d,]+)/,
            'scatters': /Scatters[\t\s]+([\d,]+)/,
            'saboteurs': /Saboteurs[\t\s]+([\d,]+)/,
            'commanders': /Commanders[\t\s]+([\d,]+)/,
            'overcharges': /Overcharges[\t\s]+([\d,]+)/,

            // Kill methods
            'destroyed by orbs': /Destroyed by Orbs[\t\s]+([\d,]+)/,
            'destroyed by thorns': /Destroyed by Thorns[\t\s]+([\d,]+)/,
            'destroyed by death ray': /Destroyed by Death ray[\t\s]+([\d,]+)/,
            'destroyed by land mine': /Destroyed by Land Mine[\t\s]+([\d,]+)/,

            // Upgrades and bonuses
            'waves skipped': /Waves Skipped[\t\s]+([\d,]+)/,
            'recovery packages': /Recovery Packages[\t\s]+([\d,]+)/,
            'free attack upgrade': /Free Attack Upgrade[\t\s]+([\d,]+)/,
            'free defense upgrade': /Free Defense Upgrade[\t\s]+([\d,]+)/,
            'free utility upgrade': /Free Utility Upgrade[\t\s]+([\d,]+)/,
            'hp from death wave': /HP From Death Wave[\t\s]+([^\s\t]+)/,

            // Resources
            'gems': /Gems[\t\s]+([\d,]+)/,
            'medals': /Medals[\t\s]+([\d,]+)/,
            'reroll shards': /Reroll Shards[\t\s]+([\d,]+)/,
            'cannon shards': /Cannon Shards[\t\s]+([\d,]+)/,
            'armor shards': /Armor Shards[\t\s]+([\d,]+)/,
            'generator shards': /Generator Shards[\t\s]+([\d,]+)/,
            'core shards': /Core Shards[\t\s]+([\d,]+)/,
            'common modules': /Common Modules[\t\s]+([\d,]+)/,
            'rare modules': /Rare Modules[\t\s]+([\d,]+)/,

            // Bot stats
            'flame bot damage': /Flame bot damage[\t\s]+([^\s\t]+)/,
            'thunder bot stuns': /Thunder bot stuns[\t\s]+([\d,]+)/,
            'golden bot coins earned': /Golden bot coins earned[\t\s]+([^\s\t]+)/,
            'guardian catches': /Guardian catches[\t\s]+([\d,]+)/,
            'coins fetched': /Coins Fetched[\t\s]+([^\s\t]+)/,
            'coins stolen': /Coins Stolen[\t\s]+([^\s\t]+)/,
            'damage misc': /Damage[\t\s]+([^\s\t]+)/
        };

        // Extract each stat using regex
        console.log('🔍 Testing patterns against data...');
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = statsPaste.match(pattern);
            if (match) {
                const value = match[1];
                console.log(`✅ Found ${key}: ${value}`);

                if (key.toLowerCase() === 'tier' || key.toLowerCase() === 'wave') {
                    console.log(`🎯 Important field found: ${key} = ${value}`);
                }

                this.addStatToObject(stats, key, value);
            } else {
                console.log(`❌ No match for ${key} with pattern: ${pattern}`);
            }
        }

        console.log('Final parsed stats:', Object.keys(stats));
        return stats;
    }

    /**
     * Add a stat to the stats object with proper field mapping
     */
    addStatToObject(stats, key, value) {
        switch (key.toLowerCase()) {
            case 'tier':
                // Check if tier has "+" (tournament indicator)
                stats.isTournament = value.includes('+');
                // Store tier without the "+" for database
                stats.tier = value.replace('+', '');
                break;
            case 'wave':
                stats.wave = value; // Store as string to handle large numbers
                break;
            case 'damage dealt':
                stats.damageDealt = value;
                break;
            case 'coins earned':
                stats.coinsEarned = value;
                break;
            case 'game time':
                stats.gameTime = value;
                break;
            case 'real time':
                stats.realTime = value;
                break;
            case 'killed by':
                stats.killedBy = value;
                break;
            case 'cash earned':
                stats.cashEarned = value;
                break;
            case 'projectiles damage':
                stats.projectilesDamage = value;
                break;
            case 'orb damage':
                stats.orbDamage = value;
                break;
            case 'death wave damage':
                stats.deathWaveDamage = value;
                break;
            case 'black hole damage':
                stats.blackHoleDamage = value;
                break;
            case 'chain lightning damage':
                stats.chainLightningDamage = value;
                break;
            case 'land mine damage':
                stats.landMineDamage = value;
                break;
            case 'smart missile damage':
                stats.smartMissileDamage = value;
                break;
            case 'thorn damage':
                stats.thornDamage = value;
                break;
            case 'total enemies':
                stats.totalEnemies = value;
                break;
            case 'waves skipped':
                stats.wavesSkipped = value;
                break;
            case 'run duration':
                stats.runDuration = value;
                break;

            // Economic data
            case 'interest earned':
                stats.interestEarned = value;
                break;
            case 'gem blocks tapped':
                stats.gemBlocksTapped = value;
                break;
            case 'cells earned':
                stats.cellsEarned = value;
                break;
            case 'reroll shards earned':
                stats.rerollShardsEarned = value;
                break;
            case 'coins from death wave':
                stats.coinsFromDeathWave = value;
                break;
            case 'cash from golden tower':
                stats.cashFromGoldenTower = value;
                break;
            case 'coins from golden tower':
                stats.coinsFromGoldenTower = value;
                break;
            case 'coins from blackhole':
                stats.coinsFromBlackhole = value;
                break;
            case 'coins from spotlight':
                stats.coinsFromSpotlight = value;
                break;
            case 'coins from orbs':
                stats.coinsFromOrbs = value;
                break;
            case 'coins from coin upgrade':
                stats.coinsFromCoinUpgrade = value;
                break;
            case 'coins from coin bonuses':
                stats.coinsFromCoinBonuses = value;
                break;

            // Damage taken
            case 'damage taken':
                stats.damageTaken = value;
                break;
            case 'damage taken wall':
                stats.damageTakenWall = value;
                break;
            case 'damage taken while berserked':
                stats.damageTakenWhileBerserked = value;
                break;
            case 'damage gain from berserk':
                stats.damageGainFromBerserk = value;
                break;

            // Additional damage sources
            case 'rend armor damage':
                stats.rendArmorDamage = value;
                break;
            case 'death ray damage':
                stats.deathRayDamage = value;
                break;
            case 'inner land mine damage':
                stats.innerLandMineDamage = value;
                break;
            case 'swamp damage':
                stats.swampDamage = value;
                break;

            // Combat details
            case 'projectiles count':
                stats.projectilesCount = value;
                break;
            case 'lifesteal':
                stats.lifesteal = value;
                break;
            case 'orb hits':
                stats.orbHits = value;
                break;
            case 'land mines spawned':
                stats.landMinesSpawned = value;
                break;
            case 'death defy':
                stats.deathDefy = value;
                break;

            // Enemy types
            case 'basic':
                stats.basicEnemies = value;
                break;
            case 'fast':
                stats.fastEnemies = value;
                break;
            case 'tank':
                stats.tankEnemies = value;
                break;
            case 'ranged':
                stats.rangedEnemies = value;
                break;
            case 'boss':
                stats.bossEnemies = value;
                break;
            case 'protector':
                stats.protectorEnemies = value;
                break;
            case 'total elites':
                stats.totalElites = value;
                break;
            case 'vampires':
                stats.vampires = value;
                break;
            case 'rays':
                stats.rays = value;
                break;
            case 'scatters':
                stats.scatters = value;
                break;
            case 'saboteurs':
                stats.saboteurs = value;
                break;
            case 'commanders':
                stats.commanders = value;
                break;
            case 'overcharges':
                stats.overcharges = value;
                break;

            // Kill methods
            case 'destroyed by orbs':
                stats.destroyedByOrbs = value;
                break;
            case 'destroyed by thorns':
                stats.destroyedByThorns = value;
                break;
            case 'destroyed by death ray':
                stats.destroyedByDeathRay = value;
                break;
            case 'destroyed by land mine':
                stats.destroyedByLandMine = value;
                break;

            // Upgrades and bonuses
            case 'recovery packages':
                stats.recoveryPackages = value;
                break;
            case 'free attack upgrade':
                stats.freeAttackUpgrade = value;
                break;
            case 'free defense upgrade':
                stats.freeDefenseUpgrade = value;
                break;
            case 'free utility upgrade':
                stats.freeUtilityUpgrade = value;
                break;
            case 'hp from death wave':
                stats.hpFromDeathWave = value;
                break;

            // Resources
            case 'gems':
                stats.gems = value;
                break;
            case 'medals':
                stats.medals = value;
                break;
            case 'reroll shards':
                stats.rerollShards = value;
                break;
            case 'cannon shards':
                stats.cannonShards = value;
                break;
            case 'armor shards':
                stats.armorShards = value;
                break;
            case 'generator shards':
                stats.generatorShards = value;
                break;
            case 'core shards':
                stats.coreShards = value;
                break;
            case 'common modules':
                stats.commonModules = value;
                break;
            case 'rare modules':
                stats.rareModules = value;
                break;

            // Bot stats
            case 'flame bot damage':
                stats.flameBotDamage = value;
                break;
            case 'thunder bot stuns':
                stats.thunderBotStuns = value;
                break;
            case 'golden bot coins earned':
                stats.goldenBotCoinsEarned = value;
                break;
            case 'guardian catches':
                stats.guardianCatches = value;
                break;
            case 'coins fetched':
                stats.coinsFetched = value;
                break;
            case 'coins stolen':
                stats.coinsStolen = value;
                break;
            case 'damage misc':
                stats.damageMisc = value;
                break;
        }
    }

    /**
     * Check if a key is a valid stats key
     */
    isValidStatsKey(key) {
        const validKeys = [
            'tier', 'wave', 'damage dealt', 'coins earned', 'game time', 'real time',
            'killed by', 'cash earned', 'projectiles damage',
            'orb damage', 'death wave damage', 'black hole damage', 'chain lightning damage',
            'land mine damage', 'smart missile damage', 'thorn damage', 'total enemies',
            'waves skipped', 'run duration'
        ];
        return validKeys.includes(key.toLowerCase());
    }

    /**
     * Parse number with Tower game notation support
     */
    parseNumber(str) {
        if (!str) return 0;

        const cleanStr = str.toLowerCase().replace(/,/g, '');

        if (cleanStr.includes('e')) {
            return parseFloat(cleanStr);
        }

        // Extended multipliers for Tower notation
        const multipliers = {
            'k': 1000,
            'm': 1000000,
            'b': 1000000000,
            't': 1000000000000,
            'q': 1000000000000000,
            'Q': 1000000000000000000,
            's': 1000000000000000000000,
            'S': 1000000000000000000000000,
            'n': 1000000000000000000000000000,
            'N': 1000000000000000000000000000000,
            'd': 1000000000000000000000000000000000,
            'D': 1000000000000000000000000000000000000
        };

        const suffix = cleanStr.slice(-1);
        if (multipliers[suffix]) {
            const num = parseFloat(cleanStr.slice(0, -1));
            return num * multipliers[suffix];
        }

        return parseFloat(cleanStr) || 0;
    }

    /**
     * Safely edit reply with error handling for expired interactions
     */
    async safeEditReply(interaction, replyOptions) {
        try {
            if (!interaction.isRepliable()) {
                console.log('⚠️ Interaction is no longer repliable');
                return;
            }

            if (interaction.deferred && !interaction.replied) {
                return await interaction.editReply(replyOptions);
            } else if (!interaction.replied && !interaction.deferred) {
                return await interaction.reply({ ...replyOptions, ephemeral: true });
            } else {
                console.log('⚠️ Interaction already replied or not properly deferred');
                return;
            }
        } catch (error) {
            console.error('Failed to send reply:', error.message);
            // Don't throw the error to prevent bot crashes
        }
    }
}

module.exports = SubmitCommand;