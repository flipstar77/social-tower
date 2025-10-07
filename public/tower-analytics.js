// Tower Analytics - Modular JavaScript Component
class TowerAnalytics {
    constructor() {
        // Check if FormattingUtils is available
        if (typeof FormattingUtils === 'undefined') {
            console.error('❌ FormattingUtils not loaded! This will cause stats rendering to fail.');
            console.log('🔍 Available globals:', Object.keys(window));
        } else {
            console.log('✅ FormattingUtils loaded successfully');
        }

        // Fallback FormattingUtils if not loaded
        if (typeof FormattingUtils === 'undefined') {
            console.log('🔧 Creating fallback FormattingUtils...');
            window.FormattingUtils = {
                formatNumber: (num) => {
                    if (typeof num === 'string' && /[KMBTQSNO]$/.test(num)) return num;
                    num = window.FormattingUtils.parseNumericValue(num);
                    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
                    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
                    return num.toString();
                },
                parseNumericValue: (value) => {
                    if (typeof value === 'number') return value;
                    if (!value) return 0;
                    let str = value.toString().replace(/\$/g, '').replace(/\s/g, '');
                    if (/^\d+,\d{1,2}[A-Za-z]?$/.test(str)) {
                        str = str.replace(',', '.');
                    } else {
                        str = str.replace(/,/g, '');
                    }
                    const multipliers = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12, 'q': 1e15, 'Q': 1e18, 's': 1e21, 'S': 1e24, 'O': 1e27, 'N': 1e30 };
                    const match = str.match(/^([\d.]+)([KMBTQSNOqs]?)$/i);
                    if (match) {
                        const num = parseFloat(match[1]);
                        const suffix = match[2].toUpperCase();
                        return num * (multipliers[suffix] || 1);
                    }
                    return parseFloat(str) || 0;
                }
            };
        }

        this.apiBase = '/api/tower';
        this.runs = [];
        this.filteredRuns = [];
        this.charts = {};
        this.filters = {
            timeRange: 'all'
        };
        this.dataViewMode = 'latest'; // 'latest' or 'all' - controls whether to show single run or combined data
        this.selectedRunId = null;

        // Stats presets configuration
        this.presets = {
            essential: {
                name: 'Essential',
                stats: ['total_runs', 'max_tier', 'max_wave', 'max_damage'],
                description: 'Core performance metrics'
            },
            progress: {
                name: 'Progress',
                stats: ['avg_tier', 'avg_wave', 'total_runs', 'tier_improvement'],
                description: 'Track improvement over time'
            },
            combat: {
                name: 'Combat',
                stats: ['max_damage', 'total_damage', 'damage_sources', 'enemies_killed'],
                description: 'Battle performance stats'
            },
            efficiency: {
                name: 'Efficiency',
                stats: ['coins_earned', 'waves_skipped', 'game_time', 'efficiency_rating'],
                description: 'Resource and time efficiency'
            },
            detailed: {
                name: 'Detailed',
                stats: ['enemy_types', 'death_causes', 'orb_damage', 'projectile_damage'],
                description: 'In-depth analytics'
            },
            all: {
                name: 'All Stats',
                stats: null, // null means show all available stats
                description: 'Complete statistics overview'
            }
        };

        this.currentPreset = 'essential';
        this.hiddenCards = new Set();
        this.lastStats = null;
        this.lastTotals = null;
        this.lastRates = null;
        this.allCards = [];
        this.categoryToggles = this.loadCategoryToggles();

        // Chart preferences
        this.chartOptions = {
            enemyChartType: 'bar', // polarArea, bar, doughnut, radar
            damageChartType: 'bar', // bar, doughnut, polarArea, radar
            selectedEnemyTypes: new Set(['Basic', 'Fast', 'Tank', 'Ranged', 'Boss', 'Protector',
                                        'Vampires', 'Rays', 'Scatters', 'Saboteurs', 'Commanders', 'Overcharges']),
            selectedDamageTypes: new Set(['Projectiles', 'Orb Damage', 'Thorn Damage', 'Land Mine',
                                         'Chain Lightning', 'Black Hole', 'Smart Missile', 'Death Ray',
                                         'Inner Land Mine', 'Death Wave', 'Swamp', 'Rend Armor'])
        };

        // Selected run for individual viewing
        this.selectedRunId = null;
        this.currentViewMode = 'latest'; // 'latest' or 'selected'

        // Only initialize if the analytics section exists
        if (document.getElementById('towerAnalytics')) {
            this.init();
        }
    }

    async init() {
        console.log('🏗️ Initializing Tower Analytics...');
        console.log('🏗️ Current section visibility check...');

        // Check if we're on the tower analytics section
        const towerSection = document.getElementById('towerAnalytics');
        if (towerSection) {
            console.log('🏗️ Tower Analytics section found, display style:', towerSection.style.display);
        } else {
            console.log('❌ Tower Analytics section NOT found');
        }

        // Load saved preset preference
        const savedPreset = localStorage.getItem('towerAnalyticsPreset');
        if (savedPreset && this.presets[savedPreset]) {
            this.currentPreset = savedPreset;
            const presetSelect = document.getElementById('analyticsPresetSelect');
            if (presetSelect) {
                presetSelect.value = savedPreset;
            }
        }

        // Initialize category toggle button states
        this.initializeCategoryButtons();

        await this.loadDashboard();
        this.setupEventListeners();

        // Set up global reference for refreshing
        window.towerAnalytics = this;
    }

    refreshData() {
        console.log('🔄 Refreshing Tower Analytics data...');
        this.loadDashboard();
    }

    setupEventListeners() {
        // Add global methods for HTML onclick handlers
        if (!window.towerAnalytics) {
            window.towerAnalytics = this;
        }
    }

    showSection() {
        console.log('🔍 Tower Analytics section is now being shown');
        const section = document.getElementById('towerAnalytics');
        if (section) {
            section.style.display = 'block';

            // Force reload data when section becomes visible
            console.log('🔄 Force reloading dashboard data when section shown...');
            this.loadDashboard();

            // Re-render charts when section becomes visible
            setTimeout(() => this.renderCharts(), 100);

            // Initialize wiki search if available
            if (window.wikiSearch) {
                console.log('📚 Wiki search found, injecting into analytics...');
                window.wikiSearch.injectIntoAnalytics();
            } else {
                console.log('📚 Wiki search not yet available, will retry...');
                // Retry after a delay in case wiki search is still initializing
                setTimeout(() => {
                    if (window.wikiSearch) {
                        console.log('📚 Wiki search now available, injecting...');
                        window.wikiSearch.injectIntoAnalytics();
                    }
                }, 2000);
            }

            // Initialize cards manager if available
            if (window.cardsManager) {
                window.cardsManager.showSection();
            }

            // Initialize unique modules manager if available
            if (window.uniqueModulesManager) {
                console.log('🔮 Calling uniqueModulesManager.showAnalyticsSection()');
                window.uniqueModulesManager.showAnalyticsSection();
            }
        }
    }

    hideSection() {
        const section = document.getElementById('towerAnalytics');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadDashboard() {
        try {
            console.log('🔥 OLD TowerAnalytics.loadDashboard() called!');
            console.log('📊 Loading Tower Analytics data from API...');

            // Load data from API (Discord bot runs)
            const response = await fetch(`${this.apiBase}/runs?limit=100`);
            const data = await response.json();
            console.log('🔥 API response:', data);

            if (data.success && data.runs && data.runs.length > 0) {
                const farmData = data.runs;
                console.log('Raw imported data:', farmData[0]);

                // Helper function to extract clean time from corrupted field
                const extractTime = (timeStr) => {
                    if (!timeStr) return '0h 0m';
                    // If the field contains corrupted data, extract just the time part
                    const timeMatch = timeStr.match(/((?:\d+d\s+)?\d+h\s+\d+m\s+\d+s)/);
                    return timeMatch ? timeMatch[1] : timeStr;
                };

                // Helper function to normalize European number format to English
                const normalizeNumberFormat = (str) => {
                    if (!str || typeof str !== 'string') return str;
                    // Only normalize if it looks like a European number (has comma before 1-2 digits followed by suffix/end)
                    // Examples: "217,87T", "14,32Q", "66,42N" -> "217.87T", "14.32Q", "66.42N"
                    if (/\d,\d{1,2}([KMBTQPEZYRΛΠΣΩ]|a[a-z])?$/.test(str)) {
                        return str.replace(',', '.');
                    }
                    return str;
                };

                // Transform Supabase tower data to Tower Analytics format
                // The imported data uses direct field names without transformation
                this.runs = farmData.map((run, index) => {
                    // Clean raw_data time fields if they exist
                    if (run.raw_data) {
                        if (run.raw_data.gameTime) run.raw_data.gameTime = extractTime(run.raw_data.gameTime);
                        if (run.raw_data.realTime) run.raw_data.realTime = extractTime(run.raw_data.realTime);
                        if (run.raw_data.game_time) run.raw_data.game_time = extractTime(run.raw_data.game_time);
                        if (run.raw_data.real_time) run.raw_data.real_time = extractTime(run.raw_data.real_time);

                        // Normalize all number formats (European comma -> English period)
                        Object.keys(run.raw_data).forEach(key => {
                            if (typeof run.raw_data[key] === 'string') {
                                run.raw_data[key] = normalizeNumberFormat(run.raw_data[key]);
                            }
                        });
                    }

                    // Create a new run object that preserves all the original fields
                    const newRun = {
                        id: index + 1,
                        date: run.date || new Date().toISOString().split('T')[0],
                        timestamp: run.timestamp || run.submitted_at || run.created_at || new Date().toISOString(), // Add timestamp field
                        tier: parseInt(run.tier) || 0,
                        wave: parseInt(run.wave) || 0,
                        damage_dealt: FormattingUtils.parseNumericValue(run.damage_dealt || 0),
                        coins_earned: FormattingUtils.parseNumericValue(run.coins_earned || 0),
                        cells_earned: FormattingUtils.parseNumericValue(run.cells_earned || 0),
                        reroll_shards_earned: FormattingUtils.parseNumericValue(run.reroll_shards_earned || 0),
                        total_enemies: parseInt(run.total_enemies || 0),
                        damage_taken: FormattingUtils.parseNumericValue(run.damage_taken || 0),
                        killed_by: run.killed_by || 'Unknown',
                        game_time: extractTime(run.game_time || '0h 0m'),
                        real_time: extractTime(run.real_time || '0h 0m'),
                        // Also set camelCase versions
                        gameTime: extractTime(run.raw_data?.gameTime || run.game_time || '0h 0m'),
                        realTime: extractTime(run.raw_data?.realTime || run.real_time || '0h 0m')
                    };

                    // Copy all original fields to preserve data for bot calculations
                    Object.assign(newRun, run);

                    return newRun;
                });

                this.filteredRuns = [...this.runs].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

                // Set default view to latest run only
                console.log(`🔍 FILTER DEBUG - dataViewMode: ${this.dataViewMode}, filteredRuns.length: ${this.filteredRuns.length}`);
                if (this.dataViewMode === 'latest' && this.filteredRuns.length > 0) {
                    console.log(`🎯 Applying latest run filter - before: ${this.filteredRuns.length} runs`);
                    this.filteredRuns = [this.filteredRuns[0]]; // Show only the latest run
                    console.log(`🎯 Applied latest run filter - after: ${this.filteredRuns.length} runs`);
                }

                console.log(`✅ Loaded ${this.runs.length} tower runs from Supabase API`);
                console.log('First transformed run:', this.runs[0]);

                // Calculate stats from the tower runs data
                const stats = this.calculateTowerStatsFromRuns();
                const totals = this.calculateTowerTotalsFromRuns();
                const rates = this.calculateTowerRatesFromRuns();

                console.log('Calculated stats:', stats);
                console.log('Calculated totals:', totals);
                console.log('Calculated rates:', rates);

                // Check for achievements based on the latest stats
                this.checkAchievements(stats, totals);

                console.log('🔥 About to call renderStatsCards with:', { stats, totals, rates });
                try {
                    this.renderStatsCards(stats, totals, rates);
                    console.log('✅ renderStatsCards completed successfully');
                } catch (error) {
                    console.error('❌ Error in renderStatsCards:', error);
                    console.error('Stack trace:', error.stack);
                }
            } else {
                console.log('📝 No tower run data found in Supabase API');
                this.runs = [];
                this.filteredRuns = [];

                // Show empty state
                const emptyStats = { totalRuns: 0, avgEfficiency: 0, totalTime: 0 };
                const emptyTotals = { kills: 0, gold: 0, xp: 0 };
                const emptyRates = { goldPerMinute: 0, xpPerMinute: 0, killsPerMinute: 0 };

                this.renderStatsCards(emptyStats, emptyTotals, emptyRates);
            }

            this.renderCharts();
            this.renderRunsTable();
            // Disabled: /api/tower/sessions endpoint doesn't exist
            // this.loadSessions();

        } catch (error) {
            console.error('❌ Error loading Tower Analytics from Supabase API:', error);
            this.showError('Failed to load tower run data from API.');
        }
    }

    renderStatsCards(stats, totals, rates) {
        console.log('🎯 TowerAnalytics.renderStatsCards called with:', { stats, totals, rates });
        console.log('🎯 RENDER DEBUG - stats.total_runs:', stats?.total_runs);

        // Try multiple ways to find the element
        const statsGrid = document.getElementById('analyticsStatsGrid');
        const statsGridByClass = document.querySelector('.analytics-stats-grid');
        const allStatsGrids = document.querySelectorAll('[id*="analyticsStatsGrid"], [class*="analytics-stats-grid"]');

        console.log('🎯 Analytics stats grid element (by ID):', statsGrid);
        console.log('🎯 Analytics stats grid element (by class):', statsGridByClass);
        console.log('🎯 All potential stats grids:', allStatsGrids);

        const targetGrid = statsGrid || statsGridByClass;
        if (!targetGrid) {
            console.error('❌ Stats grid element not found!');
            console.log('🔍 Available elements with "grid" in id or class:',
                Array.from(document.querySelectorAll('[id*="grid"], [class*="grid"]')).map(el => ({
                    id: el.id,
                    class: el.className,
                    tagName: el.tagName
                }))
            );
            return;
        }

        // Store data for re-rendering
        this.lastStats = stats;
        this.lastTotals = totals;
        this.lastRates = rates;

        // When no data exists, ensure stats object has proper default values
        if (!stats || stats.total_runs === 0) {
            console.log('📊 No data found - showing all tiles with 0 values');
            stats = stats || { total_runs: 0, max_tier: 0, max_wave: 0, max_damage: 0 };
            totals = totals || {};
            rates = rates || {};
        }

        // Remove the emergency return - let the full rendering continue

        // Get the current run data (either single latest run or aggregate)
        const currentRun = this.filteredRuns && this.filteredRuns.length > 0 ? this.filteredRuns[0] : null;

        // Basic Tower stats - adjust labels based on view mode
        const basicCards = [
            {
                value: stats.total_runs || 0,
                label: this.dataViewMode === 'latest' ? 'Latest Run' : 'Total Runs',
                icon: '🎮'
            },
            {
                value: stats.max_tier || 0,
                label: this.dataViewMode === 'latest' ? 'Tier Reached' : 'Highest Tier',
                icon: '🏔️'
            },
            {
                value: FormattingUtils.formatNumber(stats.max_wave || 0),
                label: this.dataViewMode === 'latest' ? 'Wave Reached' : 'Highest Wave',
                icon: '🌊'
            },
            {
                value: FormattingUtils.formatNumber(stats.max_damage || 0),
                label: this.dataViewMode === 'latest' ? 'Damage Dealt' : 'Max Damage Dealt',
                icon: '⚔️'
            }
        ];

        // Direct run data cards - ALL 80+ fields from the run
        const runDataCards = currentRun ? [
            // Core Statistics
            { value: currentRun.game_time || 'N/A', label: 'Game Time', icon: '⏰' },
            { value: currentRun.real_time || 'N/A', label: 'Real Time', icon: '⏱️' },
            { value: FormattingUtils.formatNumber(currentRun.tier || 0), label: 'Tier', icon: '🏔️' },
            { value: FormattingUtils.formatNumber(currentRun.wave || 0), label: 'Wave', icon: '🌊' },
            { value: currentRun.killed_by || 'N/A', label: 'Killed By', icon: '💀' },

            // Economic Statistics
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_earned || 0)), label: 'Coins Earned', icon: '🪙' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.cash_earned || 0)), label: 'Cash Earned', icon: '💵' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.interest_earned || 0)), label: 'Interest Earned', icon: '📈' },
            { value: FormattingUtils.formatNumber(currentRun.gem_blocks_tapped || 0), label: 'Gem Blocks Tapped', icon: '💎' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.cells_earned || 0)), label: 'Cells Earned', icon: '🔋' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.reroll_shards_earned || 0)), label: 'Reroll Shards Earned', icon: '🎲' },

            // Damage Statistics
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.damage_taken || 0)), label: 'Damage Taken', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.damage_taken_wall || 0)), label: 'Damage Taken Wall', icon: '🧱' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.damage_taken_while_berserked || 0)), label: 'Damage While Berserked', icon: '😤' },
            { value: currentRun.damage_gain_from_berserk || 'N/A', label: 'Damage Gain From Berserk', icon: '💪' },
            { value: FormattingUtils.formatNumber(currentRun.death_defy || 0), label: 'Death Defy', icon: '⚡' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.damage_dealt || 0)), label: 'Damage Dealt', icon: '⚔️' },

            // Damage Sources - Show original values with suffixes when available
            { value: currentRun.projectiles_damage || '0', label: 'Projectiles Damage', icon: '🎯' },
            { value: currentRun.rend_armor_damage || '0', label: 'Rend Armor Damage', icon: '🗡️' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.projectiles_count || 0)), label: 'Projectiles Count', icon: '🔫' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.lifesteal || 0)), label: 'Lifesteal', icon: '🩸' },
            { value: currentRun.thorn_damage || '0', label: 'Thorn Damage', icon: '🌹' },
            { value: currentRun.orb_damage || '0', label: 'Orb Damage', icon: '🔮' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.orb_hits || 0)), label: 'Orb Hits', icon: '💫' },
            { value: currentRun.land_mine_damage || '0', label: 'Land Mine Damage', icon: '💣' },
            { value: FormattingUtils.formatNumber(currentRun.land_mines_spawned || 0), label: 'Land Mines Spawned', icon: '🎇' },
            { value: currentRun.death_ray_damage || '0', label: 'Death Ray Damage', icon: '☠️' },
            { value: currentRun.smart_missile_damage || '0', label: 'Smart Missile Damage', icon: '🚀' },
            { value: currentRun.inner_land_mine_damage || '0', label: 'Inner Land Mine Damage', icon: '💥' },
            { value: currentRun.chain_lightning_damage || '0', label: 'Chain Lightning Damage', icon: '⚡' },
            { value: currentRun.death_wave_damage || '0', label: 'Death Wave Damage', icon: '🌀' },
            { value: currentRun.swamp_damage || '0', label: 'Swamp Damage', icon: '🐊' },
            { value: currentRun.black_hole_damage || '0', label: 'Black Hole Damage', icon: '⚫' },

            // Resource Income Sources
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_death_wave || 0)), label: 'Coins from Death Wave', icon: '💰' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.cash_from_golden_tower || 0)), label: 'Cash from Golden Tower', icon: '🏰' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_golden_tower || 0)), label: 'Coins from Golden Tower', icon: '👑' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_blackhole || 0)), label: 'Coins from Blackhole', icon: '🕳️' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_spotlight || 0)), label: 'Coins from Spotlight', icon: '💡' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_orbs || 0)), label: 'Coins from Orbs', icon: '⭕' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_coin_upgrade || 0)), label: 'Coins from Coin Upgrade', icon: '⬆️' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_from_coin_bonuses || 0)), label: 'Coins from Coin Bonuses', icon: '🎁' },

            // Enemy Statistics
            { value: FormattingUtils.formatNumber(currentRun.total_enemies || 0), label: 'Total Enemies', icon: '👾' },
            { value: FormattingUtils.formatNumber(currentRun.basic_enemies || currentRun.basic || 0), label: 'Basic', icon: '🟢' },
            { value: FormattingUtils.formatNumber(currentRun.fast_enemies || currentRun.fast || 0), label: 'Fast', icon: '💨' },
            { value: FormattingUtils.formatNumber(currentRun.tank_enemies || currentRun.tank || 0), label: 'Tank', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(currentRun.ranged_enemies || currentRun.ranged || 0), label: 'Ranged', icon: '🏹' },
            { value: FormattingUtils.formatNumber(currentRun.boss_enemies || currentRun.boss || 0), label: 'Boss', icon: '👹' },
            { value: FormattingUtils.formatNumber(currentRun.protector_enemies || currentRun.protector || 0), label: 'Protector', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(currentRun.total_elites || 0), label: 'Total Elites', icon: '⭐' },
            { value: FormattingUtils.formatNumber(currentRun.vampires || 0), label: 'Vampires', icon: '🧛' },
            { value: FormattingUtils.formatNumber(currentRun.rays || 0), label: 'Rays', icon: '☄️' },
            { value: FormattingUtils.formatNumber(currentRun.scatters || 0), label: 'Scatters', icon: '💥' },
            { value: FormattingUtils.formatNumber(currentRun.saboteurs || 0), label: 'Saboteurs', icon: '🗡️' },
            { value: FormattingUtils.formatNumber(currentRun.commanders || 0), label: 'Commanders', icon: '👑' },
            { value: FormattingUtils.formatNumber(currentRun.overcharges || 0), label: 'Overcharges', icon: '⚡' },

            // Kill Methods
            { value: FormattingUtils.formatNumber(currentRun.destroyed_by_orbs || 0), label: 'Destroyed by Orbs', icon: '🔮' },
            { value: FormattingUtils.formatNumber(currentRun.destroyed_by_thorns || 0), label: 'Destroyed by Thorns', icon: '🌹' },
            { value: FormattingUtils.formatNumber(currentRun.destroyed_by_death_ray || 0), label: 'Destroyed by Death ray', icon: '☠️' },
            { value: FormattingUtils.formatNumber(currentRun.destroyed_by_land_mine || 0), label: 'Destroyed by Land Mine', icon: '💣' },

            // Bot Statistics
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.flame_bot_damage || 0)), label: 'Flame bot damage', icon: '🔥' },
            { value: FormattingUtils.formatNumber(currentRun.thunder_bot_stuns || 0), label: 'Thunder bot stuns', icon: '⚡' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.golden_bot_coins_earned || 0)), label: 'Golden bot coins earned', icon: '🪙' },
            { value: FormattingUtils.formatNumber(currentRun.guardian_catches || 0), label: 'Guardian catches', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_fetched || 0)), label: 'Coins Fetched', icon: '🎯' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.coins_stolen || 0)), label: 'Coins Stolen', icon: '💸' },

            // Upgrade Statistics
            { value: FormattingUtils.formatNumber(currentRun.waves_skipped || 0), label: 'Waves Skipped', icon: '⏭️' },
            { value: FormattingUtils.formatNumber(currentRun.recovery_packages || 0), label: 'Recovery Packages', icon: '🏥' },
            { value: FormattingUtils.formatNumber(currentRun.free_attack_upgrade || 0), label: 'Free Attack Upgrade', icon: '⚔️' },
            { value: FormattingUtils.formatNumber(currentRun.free_defense_upgrade || 0), label: 'Free Defense Upgrade', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(currentRun.free_utility_upgrade || 0), label: 'Free Utility Upgrade', icon: '🔧' },
            { value: FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(currentRun.hp_from_death_wave || 0)), label: 'HP From Death Wave', icon: '❤️' },

            // Resource Rewards
            { value: FormattingUtils.formatNumber(currentRun.gems || 0), label: 'Gems', icon: '💎' },
            { value: FormattingUtils.formatNumber(currentRun.medals || 0), label: 'Medals', icon: '🏅' },
            { value: FormattingUtils.formatNumber(currentRun.reroll_shards || 0), label: 'Reroll Shards', icon: '🎲' },
            { value: FormattingUtils.formatNumber(currentRun.cannon_shards || 0), label: 'Cannon Shards', icon: '💥' },
            { value: FormattingUtils.formatNumber(currentRun.armor_shards || 0), label: 'Armor Shards', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(currentRun.generator_shards || 0), label: 'Generator Shards', icon: '⚙️' },
            { value: FormattingUtils.formatNumber(currentRun.core_shards || 0), label: 'Core Shards', icon: '💠' },
            { value: FormattingUtils.formatNumber(currentRun.common_modules || 0), label: 'Common Modules', icon: '⬜' },
            { value: FormattingUtils.formatNumber(currentRun.rare_modules || 0), label: 'Rare Modules', icon: '🟦' }
            // Note: Removed potential duplicates - some bot/fetch cards that might aggregate multiple runs
        ] : [];

        // Calculate main reroll shards from runs data (25k)
        const mainRerollShards = this.runs.reduce((total, run) => total + (run.reroll_shards_earned || run['Reroll Shards Earned'] || 0), 0);

        // Totals cards for tower data
        const totalCards = totals ? [
            { value: FormattingUtils.formatNumber(totals.total_coins || 0), label: 'Total Coins', icon: '🪙' },
            { value: FormattingUtils.formatNumber(totals.total_cells || 0), label: 'Total Cells', icon: '🔋' },
            { value: FormattingUtils.formatNumber(mainRerollShards || 0), label: 'Reroll Shards Earned', icon: '🔄' }
        ] : [];

        // Calculate main reroll shards per hour
        const totalRealTimeHours = this.runs.reduce((sum, run) => {
            return sum + this.parseGameTimeToHours(run.realTime || run.real_time || run['Real Time'] || '0h 0m');
        }, 0);
        const mainRerollShardsPerHour = totalRealTimeHours > 0 ? Math.round(mainRerollShards / totalRealTimeHours) : 0;

        // Calculate reroll shards per hour for this specific run/runs
        const rerollShardsPerHour = currentRun && this.dataViewMode === 'latest' ?
            this.parseGameTimeToHours(currentRun.real_time || '0h') > 0 ?
                FormattingUtils.parseNumericValue(currentRun.reroll_shards_earned || 0) / this.parseGameTimeToHours(currentRun.real_time || '0h') : 0
            : mainRerollShardsPerHour;

        const rateCards = rates ? [
            { value: FormattingUtils.formatNumber(Math.round(rates.coins_per_hour || 0)), label: 'Coins/Hour', icon: '💰' },
            { value: FormattingUtils.formatNumber(Math.round(rates.coins_per_wave || 0)), label: 'Coins/Wave', icon: '🌊💰' },
            { value: FormattingUtils.formatNumber(Math.round(rates.cells_per_hour || 0)), label: 'Cells/Hour', icon: '🔋⏱️' },
            { value: FormattingUtils.formatNumber(Math.round(rerollShardsPerHour)), label: 'Reroll Shards/Hour', icon: '🔄⏱️' }
        ] : [];

        // Fetch Bot/Guardian stats
        const fetchBotCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('reroll_shards') || 0), label: 'Fetch Bot Reroll Shards', icon: '🤖🔄' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('cannon_shards') || 0), label: 'Cannon Shards', icon: '💥' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('armor_shards') || 0), label: 'Armor Shards', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('generator_shards') || 0), label: 'Generator Shards', icon: '⚡' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('core_shards') || 0), label: 'Core Shards', icon: '🔮' }
        ] : [];

        // Damage stats
        const damageCards = totals ? [
            { value: FormattingUtils.formatNumber(totals.total_damage_taken || 0), label: 'Total Damage Taken', icon: '💔' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('damage_taken_wall') || 0), label: 'Wall Damage Taken', icon: '🧱' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('damage_taken_berserked') || 0), label: 'Berserked Damage', icon: '😡' }
        ] : [];

        // Damage source breakdown
        const damageSourceCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('projectiles_damage')), label: 'Projectiles Damage', icon: '🏹' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('thorn_damage')), label: 'Thorn Damage', icon: '🌹' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('orb_damage')), label: 'Orb Damage', icon: '🔮' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('land_mine_damage')), label: 'Land Mine Damage', icon: '💣' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('chain_lightning_damage')), label: 'Chain Lightning', icon: '⚡' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('death_wave_damage')), label: 'Death Wave Damage', icon: '🌊' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('smart_missile_damage')), label: 'Smart Missile', icon: '🚀' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('black_hole_damage')), label: 'Black Hole Damage', icon: '🕳️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('death_ray_damage')), label: 'Death Ray Damage', icon: '☄️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('inner_land_mine_damage')), label: 'Inner Land Mine', icon: '💥' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('swamp_damage')), label: 'Swamp Damage', icon: '🐊' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('rend_armor_damage')), label: 'Rend Armor Damage', icon: '🗡️' }
        ] : [];

        // Enemy types defeated breakdown
        const enemyTypesCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('basic_enemies')), label: 'Basic Enemies', icon: '👤' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('fast_enemies')), label: 'Fast Enemies', icon: '💨' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('tank_enemies')), label: 'Tank Enemies', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('ranged_enemies')), label: 'Ranged Enemies', icon: '🏹' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('boss_enemies')), label: 'Boss Enemies', icon: '👑' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('protector_enemies')), label: 'Protector Enemies', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('total_elites')), label: 'Total Elites', icon: '⭐' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('vampires')), label: 'Vampires', icon: '🧛' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('rays')), label: 'Rays', icon: '🔆' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('scatters')), label: 'Scatters', icon: '💥' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('saboteurs')), label: 'Saboteurs', icon: '🔧' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('commanders')), label: 'Commanders', icon: '🎖️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('overcharges')), label: 'Overcharges', icon: '⚡' }
        ] : [];

        // Destruction method breakdown
        const destructionMethodCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('destroyed_by_orbs')), label: 'Destroyed by Orbs', icon: '🔮💀' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('destroyed_by_thorns')), label: 'Destroyed by Thorns', icon: '🌹💀' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('destroyed_by_death_ray')), label: 'Destroyed by Death Ray', icon: '☄️💀' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('destroyed_by_land_mine')), label: 'Destroyed by Land Mine', icon: '💣💀' }
        ] : [];

        // Coin sources
        const coinSourceCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_golden_tower') || 0), label: 'Golden Tower Coins', icon: '🏗️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_blackhole') || 0), label: 'Black Hole Coins', icon: '🕳️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_death_wave') || 0), label: 'Death Wave Coins', icon: '🌊' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_spotlight') || 0), label: 'Spotlight Coins', icon: '💡' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_coin_upgrade') || 0), label: 'Coins from Upgrades', icon: '⬆️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_from_coin_bonuses') || 0), label: 'Coins from Bonuses', icon: '🎁' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('golden_bot_coins_earned') || 0), label: 'Golden Bot Coins', icon: '🤖' }
        ] : [];

        // Additional bot performance metrics
        const botPerformanceCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('flame_bot_damage')), label: 'Flame Bot Damage', icon: '🔥🤖' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('thunder_bot_stuns')), label: 'Thunder Bot Stuns', icon: '⚡🤖' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('guardian_catches')), label: 'Guardian Catches', icon: '🛡️🤖' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('coins_fetched')), label: 'Coins Fetched', icon: '🔄🤖' }
        ] : [];

        // Card usage analytics
        const cardAnalyticsCards = this.calculateCardAnalytics();

        // Combat survivability metrics
        const survivabilityCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('death_defy')), label: 'Death Defy Uses', icon: '💀🛡️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('lifesteal')), label: 'Total Lifesteal', icon: '🩸' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('hp_from_death_wave')), label: 'HP from Death Wave', icon: '❤️🌊' },
            { value: this.calculateBerserkMultiplier(), label: 'Avg Berserk Multiplier', icon: '😡🔥' }
        ] : [];

        // Resource collection metrics
        const resourceCards = totals ? [
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('gem_blocks_tapped')), label: 'Gem Blocks Tapped', icon: '💎👆' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('recovery_packages')), label: 'Recovery Packages', icon: '📦❤️' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('free_attack_upgrade')), label: 'Free Attack Upgrades', icon: '⚔️🆓' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('free_defense_upgrade')), label: 'Free Defense Upgrades', icon: '🛡️🆓' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('free_utility_upgrade')), label: 'Free Utility Upgrades', icon: '🔧🆓' }
        ] : [];

        // Statistics and progress
        const progressCards = [
            { value: Math.round(stats.avg_tier * 10) / 10 || 0, label: 'Average Tier', icon: '📊' },
            { value: FormattingUtils.formatNumber(Math.round(stats.avg_wave) || 0), label: 'Average Wave', icon: '🎯' },
            { value: FormattingUtils.formatNumber(this.calculateBotTotal('waves_skipped')), label: 'Total Waves Skipped', icon: '⏭️' },
            { value: FormattingUtils.formatNumber(stats.total_enemies_killed || 0), label: 'Enemies Defeated', icon: '💀' }
        ];


        // COMPLETE VERSION - ALL 80+ tiles with 0 fallbacks
        console.log('🎯 Creating complete tiles for all stats...');

        // Create a dummy empty run if no data exists to ensure tiles always show
        const runData = currentRun || {};

        const allCards = [
            // Basic stats
            ...basicCards,

            // ALL stats from your list - showing 0 when no data
            { value: runData.game_time || '0d 0h 0m 0s', label: 'Game Time', icon: '⏰' },
            { value: runData.real_time || '0h 0m 0s', label: 'Real Time', icon: '⏱️' },
            { value: runData.tier || 0, label: 'Tier', icon: '🏔️' },
            { value: FormattingUtils.formatNumber(runData.wave || 0), label: 'Wave', icon: '🌊' },
            { value: runData.killed_by || 'None', label: 'Killed By', icon: '💀' },
            { value: runData.coins_earned || '0', label: 'Coins Earned', icon: '🪙' },
            { value: runData.cash_earned || '$0', label: 'Cash Earned', icon: '💵' },
            { value: runData.interest_earned || '$0', label: 'Interest Earned', icon: '📈' },
            { value: FormattingUtils.formatNumber(runData.gem_blocks_tapped || 0), label: 'Gem Blocks Tapped', icon: '💎' },
            { value: runData.cells_earned || '0', label: 'Cells Earned', icon: '🔋' },
            { value: runData.reroll_shards_earned || '0', label: 'Reroll Shards Earned', icon: '🎲' },
            { value: runData.damage_taken || '0', label: 'Damage Taken', icon: '🛡️' },
            { value: runData.damage_taken_wall || '0', label: 'Damage Taken Wall', icon: '🧱' },
            { value: runData.damage_taken_while_berserked || '0', label: 'Damage Taken While Berserked', icon: '😡' },
            { value: runData.damage_gain_from_berserk || 'x0,00', label: 'Damage Gain From Berserk', icon: '💪' },
            { value: FormattingUtils.formatNumber(runData.death_defy || 0), label: 'Death Defy', icon: '⚡' },
            { value: runData.damage_dealt || '0', label: 'Damage Dealt', icon: '⚔️' },
            { value: runData.projectiles_damage || '0', label: 'Projectiles Damage', icon: '🎯' },
            { value: runData.rend_armor_damage || '0', label: 'Rend Armor Damage', icon: '🗡️' },
            { value: runData.projectiles_count || '0', label: 'Projectiles Count', icon: '🔫' },
            { value: FormattingUtils.formatNumber(runData.lifesteal || 0), label: 'Lifesteal', icon: '🩸' },
            { value: runData.thorn_damage || '0', label: 'Thorn Damage', icon: '🌹' },
            { value: runData.orb_damage || '0', label: 'Orb Damage', icon: '🔮' },
            { value: runData.orb_hits || '0', label: 'Orb Hits', icon: '💫' },
            { value: runData.land_mine_damage || '0', label: 'Land Mine Damage', icon: '💣' },
            { value: FormattingUtils.formatNumber(runData.land_mines_spawned || 0), label: 'Land Mines Spawned', icon: '🎇' },
            { value: runData.death_ray_damage || '0', label: 'Death Ray Damage', icon: '☠️' },
            { value: runData.smart_missile_damage || '0', label: 'Smart Missile Damage', icon: '🚀' },
            { value: runData.inner_land_mine_damage || '0', label: 'Inner Land Mine Damage', icon: '💥' },
            { value: runData.chain_lightning_damage || '0', label: 'Chain Lightning Damage', icon: '⚡' },
            { value: runData.death_wave_damage || '0', label: 'Death Wave Damage', icon: '🌀' },
            { value: runData.swamp_damage || '0', label: 'Swamp Damage', icon: '🐊' },
            { value: runData.black_hole_damage || '0', label: 'Black Hole Damage', icon: '⚫' },
            { value: FormattingUtils.formatNumber(runData.waves_skipped || 0), label: 'Waves Skipped', icon: '⏭️' },
            { value: FormattingUtils.formatNumber(runData.recovery_packages || 0), label: 'Recovery Packages', icon: '🏥' },
            { value: FormattingUtils.formatNumber(runData.free_attack_upgrade || 0), label: 'Free Attack Upgrade', icon: '⚔️🆓' },
            { value: FormattingUtils.formatNumber(runData.free_defense_upgrade || 0), label: 'Free Defense Upgrade', icon: '🛡️🆓' },
            { value: FormattingUtils.formatNumber(runData.free_utility_upgrade || 0), label: 'Free Utility Upgrade', icon: '🔧🆓' },
            { value: runData.hp_from_death_wave || '0,00', label: 'HP From Death Wave', icon: '❤️' },
            { value: runData.coins_from_death_wave || '0', label: 'Coins from Death Wave', icon: '💰🌊' },
            { value: runData.cash_from_golden_tower || '$0', label: 'Cash from Golden Tower', icon: '🏰💵' },
            { value: runData.coins_from_golden_tower || '0', label: 'Coins from Golden Tower', icon: '🏰🪙' },
            { value: runData.coins_from_blackhole || '0', label: 'Coins from Blackhole', icon: '⚫🪙' },
            { value: runData.coins_from_spotlight || '0', label: 'Coins from Spotlight', icon: '💡🪙' },
            { value: FormattingUtils.formatNumber(runData.coins_from_orbs || 0), label: 'Coins from Orbs', icon: '🔮🪙' },
            { value: runData.coins_from_coin_upgrade || '0', label: 'Coins from Coin Upgrade', icon: '⬆️🪙' },
            { value: runData.coins_from_coin_bonuses || '0', label: 'Coins from Coin Bonuses', icon: '🎁🪙' },
            { value: FormattingUtils.formatNumber(runData.total_enemies || 0), label: 'Total Enemies', icon: '👾' },
            { value: FormattingUtils.formatNumber(runData.basic_enemies || runData.basic || 0), label: 'Basic', icon: '👤' },
            { value: FormattingUtils.formatNumber(runData.fast_enemies || runData.fast || 0), label: 'Fast', icon: '💨' },
            { value: FormattingUtils.formatNumber(runData.tank_enemies || runData.tank || 0), label: 'Tank', icon: '🛡️' },
            { value: FormattingUtils.formatNumber(runData.ranged_enemies || runData.ranged || 0), label: 'Ranged', icon: '🏹' },
            { value: FormattingUtils.formatNumber(runData.boss_enemies || runData.boss || 0), label: 'Boss', icon: '👹' },
            { value: FormattingUtils.formatNumber(runData.protector_enemies || runData.protector || 0), label: 'Protector', icon: '🛡️👤' },
            { value: FormattingUtils.formatNumber(runData.total_elites || 0), label: 'Total Elites', icon: '⭐' },
            { value: FormattingUtils.formatNumber(runData.vampires || 0), label: 'Vampires', icon: '🧛' },
            { value: FormattingUtils.formatNumber(runData.rays || 0), label: 'Rays', icon: '⚡📡' },
            { value: FormattingUtils.formatNumber(runData.scatters || 0), label: 'Scatters', icon: '💥' },
            { value: FormattingUtils.formatNumber(runData.saboteurs || 0), label: 'Saboteurs', icon: '🔧💀' },
            { value: FormattingUtils.formatNumber(runData.commanders || 0), label: 'Commanders', icon: '👑' },
            { value: FormattingUtils.formatNumber(runData.overcharges || 0), label: 'Overcharges', icon: '⚡💀' },
            { value: FormattingUtils.formatNumber(runData.destroyed_by_orbs || 0), label: 'Destroyed by Orbs', icon: '🔮💀' },
            { value: FormattingUtils.formatNumber(runData.destroyed_by_thorns || 0), label: 'Destroyed by Thorns', icon: '🌹💀' },
            { value: FormattingUtils.formatNumber(runData.destroyed_by_death_ray || 0), label: 'Destroyed by Death ray', icon: '☠️💀' },
            { value: FormattingUtils.formatNumber(runData.destroyed_by_land_mine || 0), label: 'Destroyed by Land Mine', icon: '💣💀' },
            { value: runData.flame_bot_damage || '0', label: 'Flame bot damage', icon: '🔥🤖' },
            { value: FormattingUtils.formatNumber(runData.thunder_bot_stuns || 0), label: 'Thunder bot stuns', icon: '⚡🤖' },
            { value: runData.golden_bot_coins_earned || '0', label: 'Golden bot coins earned', icon: '🪙🤖' },
            { value: runData.damage || '0', label: 'Damage', icon: '⚔️' },
            { value: FormattingUtils.formatNumber(runData.coins_stolen || 0), label: 'Coins Stolen', icon: '💸' },
            { value: FormattingUtils.formatNumber(runData.guardian_catches || 0), label: 'Guardian catches', icon: '🛡️🤖' },
            { value: runData.coins_fetched || '0', label: 'Coins Fetched', icon: '🪙🔄' },
            { value: FormattingUtils.formatNumber(runData.gems || 0), label: 'Gems', icon: '💎' },
            { value: FormattingUtils.formatNumber(runData.medals || 0), label: 'Medals', icon: '🏅' },
            { value: FormattingUtils.formatNumber(runData.reroll_shards || 0), label: 'Reroll Shards', icon: '🎲' },
            { value: FormattingUtils.formatNumber(runData.cannon_shards || 0), label: 'Cannon Shards', icon: '💥⚡' },
            { value: FormattingUtils.formatNumber(runData.armor_shards || 0), label: 'Armor Shards', icon: '🛡️⚡' },
            { value: FormattingUtils.formatNumber(runData.generator_shards || 0), label: 'Generator Shards', icon: '⚙️⚡' },
            { value: FormattingUtils.formatNumber(runData.core_shards || 0), label: 'Core Shards', icon: '💠⚡' },
            { value: FormattingUtils.formatNumber(runData.common_modules || 0), label: 'Common Modules', icon: '⬜' },
            { value: FormattingUtils.formatNumber(runData.rare_modules || 0), label: 'Rare Modules', icon: '🟦' },

            // Rate cards
            ...rateCards
        ];

        console.log('🎯 Complete tiles created with length:', allCards.length);

        // Apply preset filtering first, then filter out hidden cards
        const presetCards = this.getPresetCards(allCards);

        const visibleCards = presetCards.filter((card, index) => {
            // Find the original index in allCards to check if it's hidden
            const originalIndex = allCards.indexOf(card);
            return !this.hiddenCards || !this.hiddenCards.has(originalIndex);
        });
        targetGrid.innerHTML = visibleCards.map((card, index) => {
            const category = this.getCategoryForLabel(card.label);
            return `
            <div class="analytics-stat-card"
                 draggable="true"
                 data-card-id="${index}"
                 data-card-label="${card.label}"
                 data-category="${category}">
                <div class="analytics-stat-value">${card.icon} ${card.value}</div>
                <div class="analytics-stat-label">
                    ${card.label}
                    <button class="analytics-card-toggle" onclick="window.towerAnalytics.toggleCard(${index})" title="Hide this tile">×</button>
                </div>
            </div>
        `;
        }).join('');

        // Store cards data and initialize drag & drop
        this.allCards = allCards;
        this.initializeDragAndDrop();
        this.updateRestoreButton();
    }

    renderCharts() {
        // Only render if the section is visible
        const section = document.getElementById('towerAnalytics');
        if (!section || section.style.display === 'none') return;

        this.renderProgressChart();
        this.renderTierDistribution();
        this.renderDamageBreakdown();
        this.renderEnemyBreakdown();
    }

    async renderProgressChart() {
        const metric = this.filters.metric;
        const canvas = document.getElementById('analyticsProgressChart');
        if (!canvas) return;

        try {
            const response = await fetch(`${this.apiBase}/progress?metric=${metric}`);
            const data = await response.json();

            if (!data.success || !data.progress.length) {
                return;
            }

            const ctx = canvas.getContext('2d');

            if (this.charts.progress) {
                this.charts.progress.destroy();
            }

            const chartData = data.progress.map(run => ({
                x: new Date(run.timestamp).toLocaleDateString(),
                y: FormattingUtils.parseNumericValue(run.value)
            }));

            this.charts.progress = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: this.getMetricLabel(metric),
                        data: chartData,
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#FFD700',
                        pointBorderColor: '#FFA500',
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#E6E6FA'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.dataset.label || '';
                                    const value = FormattingUtils.formatNumber(context.parsed.y || 0);
                                    return `${label}: ${value}`;
                                }
                            },
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#FFD700',
                            bodyColor: '#E6E6FA',
                            borderColor: '#FFD700',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            type: 'category',
                            ticks: {
                                color: '#B0B0C8'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#B0B0C8',
                                callback: (value) => FormattingUtils.formatNumber(value)
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error rendering progress chart:', error);
        }
    }

    renderTierDistribution() {
        const canvas = document.getElementById('analyticsTierChart');
        if (!canvas) return;

        const tierCounts = {};
        this.filteredRuns.forEach(run => {
            const tier = run.tier || 0;
            tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        });

        const ctx = canvas.getContext('2d');

        if (this.charts.tier) {
            this.charts.tier.destroy();
        }

        const tiers = Object.keys(tierCounts).sort((a, b) => parseInt(a) - parseInt(b));
        const counts = tiers.map(tier => tierCounts[tier]);

        this.charts.tier = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: tiers.map(t => `Tier ${t}`),
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
                        '#FFC107', '#FF9800', '#FF5722', '#F44336',
                        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                        '#2196F3', '#03A9F4', '#00BCD4', '#009688'
                    ],
                    borderWidth: 2,
                    borderColor: '#1A1A3E'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#E6E6FA',
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} runs (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFD700',
                        bodyColor: '#E6E6FA',
                        borderColor: '#FFD700',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    renderDamageBreakdown() {
        const canvas = document.getElementById('analyticsDamageChart');
        if (!canvas || !this.filteredRuns.length) return;

        // Get the run to display - either selected or latest
        const run = this.currentViewMode === 'selected' && this.selectedRunId
            ? this.runs.find(r => r.id === this.selectedRunId)
            : this.filteredRuns[0];

        if (!run) return;

        // Debug: Log all available field names
        console.log('🔍 Available fields in run data:', Object.keys(run).filter(key => key.toLowerCase().includes('damage')));
        console.log('🔍 Sample run object keys:', Object.keys(run).slice(0, 20));

        // All damage types including missing ones
        const allDamageTypes = [
            { label: 'Projectiles', value: FormattingUtils.parseNumericValue(run.projectilesDamage || run.projectiles_damage) },
            { label: 'Orb Damage', value: FormattingUtils.parseNumericValue(run.orbDamage || run.orb_damage) },
            { label: 'Thorn Damage', value: FormattingUtils.parseNumericValue(run.thornDamage || run.thorn_damage) },
            { label: 'Land Mine', value: FormattingUtils.parseNumericValue(run.landMineDamage || run.land_mine_damage) },
            { label: 'Chain Lightning', value: FormattingUtils.parseNumericValue(run.chainLightningDamage || run.chain_lightning_damage) },
            { label: 'Black Hole', value: FormattingUtils.parseNumericValue(run.blackHoleDamage || run.black_hole_damage) },
            { label: 'Smart Missile', value: FormattingUtils.parseNumericValue(run.smartMissileDamage || run.smart_missile_damage) },
            { label: 'Death Ray', value: FormattingUtils.parseNumericValue(run.deathRayDamage || run.death_ray_damage) },
            { label: 'Inner Land Mine', value: FormattingUtils.parseNumericValue(run.innerLandMineDamage || run.inner_land_mine_damage) },
            { label: 'Death Wave', value: FormattingUtils.parseNumericValue(run.deathWaveDamage || run.death_wave_damage) },
            { label: 'Swamp', value: FormattingUtils.parseNumericValue(run.swampDamage || run.swamp_damage) },
            { label: 'Rend Armor', value: FormattingUtils.parseNumericValue(run.rendArmorDamage || run.rend_armor_damage) }
        ];

        // Filter by selected damage types (including zero values)
        const damageTypes = allDamageTypes.filter(d =>
            this.chartOptions.selectedDamageTypes.has(d.label)
        );

        const ctx = canvas.getContext('2d');

        if (this.charts.damage) {
            this.charts.damage.destroy();
        }

        // High contrast damage source colors - each distinctly different
        const colors = [
            '#FFD700',  // Projectiles - Bright Gold
            '#FF1744',  // Orb Damage - Bright Red
            '#00E676',  // Thorn Damage - Bright Green
            '#FF9100',  // Land Mine - Bright Orange
            '#E91E63',  // Chain Lightning - Pink
            '#9C27B0',  // Black Hole - Purple
            '#2196F3',  // Smart Missile - Blue
            '#FF5722',  // Death Ray - Deep Orange
            '#795548',  // Inner Land Mine - Brown
            '#607D8B',  // Death Wave - Blue Grey
            '#4CAF50',  // Swamp - Green
            '#FFC107'   // Rend Armor - Amber
        ];

        const chartConfig = {
            type: this.chartOptions.damageChartType,
            data: {
                labels: damageTypes.map(d => d.label),
                datasets: [{
                    label: 'Damage Dealt',
                    data: damageTypes.map(d => d.value),
                    backgroundColor: colors.slice(0, damageTypes.length),
                    borderWidth: this.chartOptions.damageChartType === 'bar' ? 0 : 2,
                    borderColor: '#1A1A3E',
                    borderRadius: this.chartOptions.damageChartType === 'bar' ? 8 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                },
                elements: {
                    arc: {
                        hoverBorderWidth: 4,
                        hoverBorderColor: '#FFD700'
                    },
                    bar: {
                        hoverBorderWidth: 2,
                        hoverBorderColor: '#FFD700'
                    }
                },
                plugins: {
                    legend: {
                        display: this.chartOptions.damageChartType !== 'bar',
                        position: 'bottom',
                        labels: { color: '#E6E6FA', padding: 10 }
                    },
                    title: {
                        display: true,
                        text: this.currentViewMode === 'selected'
                            ? `Run #${this.selectedRunId} - ${this.formatDate(run.timestamp)}`
                            : this.dataViewMode === 'latest' ? 'Latest Run' : 'All Runs Combined',
                        color: '#E6E6FA'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = FormattingUtils.formatNumber(context.raw || context.parsed || 0);
                                return `${label}: ${value}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFD700',
                        bodyColor: '#E6E6FA',
                        borderColor: '#FFD700',
                        borderWidth: 1,
                        displayColors: true
                    }
                }
            }
        };

        // Add scales based on chart type
        if (this.chartOptions.damageChartType === 'polarArea' || this.chartOptions.damageChartType === 'radar') {
            chartConfig.options.scales = {
                r: {
                    ticks: { color: '#B0B0C8', backdropColor: 'transparent' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        } else if (this.chartOptions.damageChartType === 'bar') {
            chartConfig.options.scales = {
                x: {
                    ticks: { color: '#B0B0C8' },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: '#B0B0C8',
                        callback: (value) => FormattingUtils.formatNumber(value)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        }

        this.charts.damage = new Chart(ctx, chartConfig);
    }

    renderEnemyBreakdown() {
        const canvas = document.getElementById('analyticsEnemyChart');
        if (!canvas || !this.filteredRuns.length) return;

        // Get the run to display - either selected or latest
        const run = this.currentViewMode === 'selected' && this.selectedRunId
            ? this.runs.find(r => r.id === this.selectedRunId)
            : this.filteredRuns[0];

        if (!run) return;

        // All possible enemy types including missing ones
        const allEnemyTypes = [
            { label: 'Basic', value: run.basic || run.basic_enemies || 0 },
            { label: 'Fast', value: run.fast || run.fast_enemies || 0 },
            { label: 'Tank', value: run.tank || run.tank_enemies || 0 },
            { label: 'Ranged', value: run.ranged || run.ranged_enemies || 0 },
            { label: 'Boss', value: run.boss || run.boss_enemies || 0 },
            { label: 'Protector', value: run.protector || run.protector_enemies || 0 },
            { label: 'Vampires', value: run.vampires || 0 },
            { label: 'Rays', value: run.rays || 0 },
            { label: 'Scatters', value: run.scatters || 0 },
            { label: 'Saboteurs', value: run.saboteurs || 0 },
            { label: 'Commanders', value: run.commanders || 0 },
            { label: 'Overcharges', value: run.overcharges || 0 }
        ];

        // Filter by selected enemy types (including zero values)
        const enemyTypes = allEnemyTypes.filter(e =>
            this.chartOptions.selectedEnemyTypes.has(e.label)
        );

        const ctx = canvas.getContext('2d');

        if (this.charts.enemy) {
            this.charts.enemy.destroy();
        }

        // High contrast enemy colors - distinct and easily distinguishable
        const colors = [
            '#4CAF50',  // Basic - Bright Green
            '#FF9800',  // Fast - Bright Orange
            '#F44336',  // Tank - Bright Red
            '#9C27B0',  // Ranged - Bright Purple
            '#FFD700',  // Boss - Gold (important, bright)
            '#00BCD4',  // Protector - Cyan
            '#E91E63',  // Vampires - Pink
            '#FF5722',  // Rays - Deep Orange
            '#673AB7',  // Scatters - Deep Purple
            '#795548',  // Saboteurs - Brown
            '#2196F3',  // Commanders - Blue
            '#FFEB3B'   // Overcharges - Bright Yellow
        ];

        const chartConfig = {
            type: this.chartOptions.enemyChartType,
            data: {
                labels: enemyTypes.map(e => e.label),
                datasets: [{
                    label: 'Enemies Defeated',
                    data: enemyTypes.map(e => e.value),
                    backgroundColor: colors.slice(0, enemyTypes.length),
                    borderWidth: 2,
                    borderColor: '#1A1A3E'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                },
                elements: {
                    arc: {
                        hoverBorderWidth: 4,
                        hoverBorderColor: '#FFD700'
                    },
                    bar: {
                        hoverBorderWidth: 2,
                        hoverBorderColor: '#FFD700'
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#E6E6FA', padding: 10 }
                    },
                    title: {
                        display: true,
                        text: this.currentViewMode === 'selected'
                            ? `Run #${this.selectedRunId} - ${this.formatDate(run.timestamp)}`
                            : this.dataViewMode === 'latest' ? 'Latest Run' : 'All Runs Combined',
                        color: '#E6E6FA'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = FormattingUtils.formatNumber(context.raw || context.parsed || 0);
                                return `${label}: ${value}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFD700',
                        bodyColor: '#E6E6FA',
                        borderColor: '#FFD700',
                        borderWidth: 1,
                        displayColors: true
                    }
                }
            }
        };

        // Add scales based on chart type
        if (this.chartOptions.enemyChartType === 'polarArea' || this.chartOptions.enemyChartType === 'radar') {
            chartConfig.options.scales = {
                r: {
                    ticks: { color: '#B0B0C8', backdropColor: 'transparent' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        } else if (this.chartOptions.enemyChartType === 'bar') {
            chartConfig.options.scales = {
                x: {
                    ticks: { color: '#B0B0C8' },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: '#B0B0C8',
                        callback: (value) => FormattingUtils.formatNumber(value)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            };
        }

        this.charts.enemy = new Chart(ctx, chartConfig);
    }

    renderRunsTable() {
        const tbody = document.getElementById('analyticsRunsTableBody');
        if (!tbody) return;

        if (!this.filteredRuns.length) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #B0B0C8;">No runs found</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredRuns.slice(0, 20).map(run => {
            // Show original damage value with suffix
            const damageDealt = run.damage_dealt || '0';
            console.log(`🔍 Table damage_dealt: "${damageDealt}" -> keeping original value`);

            return `
            <tr ${this.selectedRunId === run.id ? 'class="analytics-selected-run"' : ''}>
                <td>${this.formatDate(run.timestamp)}</td>
                <td>${this.getTierBadge(run.tier)}</td>
                <td>${FormattingUtils.formatNumber(run.wave || 0)}</td>
                <td><span style="color: #FF6B6B;">${run.killedBy || run.killed_by || 'Unknown'}</span></td>
                <td><strong style="color: #4CAF50;">${run.realTime || run.real_time || 'N/A'}</strong></td>
                <td><strong style="color: #FFD700;">${damageDealt}</strong></td>
                <td>${FormattingUtils.formatNumber(run.total_enemies || 0)}</td>
                <td><strong style="color: #4CAF50;">${FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(run.coinsEarned || run.coins_earned))}</strong></td>
                <td>
                    <select class="analytics-category-select" onchange="window.towerAnalytics.updateRunCategory('${run.id}', this.value)" style="background: rgba(0,0,0,0.3); color: #E6E6FA; border: 1px solid rgba(255,255,255,0.2); padding: 4px; border-radius: 4px; font-size: 11px;">
                        <option value="">None</option>
                        <option value="milestone" ${run.category === 'milestone' ? 'selected' : ''}>🏆 Milestone</option>
                        <option value="tournament" ${run.category === 'tournament' ? 'selected' : ''}>🎯 Tournament</option>
                        <option value="farm" ${run.category === 'farm' ? 'selected' : ''}>🌾 Farm</option>
                    </select>
                </td>
                <td>
                    <button class="analytics-view-btn" onclick="window.towerAnalytics.selectRun('${run.id}')" style="margin-right: 5px;">
                        📊 View
                    </button>
                    <button class="analytics-delete-btn" onclick="window.towerAnalytics.deleteRun('${run.id}')" style="background: linear-gradient(135deg, #ff4757, #ff3742); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                        🗑️ Delete
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    async loadSessions() {
        try {
            const response = await fetch(`${this.apiBase}/sessions`);
            const data = await response.json();

            if (data.success) {
                const select = document.getElementById('analyticsSessionFilter');
                if (select) {
                    select.innerHTML = '<option value="">All Sessions</option>' +
                        data.sessions.map(session =>
                            `<option value="${session.name}">${session.name}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    applyFilters() {
        const sessionFilter = document.getElementById('analyticsSessionFilter');
        const timeFilter = document.getElementById('analyticsTimeFilter');
        const categoryFilter = document.getElementById('analyticsCategoryFilter');

        this.filters.session = sessionFilter?.value || '';
        this.filters.timeRange = timeFilter?.value || 'all';
        this.filters.category = categoryFilter?.value || '';

        // If we're in 'latest' mode and not viewing a specific run, always show just the latest run
        if (this.dataViewMode === 'latest' && this.currentViewMode !== 'selected') {
            // Get the latest run after applying filters
            let baseRuns = this.runs.filter(run => {
                if (this.filters.session && run.session_name !== this.filters.session) {
                    return false;
                }

                if (this.filters.timeRange !== 'all') {
                    const runDate = new Date(run.timestamp);
                    const daysAgo = parseInt(this.filters.timeRange);
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

                    if (runDate < cutoffDate) {
                        return false;
                    }
                }

                if (this.filters.category && run.category !== this.filters.category) {
                    return false;
                }

                return true;
            });

            // Sort and take only the latest
            baseRuns.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            this.filteredRuns = baseRuns.length > 0 ? [baseRuns[0]] : [];
        } else {
            // Normal filtering for 'all' mode or selected run mode
            this.filteredRuns = this.runs.filter(run => {
                if (this.filters.session && run.session_name !== this.filters.session) {
                    return false;
                }

                if (this.filters.timeRange !== 'all') {
                    const runDate = new Date(run.timestamp);
                    const daysAgo = parseInt(this.filters.timeRange);
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

                    if (runDate < cutoffDate) {
                        return false;
                    }
                }

                if (this.filters.category && run.category !== this.filters.category) {
                    return false;
                }

                return true;
            });
        }

        this.renderCharts();
        this.renderRunsTable();

        // Update stats based on filtered runs
        const stats = this.calculateTowerStatsFromRuns();
        const totals = this.calculateTowerTotalsFromRuns();
        const rates = this.calculateTowerRatesFromRuns();
        this.renderStatsCards(stats, totals, rates);
    }

    updateProgressChart() {
        const metricFilter = document.getElementById('analyticsMetricFilter');
        this.filters.metric = metricFilter?.value || 'tier';
        this.renderProgressChart();
    }

    async uploadFile(input) {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('statsFile', file);

        try {
            this.showNotification('Uploading statistics...', 'info');

            const response = await fetch(`${this.apiBase}/upload-stats`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Statistics uploaded successfully!', 'success');
                await this.loadDashboard();
            } else {
                throw new Error(data.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification(error.message, 'error');
        }

        input.value = '';
    }

    // Calculate stats from Supabase tower runs data
    calculateTowerStatsFromRuns() {
        // Use filteredRuns to respect current view mode (latest vs all)
        const runsToAnalyze = this.filteredRuns && this.filteredRuns.length > 0 ? this.filteredRuns : this.runs;

        console.log(`🔍 STATS DEBUG - runs: ${this.runs.length}, filteredRuns: ${this.filteredRuns.length}, dataViewMode: ${this.dataViewMode}, currentViewMode: ${this.currentViewMode}`);
        console.log(`🔍 Using ${runsToAnalyze.length} runs for calculation`);

        if (!runsToAnalyze || runsToAnalyze.length === 0) {
            return { total_runs: 0, max_tier: 0, max_wave: 0, max_damage: 0 };
        }

        console.log(`📊 Calculating stats from ${runsToAnalyze.length} filtered runs`);

        // Debug damage values
        const damageValues = runsToAnalyze.map(r => {
            const damage = FormattingUtils.parseNumericValue(r.damage_dealt) || 0;
            console.log(`🔍 Run damage_dealt: "${r.damage_dealt}" parsed to: ${damage}`);
            return damage;
        });
        console.log(`🔍 All damage values:`, damageValues);
        const maxDamage = Math.max(...damageValues);
        console.log(`🔍 Max damage calculated: ${maxDamage}`);

        return {
            total_runs: runsToAnalyze.length,
            max_tier: Math.max(...runsToAnalyze.map(r => parseInt(r.tier) || 0)),
            max_wave: Math.max(...runsToAnalyze.map(r => parseInt(r.wave) || 0)),
            max_damage: maxDamage,
            avg_tier: runsToAnalyze.reduce((sum, run) => sum + (parseInt(run.tier) || 0), 0) / runsToAnalyze.length,
            avg_wave: runsToAnalyze.reduce((sum, run) => sum + (parseInt(run.wave) || 0), 0) / runsToAnalyze.length,
            total_enemies_killed: runsToAnalyze.reduce((sum, run) => sum + (parseInt(run.total_enemies) || 0), 0)
        };
    }

    calculateTowerTotalsFromRuns() {
        // Use filteredRuns to respect current view mode (latest vs all)
        const runsToAnalyze = this.filteredRuns && this.filteredRuns.length > 0 ? this.filteredRuns : this.runs;

        if (!runsToAnalyze || runsToAnalyze.length === 0) {
            return { total_coins: 0, total_cells: 0, total_reroll_shards: 0 };
        }

        return {
            total_coins: runsToAnalyze.reduce((sum, run) => sum + FormattingUtils.parseNumericValue(run.coinsEarned || run.coins_earned || 0), 0),
            total_cells: runsToAnalyze.reduce((sum, run) => sum + FormattingUtils.parseNumericValue(run.cellsEarned || run.cells_earned || 0), 0),
            total_reroll_shards: runsToAnalyze.reduce((sum, run) => sum + FormattingUtils.parseNumericValue(run.rerollShardsEarned || run.reroll_shards_earned || 0), 0),
            total_damage_taken: runsToAnalyze.reduce((sum, run) => sum + FormattingUtils.parseNumericValue(run.damage_taken || 0), 0)
        };
    }

    calculateTowerRatesFromRuns() {
        // Use filteredRuns to respect current view mode (latest vs all)
        const runsToAnalyze = this.filteredRuns && this.filteredRuns.length > 0 ? this.filteredRuns : this.runs;

        if (!runsToAnalyze || runsToAnalyze.length === 0) {
            return { coins_per_hour: 0, cells_per_hour: 0 };
        }

        // Debug the calculation
        console.log('🔍 Calculating rates from runs:', runsToAnalyze.length);

        // Calculate total real time in hours
        const totalRealTimeHours = runsToAnalyze.reduce((sum, run) => {
            const timeStr = run.realTime || run.real_time || run['Real Time'] || '0h 0m';
            const hours = this.parseGameTimeToHours(timeStr);
            console.log(`🔍 Run real_time: "${timeStr}" -> ${hours} hours`);
            return sum + hours;
        }, 0);

        // Calculate total coins and cells using proper parsing
        const totalCoins = runsToAnalyze.reduce((sum, run) => {
            const coinsStr = run.coinsEarned || run.coins_earned || run['Coins Earned'] || '0';
            const coins = FormattingUtils.parseNumericValue(coinsStr);
            console.log(`🔍 Run coins_earned: "${coinsStr}" -> ${coins}`);
            return sum + coins;
        }, 0);

        const totalCells = runsToAnalyze.reduce((sum, run) => {
            const cellsStr = run.cellsEarned || run.cells_earned || run['Cells Earned'] || '0';
            const cells = FormattingUtils.parseNumericValue(cellsStr);
            console.log(`🔍 Run cells_earned: "${cellsStr}" -> ${cells}`);
            return sum + cells;
        }, 0);

        const totalWaves = runsToAnalyze.reduce((sum, run) => sum + (parseInt(run.wave) || 0), 0);

        console.log(`🔍 Totals: ${totalCoins} coins, ${totalCells} cells, ${totalRealTimeHours} hours, ${totalWaves} waves`);

        if (totalRealTimeHours === 0) {
            return { coins_per_hour: 0, cells_per_hour: 0, coins_per_wave: 0 };
        }

        const rates = {
            coins_per_hour: totalCoins / totalRealTimeHours,
            cells_per_hour: totalCells / totalRealTimeHours,
            coins_per_wave: totalWaves > 0 ? totalCoins / totalWaves : 0
        };

        console.log(`🔍 Calculated rates:`, rates);
        return rates;
    }

    parseTimeToMinutes(timeStr) {
        if (!timeStr) return 0;

        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return minutes + (seconds / 60);
        }

        return 0;
    }

    parseGameTimeToHours(timeInput) {
        if (!timeInput) return 0;

        // If it's already a number (seconds), convert to hours
        if (typeof timeInput === 'number') {
            return timeInput / 3600; // seconds to hours
        }

        // If it's a string, parse formats like "2d 6h 29m 19s" or "11h 8m 23s"
        const timeStr = timeInput.toString();
        let totalHours = 0;

        const dayMatch = timeStr.match(/(\d+)d/);
        const hourMatch = timeStr.match(/(\d+)h/);
        const minuteMatch = timeStr.match(/(\d+)m/);
        const secondMatch = timeStr.match(/(\d+)s/);

        if (dayMatch) totalHours += parseInt(dayMatch[1]) * 24;
        if (hourMatch) totalHours += parseInt(hourMatch[1]);
        if (minuteMatch) totalHours += parseInt(minuteMatch[1]) / 60;
        if (secondMatch) totalHours += parseInt(secondMatch[1]) / 3600;

        return totalHours;
    }

    // Utility methods
    formatNumber(num) {
        if (typeof num === 'string' && /[KMBTQSNO]$/.test(num)) return num;

        num = FormattingUtils.parseNumericValue(num);

        if (num >= 1e30) return (num / 1e30).toFixed(2) + 'N';
        if (num >= 1e27) return (num / 1e27).toFixed(2) + 'O';
        if (num >= 1e24) return (num / 1e24).toFixed(2) + 'S';
        if (num >= 1e21) return (num / 1e21).toFixed(2) + 's';
        if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Q';
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'q';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toString();
    }

    parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        const str = value.toString().replace(/[,$]/g, '');
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

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    getTierBadge(tier) {
        if (!tier) return '<span class="analytics-tier-badge analytics-tier-1-5">0</span>';

        let className = 'analytics-tier-1-5';
        if (tier >= 21) className = 'analytics-tier-21-plus';
        else if (tier >= 16) className = 'analytics-tier-16-20';
        else if (tier >= 11) className = 'analytics-tier-11-15';
        else if (tier >= 6) className = 'analytics-tier-6-10';

        return `<span class="analytics-tier-badge ${className}">${tier}</span>`;
    }

    getMetricLabel(metric) {
        const labels = {
            'tier': 'Tier',
            'wave': 'Wave',
            'damage_dealt': 'Damage Dealt',
            'total_enemies': 'Enemies Killed'
        };
        return labels[metric] || metric;
    }

    calculateDaysSince(dateString) {
        if (!dateString) return 0;
        const start = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateBotTotal(fieldName) {
        // Use filteredRuns for latest mode, all runs for aggregated mode
        const runsToAnalyze = this.dataViewMode === 'latest' && this.filteredRuns && this.filteredRuns.length > 0
            ? this.filteredRuns
            : this.runs;

        console.log(`🔍 calculateBotTotal(${fieldName}) using ${runsToAnalyze.length} runs (mode: ${this.dataViewMode})`);

        const result = runsToAnalyze.reduce((total, run) => {
            // Try multiple possible field name formats
            const camelCase = fieldName.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
            const snakeCase = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

            const possibleValues = [
                run[fieldName],
                run[camelCase],
                run[snakeCase],
                run[fieldName.toLowerCase()],
                run[fieldName.replace(/_/g, ' ')],
                run[fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
                run[this.toTitleCase(fieldName.replace(/_/g, ' '))]
            ];

            // Find the first non-undefined, non-null value
            const value = possibleValues.find(v => v !== undefined && v !== null && v !== '') || 0;

            // Debug log for enemy types
            if (fieldName.includes('enemies') && value !== 0) {
                console.log(`🔍 Found ${fieldName}:`, value, 'from run:', run.id || 'unknown');
            }

            return total + FormattingUtils.parseNumericValue(value);
        }, 0);

        // Debug final result for enemy types
        if (fieldName.includes('enemies')) {
            console.log(`🔍 Final ${fieldName} total: ${result} (from ${runsToAnalyze.length} runs)`);
        }

        return result;
    }

    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    calculateBerserkMultiplier() {
        const multipliers = this.runs
            .map(run => {
                const value = run['Damage Gain From Berserk'] || run.damage_gain_berserk || run.damage_gain_from_berserk;
                if (typeof value === 'string' && value.startsWith('x')) {
                    return parseFloat(value.substring(1)) || 0;
                }
                return 0;
            })
            .filter(mult => mult > 0);

        if (multipliers.length === 0) return '0x';
        const avg = multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length;
        return `${avg.toFixed(1)}x`;
    }

    calculateCardAnalytics() {
        if (!this.runs || this.runs.length === 0) {
            return [];
        }

        // Analyze card usage from runs data
        const cardUsageStats = {};
        const totalRuns = this.runs.length;
        let runsWithCardData = 0;

        this.runs.forEach(run => {
            let cardsArray = [];

            // Handle different card data formats
            if (run.cards_used) {
                if (Array.isArray(run.cards_used)) {
                    cardsArray = run.cards_used;
                } else if (typeof run.cards_used === 'string') {
                    try {
                        cardsArray = JSON.parse(run.cards_used);
                    } catch (e) {
                        // If not JSON, treat as comma-separated list
                        cardsArray = run.cards_used.split(',').map(card => card.trim()).filter(card => card);
                    }
                }
            }

            if (cardsArray.length > 0) {
                runsWithCardData++;
                cardsArray.forEach(cardName => {
                    if (!cardUsageStats[cardName]) {
                        cardUsageStats[cardName] = { count: 0, successfulRuns: 0 };
                    }
                    cardUsageStats[cardName].count++;

                    // Count as successful if run reached certain criteria (customize as needed)
                    if (run.tier >= 5 || run.wave >= 100) {
                        cardUsageStats[cardName].successfulRuns++;
                    }
                });
            }
        });

        // Find most used cards
        const sortedCards = Object.entries(cardUsageStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);

        const cardAnalyticsCards = [
            { value: runsWithCardData, label: 'Runs with Card Data', icon: '🃏📊' },
            { value: Object.keys(cardUsageStats).length, label: 'Unique Cards Used', icon: '🎴' },
            { value: sortedCards.length > 0 ? `${Math.round((sortedCards[0][1].count / runsWithCardData) * 100)}%` : '0%', label: 'Most Used Card Rate', icon: '🏆🃏' }
        ];

        // Add top cards usage percentages
        sortedCards.forEach((card, index) => {
            const [cardName, stats] = card;
            const usagePercent = Math.round((stats.count / runsWithCardData) * 100);
            cardAnalyticsCards.push({
                value: `${usagePercent}%`,
                label: `${cardName} Usage`,
                icon: '🃏'
            });
        });

        return cardAnalyticsCards;
    }

    initializeDragAndDrop() {
        const statsGrid = document.getElementById('analyticsStatsGrid');
        if (!statsGrid) return;

        let draggedCard = null;

        statsGrid.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('analytics-stat-card')) {
                draggedCard = e.target;
                e.target.style.opacity = '0.5';
            }
        });

        statsGrid.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('analytics-stat-card')) {
                e.target.style.opacity = '1';
                draggedCard = null;
            }
        });

        statsGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        statsGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetCard = e.target.closest('.analytics-stat-card');

            if (draggedCard && targetCard && targetCard !== draggedCard) {
                // Get the parent container
                const container = targetCard.parentNode;

                // Get the bounding rect to determine drop position
                const targetRect = targetCard.getBoundingClientRect();
                const dropY = e.clientY;

                // Insert the dragged card before or after the target
                if (dropY < targetRect.top + targetRect.height / 2) {
                    container.insertBefore(draggedCard, targetCard);
                } else {
                    container.insertBefore(draggedCard, targetCard.nextSibling);
                }

                // Update the data-card-id attributes to reflect new positions
                const cards = container.querySelectorAll('.analytics-stat-card');
                cards.forEach((card, index) => {
                    card.dataset.cardId = index;
                });
            }
        });
    }

    toggleCard(cardIndex) {
        if (!this.hiddenCards) this.hiddenCards = new Set();

        const originalIndex = this.getOriginalCardIndex(cardIndex);

        if (this.hiddenCards.has(originalIndex)) {
            this.hiddenCards.delete(originalIndex);
        } else {
            this.hiddenCards.add(originalIndex);
        }

        // Show/hide restore button
        this.updateRestoreButton();

        // Re-render without hidden cards
        this.renderStatsCards(this.lastStats, this.lastTotals, this.lastRates);
    }

    getOriginalCardIndex(visibleIndex) {
        const visibleCards = this.allCards.filter((card, index) =>
            !this.hiddenCards || !this.hiddenCards.has(index)
        );
        const targetCard = visibleCards[visibleIndex];
        return this.allCards.indexOf(targetCard);
    }

    restoreHiddenCards() {
        this.hiddenCards = new Set();
        this.updateRestoreButton();
        this.renderStatsCards(this.lastStats, this.lastTotals, this.lastRates);
    }

    updateRestoreButton() {
        const btn = document.getElementById('restoreCardsBtn');
        if (btn) {
            btn.style.display = (this.hiddenCards && this.hiddenCards.size > 0) ? 'block' : 'none';
        }
    }

    // Apply preset filter to stats
    applyPreset(presetKey) {
        console.log(`🎯 Applying preset: ${presetKey}`);
        this.currentPreset = presetKey;

        // Save preference
        localStorage.setItem('towerAnalyticsPreset', presetKey);

        // Re-render stats with preset
        if (this.lastStats && this.lastTotals && this.lastRates) {
            this.renderStatsCards(this.lastStats, this.lastTotals, this.lastRates);
        }

        this.showNotification(`Applied ${this.presets[presetKey].name} preset`, 'success');
    }

    // Get cards based on current preset
    getPresetCards(allCards) {
        const preset = this.presets[this.currentPreset];

        if (!preset || preset.stats === null) {
            return allCards; // Show all cards
        }

        // Create a mapping of card labels to indices for filtering
        const cardMap = new Map();
        allCards.forEach((card, index) => {
            const key = this.getLabelKey(card.label);
            cardMap.set(key, index);
        });

        // Filter cards based on preset
        const filteredCards = [];
        preset.stats.forEach(statKey => {
            const cardIndex = cardMap.get(statKey);
            if (cardIndex !== undefined) {
                filteredCards.push(allCards[cardIndex]);
            }
        });

        return filteredCards;
    }

    // Convert display labels to preset keys
    getLabelKey(label) {
        const labelMap = {
            'Total Runs': 'total_runs',
            'Highest Tier': 'max_tier',
            'Highest Wave': 'max_wave',
            'Max Damage': 'max_damage',
            'Total Damage': 'total_damage',
            'Average Tier': 'avg_tier',
            'Average Wave': 'avg_wave',
            'Enemies Defeated': 'enemies_killed',
            'Total Coins': 'coins_earned',
            'Waves Skipped': 'waves_skipped',
            'Total Cells': 'game_time',
            'Coins/Hour': 'efficiency_rating',
            'Basic Enemies': 'enemy_types',
            'Death Ray Damage': 'death_causes',
            'Orb Damage': 'orb_damage',
            'Projectiles Damage': 'projectile_damage',
            'Reroll Shards Earned': 'tier_improvement',
            'Damage Sources': 'damage_sources'
        };
        return labelMap[label] || label.toLowerCase().replace(/\s+/g, '_');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `analytics-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.getElementById('towerAnalytics');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'analytics-error';
            errorDiv.textContent = message;
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    // New methods for chart controls
    changeEnemyChartType(type) {
        this.chartOptions.enemyChartType = type;
        this.renderEnemyBreakdown();
    }

    changeDamageChartType(type) {
        this.chartOptions.damageChartType = type;
        this.renderDamageBreakdown();
    }

    toggleEnemyType(type) {
        if (this.chartOptions.selectedEnemyTypes.has(type)) {
            this.chartOptions.selectedEnemyTypes.delete(type);
        } else {
            this.chartOptions.selectedEnemyTypes.add(type);
        }
        this.renderEnemyBreakdown();
    }

    toggleDamageType(type) {
        if (this.chartOptions.selectedDamageTypes.has(type)) {
            this.chartOptions.selectedDamageTypes.delete(type);
        } else {
            this.chartOptions.selectedDamageTypes.add(type);
        }
        this.renderDamageBreakdown();
    }

    // Check for achievements based on current stats
    checkAchievements(stats, totals) {
        if (!window.towerAchievements) return;

        // Check cash milestones
        if (stats.max_coins) {
            window.towerAchievements.onCashMilestone(stats.max_coins);
        }

        // Check tier achievements
        if (stats.max_tier) {
            window.towerAchievements.onTierComplete(stats.max_tier);
        }

        // Check wave achievements
        if (stats.max_wave) {
            window.towerAchievements.onWaveReached(stats.max_wave);
        }

        console.log('🏆 Checked achievements for stats:', {
            maxTier: stats.max_tier,
            maxWave: stats.max_wave,
            maxCoins: stats.max_coins
        });
    }

    selectRun(runId) {
        this.selectedRunId = runId;
        this.currentViewMode = 'selected';

        // Filter to show only this run
        this.filteredRuns = this.runs.filter(run => run.id === runId);

        // Update displays to show only this run's data
        this.renderRunsTable();
        this.renderCharts();

        // Calculate stats for this single run
        const stats = this.calculateTowerStatsFromRuns();
        const totals = this.calculateTowerTotalsFromRuns();
        const rates = this.calculateTowerRatesFromRuns();
        this.renderStatsCards(stats, totals, rates);

        this.showNotification(`Viewing run: Tier ${this.filteredRuns[0]?.tier} Wave ${this.filteredRuns[0]?.wave}`, 'info');
    }

    changeViewMode(mode) {
        this.dataViewMode = mode;

        if (mode === 'latest') {
            // Show only the latest run
            this.currentViewMode = 'latest';
            this.selectedRunId = null;
            if (this.runs.length > 0) {
                const sortedRuns = [...this.runs].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                this.filteredRuns = [sortedRuns[0]];
            }
        } else if (mode === 'all') {
            // Show all runs combined
            this.currentViewMode = 'all';
            this.selectedRunId = null;
            this.filteredRuns = [...this.runs].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }

        // Update all displays
        this.renderRunsTable();
        this.renderCharts();
        const stats = this.calculateTowerStatsFromRuns();
        const totals = this.calculateTowerTotalsFromRuns();
        const rates = this.calculateTowerRatesFromRuns();
        this.renderStatsCards(stats, totals, rates);

        console.log(`📊 View mode changed to: ${mode}`);
        this.showNotification(`View mode: ${mode === 'latest' ? 'Latest Run Only' : 'All Runs Combined'}`, 'info');
    }

    viewLatestRun() {
        this.currentViewMode = 'latest';
        this.selectedRunId = null;
        this.renderCharts();
    }

    async updateRunCategory(runId, category) {
        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}/category`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category })
            });

            const data = await response.json();

            if (data.success) {
                // Update the run in our local data
                const run = this.runs.find(r => r.id === runId);
                if (run) {
                    run.category = category;
                }

                // Also update filtered runs
                const filteredRun = this.filteredRuns.find(r => r.id === runId);
                if (filteredRun) {
                    filteredRun.category = category;
                }

                this.showNotification(`Run category updated to ${category || 'None'}`, 'success');

                // Refresh filters and stats to reflect the change
                this.applyFilters();
            } else {
                this.showNotification(data.error || 'Failed to update run category', 'error');
            }
        } catch (error) {
            console.error('Error updating run category:', error);
            this.showNotification('Failed to update run category', 'error');
        }
    }

    async deleteRun(runId) {
        if (!confirm('Are you sure you want to delete this run? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Remove the run from our local data
                this.runs = this.runs.filter(r => r.id !== runId);
                this.filteredRuns = this.filteredRuns.filter(r => r.id !== runId);

                // If this was the selected run, clear selection
                if (this.selectedRunId === runId) {
                    this.selectedRunId = null;
                    this.currentViewMode = 'latest';
                }

                this.showNotification('Run deleted successfully', 'success');

                // Refresh the display
                this.renderRunsTable();
                this.renderCharts();
                this.renderStatsCards(this.lastStats, this.lastTotals, this.lastRates);
            } else {
                this.showNotification(data.error || 'Failed to delete run', 'error');
            }
        } catch (error) {
            console.error('Error deleting run:', error);
            this.showNotification('Failed to delete run', 'error');
        }
    }
}

// Initialize Tower Analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('towerAnalytics')) {
        console.log('🔥 Initializing TowerAnalytics...');
        window.towerAnalytics = new TowerAnalytics();

        // Load dashboard data immediately
        window.towerAnalytics.loadDashboard();
        console.log('🔥 TowerAnalytics initialized and loadDashboard called');
    }
});
    // Category toggle methods
    getCategoryForLabel(label) {
        // Basic stats
        const basicLabels = ['Game Time', 'Real Time', 'Tier', 'Wave', 'Killed By', 'Average Tier', 'Average Wave', 'Latest Run', 'Total Runs', 'Tier Reached', 'Highest Tier', 'Wave Reached', 'Highest Wave'];
        if (basicLabels.includes(label)) return 'basic';

        // Combat stats
        const combatLabels = ['Damage Dealt', 'Damage Taken', 'Projectiles Damage', 'Projectiles Count', 'Rend Armor Damage', 'Max Damage Dealt'];
        if (combatLabels.includes(label)) return 'combat';

        // Damage types
        const damageLabels = ['Thorn Damage', 'Orb Damage', 'Land Mine Damage', 'Death Ray Damage', 'Smart Missile Damage', 'Chain Lightning Damage', 'Death Wave Damage', 'Swamp Damage', 'Black Hole Damage', 'Inner Land Mine Damage', 'Orb Hits', 'Land Mines Spawned', 'Destroyed by Orbs', 'Destroyed by Thorns', 'Destroyed by Death ray', 'Destroyed by Land Mine'];
        if (damageLabels.includes(label)) return 'damage';

        // Economy stats
        const economyLabels = ['Coins Earned', 'Cash Earned', 'Interest Earned', 'Total Coins', 'Coins/Hour', 'Coins/Wave', 'Cash from Golden Tower', 'Coins from Golden Tower', 'Coins from Blackhole', 'Coins from Spotlight', 'Coins from Orbs', 'Coins from Coin Upgrade', 'Coins from Coin Bonuses', 'Coins from Death Wave', 'Golden bot coins earned', 'Golden Bot Coins', 'Coins Stolen', 'Coins Fetched'];
        if (economyLabels.includes(label)) return 'economy';

        // Enemy stats
        const enemyLabels = ['Total Enemies', 'Basic', 'Fast', 'Tank', 'Ranged', 'Boss', 'Protector', 'Total Elites', 'Vampires', 'Rays', 'Scatters', 'Saboteurs', 'Commanders', 'Overcharges', 'Basic Enemies', 'Fast Enemies', 'Tank Enemies', 'Ranged Enemies', 'Boss Enemies', 'Protector Enemies', 'Enemies Defeated'];
        if (enemyLabels.includes(label)) return 'enemies';

        // Resources
        const resourceLabels = ['Gems', 'Cells Earned', 'Total Cells', 'Cells/Hour', 'Reroll Shards', 'Reroll Shards Earned', 'Reroll Shards/Hour', 'Cannon Shards', 'Armor Shards', 'Generator Shards', 'Core Shards', 'Common Modules', 'Rare Modules', 'Medals', 'Gem Blocks Tapped', 'Free Attack Upgrade', 'Free Defense Upgrade', 'Free Utility Upgrade', 'Waves Skipped'];
        if (resourceLabels.includes(label)) return 'resources';

        // Bots
        const botLabels = ['Flame bot damage', 'Flame Bot Damage', 'Thunder bot stuns', 'Thunder Bot Stuns', 'Golden bot coins earned', 'Guardian catches', 'Guardian Catches', 'Coins Fetched', 'Fetch Bot Reroll Shards'];
        if (botLabels.includes(label)) return 'bots';

        // Survivability
        const survivabilityLabels = ['Death Defy', 'Death Defy Uses', 'Lifesteal', 'Total Lifesteal', 'HP From Death Wave', 'HP from Death Wave', 'Recovery Packages', 'Damage Taken Wall', 'Damage Taken While Berserked', 'Damage While Berserked', 'Damage Gain From Berserk', 'Total Damage Taken', 'Wall Damage Taken', 'Berserked Damage', 'Avg Berserk Multiplier'];
        if (survivabilityLabels.includes(label)) return 'survivability';

        // Default to basic if no category matches
        return 'basic';
    }

    loadCategoryToggles() {
        const saved = localStorage.getItem('towerAnalyticsCategoryToggles');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse category toggles:', e);
            }
        }
        // Default: all categories enabled
        return {
            basic: true,
            combat: true,
            damage: true,
            economy: true,
            enemies: true,
            resources: true,
            bots: true,
            survivability: true
        };
    }

    saveCategoryToggles() {
        localStorage.setItem('towerAnalyticsCategoryToggles', JSON.stringify(this.categoryToggles));
    }

    toggleCategory(category) {
        // Toggle the category state
        this.categoryToggles[category] = !this.categoryToggles[category];

        // Update the button's active class and opacity
        const button = document.querySelector(\`button[data-category="\${category}"]\`);
        if (button) {
            if (isVisible) {
                button.classList.add('active');
                button.style.opacity = '1.0';
            } else {
                button.classList.remove('active');
                button.style.opacity = '0.5';
            }
        }

        // Toggle visibility of all cards with this category using CSS
        const cards = document.querySelectorAll(`[data-category="${category}"]`);
        cards.forEach(card => {
            card.style.display = isVisible ? '' : 'none';
        });

        // Save to localStorage
        this.saveCategoryToggles();
    }

    initializeCategoryButtons() {
        // Set initial button states based on saved toggles
        Object.keys(this.categoryToggles).forEach(category => {
            const button = document.querySelector(\`button[data-category="\${category}"]\`);
            const isVisible = this.categoryToggles[category];
            if (button) {
                if (isVisible) {
                    button.classList.add('active');
                    button.style.opacity = '1.0';
                } else {
                    button.classList.remove('active');
                    button.style.opacity = '0.5';
                }
            }
        });
            
            // Apply initial visibility to cards
            const cards = document.querySelectorAll(`[data-category="${category}"]`);
            cards.forEach(card => {
                card.style.display = isVisible ? '' : 'none';
            });
    }
