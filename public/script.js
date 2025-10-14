// Tower Game Statistics Dashboard
// Using new modular system
let dashboardController = null;

class TowerStatsManager {
    constructor() {
        this.sessions = [];
        this.currentSession = null;
        this.chart = null;
        this.activeFilter = 'all'; // Filter: 'current', 'last5', 'week', 'all'

        // New modular system available but not activated yet
        // Will be integrated in future update

        this.init();
    }

    init() {
        // Always run old init for now - keep dashboard working
        // REMOVED: this.loadStoredData(); - Now loading ONLY from Supabase API

        // One-time migration: Clear old localStorage
        if (localStorage.getItem('towerStats')) {
            console.log('🧹 Clearing old localStorage (migrating to Supabase-only)');
            localStorage.removeItem('towerStats');
            localStorage.removeItem('farmSessions');
        }

        this.setupEventListeners();
        this.initializeChart();
        this.updateTrendCards();
        this.updateHistoryList();
        this.updateDisplay();
        this.loadLatestDataFromAPI();

        // Log if new modular dashboard is available (for future migration)
        if (dashboardController) {
            console.log('ℹ️  New modular dashboard system loaded (not active yet)');
        }
    }

    async loadLatestDataFromAPI() {
        try {
            // Fetch latest stats from the API
            const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl('api/tower/stats') : '/api/tower/stats';
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();

                // Update dashboard with real data from API response
                const stats = data.stats || data; // Handle nested stats response

                const tierValue = document.getElementById('tier-value');
                if (tierValue) {
                    tierValue.textContent = stats.max_tier || '0';
                }

                const waveValue = document.getElementById('wave-value');
                if (waveValue) {
                    waveValue.textContent = FormattingUtils.formatNumber(stats.max_wave || 0);
                }

                const coinsValue = document.getElementById('coins-value');
                if (coinsValue) {
                    coinsValue.textContent = FormattingUtils.formatNumber(stats.total_coins || 0);
                }

                console.log('📊 Loaded real stats from API:', data);
            }

            // ALSO fetch runs from API for Recent Sessions
            await this.loadRunsFromAPI();

        } catch (error) {
            console.error('Failed to load data from API:', error);
        }
    }

    async loadRunsFromAPI() {
        try {
            console.log('📥 Loading runs from API for Recent Sessions...');
            console.log('🔐 Auth status:', {
                hasDiscordAuth: !!window.discordAuth,
                isAuthenticated: window.discordAuth?.isAuthenticated,
                hasUser: !!window.discordAuth?.user,
                discordId: window.discordAuth?.user?.user_metadata?.provider_id
            });

            // Use authenticated fetch if available
            const apiUrl = window.API_CONFIG ? window.API_CONFIG.getApiUrl('api/tower/runs?limit=10') : '/api/tower/runs?limit=10';
            const response = window.discordAuth?.authenticatedFetch
                ? await window.discordAuth.authenticatedFetch(apiUrl)
                : await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.runs && data.runs.length > 0) {
                    console.log(`✅ Loaded ${data.runs.length} runs from API`);

                    // Convert API runs to session format
                    const apiSessions = data.runs.map(run => {
                        // Parse raw_data if it's a string
                        let parsedRawData = run.raw_data;
                        if (typeof run.raw_data === 'string') {
                            try {
                                parsedRawData = JSON.parse(run.raw_data);
                            } catch (e) {
                                console.warn('Failed to parse raw_data:', e);
                            }
                        }

                        // Check if tournament: tier with "+" suffix or explicit flags
                        const tierHasPlus = typeof run.tier === 'string' && run.tier.includes('+');
                        const isTournament = tierHasPlus || run.is_tournament || parsedRawData?.isTournament || false;
                        console.log(`📊 Processing run: Tier ${run.tier}, Wave ${run.wave}, tierHasPlus: ${tierHasPlus}, isTournament:`, isTournament, 'raw_data:', parsedRawData);

                        // Helper function to extract clean time from corrupted field
                        const extractTime = (timeStr) => {
                            if (!timeStr) return timeStr;
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

                        // Extract and clean raw_data (use already parsed version)
                        const cleanRawData = parsedRawData || {};

                        // Clean time fields
                        if (cleanRawData.gameTime) cleanRawData.gameTime = extractTime(cleanRawData.gameTime);
                        if (cleanRawData.realTime) cleanRawData.realTime = extractTime(cleanRawData.realTime);
                        if (cleanRawData.game_time) cleanRawData.game_time = extractTime(cleanRawData.game_time);
                        if (cleanRawData.real_time) cleanRawData.real_time = extractTime(cleanRawData.real_time);

                        // Normalize all number formats in raw_data (European comma -> English period)
                        Object.keys(cleanRawData).forEach(key => {
                            if (typeof cleanRawData[key] === 'string') {
                                cleanRawData[key] = normalizeNumberFormat(cleanRawData[key]);
                            }
                        });

                        // Also normalize top-level run fields
                        const normalizeRunField = (field) => {
                            return typeof field === 'string' ? normalizeNumberFormat(field) : field;
                        };

                        // Extract all fields from raw_data for comprehensive stats
                        return {
                            sessionId: run.id,
                            timestamp: run.submitted_at || new Date().toISOString(),
                            tier: parseInt(run.tier) || 0,
                            wave: parseInt(run.wave) || 0,
                            coins: normalizeRunField(run.coins_earned) || normalizeRunField(cleanRawData?.coins) || '0',
                            damage: normalizeRunField(run.damage_dealt) || normalizeRunField(cleanRawData?.damage) || '0',
                            source: run.submission_source || 'api',
                            isDiscordSubmission: run.submission_source === 'discord',
                            isTournament: isTournament,
                            // Include ALL cleaned raw_data fields for comprehensive stats display
                            ...cleanRawData
                        };
                    });

                    // Use ONLY API sessions (no localStorage)
                    this.sessions = apiSessions;

                    // Set currentSession to the latest session if not already set
                    if (!this.currentSession && this.sessions.length > 0) {
                        this.currentSession = this.sessions[this.sessions.length - 1];
                        console.log('✅ Set currentSession to latest API run:', this.currentSession);
                    }

                    // Update the history list
                    this.updateHistoryList();

                    // Update all displays with the new data
                    this.updateDisplay();

                    // Notify other components (like Tower Analytics) that runs were loaded
                    window.dispatchEvent(new CustomEvent('runsUpdated'));

                    console.log('✅ Updated Recent Sessions with API runs');
                }
            }
        } catch (error) {
            console.error('Failed to load runs from API:', error);
        }
    }

    setupEventListeners() {
        // Menu item click handlers
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuClick(e);
            });
        });

        // Add session card click
        const addCard = document.querySelector('.add-card');
        if (addCard) {
            addCard.addEventListener('click', () => {
                this.openDataModal();
            });
        }

        // Modal controls
        const modal = document.getElementById('dataModal');
        const closeBtn = document.querySelector('.close');
        const importBtn = document.getElementById('importBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeDataModal();
            });
        }

        if (importBtn) {
            console.log('Import button found, adding event listener');
            importBtn.addEventListener('click', () => {
                console.log('Import button clicked');
                this.importGameData();
            });
        } else {
            console.error('Import button not found');
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDataModal();
            }
        });

        // Run filter
        const runFilter = document.getElementById('runFilter');
        if (runFilter) {
            runFilter.addEventListener('change', (e) => {
                this.activeFilter = e.target.value;
                // Use new modular system if available
                if (dashboardController) {
                    dashboardController.applyFilter(this.activeFilter);
                } else {
                    this.applyRunFilter();
                }
            });
        }

        // Responsive sidebar toggle
        this.setupResponsiveMenu();
    }

    setupResponsiveMenu() {
        if (window.innerWidth <= 1200) {
            const menuButton = document.querySelector('.menu');
            if (menuButton) {
                menuButton.addEventListener('click', () => {
                    document.querySelector('.sidebar').classList.toggle('open');
                });
            }
        }
    }

    handleMenuClick(e) {
        // Get menu text
        const menuText = e.currentTarget.querySelector('span').textContent;
        console.log('Menu clicked:', menuText);

        // Handle My Labs section
        if (menuText === 'My Labs') {
            this.showMyLabs();
            return;
        }

        // Handle navigation items using NavigationManager
        if (['Dashboard', 'Tower Analytics', 'Achievements', 'Tournaments', 'Content Hub'].includes(menuText)) {
            window.navigationManager.showSectionByMenuText(menuText);
            return;
        }

        // Handle other menu options that aren't navigation
        switch (menuText) {
            case 'Session History':
                this.showSessionHistory();
                break;
            case 'Import Data':
                this.openDataModal();
                break;
            case 'Settings':
                this.showSettings();
                break;
        }
    }

    showMyLabs() {
        // Hide all sections
        this.hideAllSections();

        // Show My Labs section
        const myLabs = document.getElementById('myLabs');
        if (myLabs) {
            myLabs.style.display = 'block';
        }

        // Update menu active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        const myLabsMenuItem = Array.from(document.querySelectorAll('.menu-item')).find(
            item => item.querySelector('span')?.textContent === 'My Labs'
        );
        if (myLabsMenuItem) {
            myLabsMenuItem.classList.add('active');
        }
    }

    showDashboard() {
        // Hide other sections
        this.hideAllSections();

        // Show dashboard
        const dashboard = document.querySelector('.dashboard-content');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
    }

    showTowerAnalytics() {
        // Show Tower Analytics dashboard
        console.log('Showing Tower Analytics');
        this.hideAllSections();

        // Show the Tower Analytics section
        const towerAnalytics = document.getElementById('towerAnalytics');
        if (towerAnalytics) {
            towerAnalytics.style.display = 'block';

            // Initialize or refresh the Tower Analytics if needed
            if (window.towerAnalytics) {
                window.towerAnalytics.showSection();
            }

            // Also ensure modules are initialized for analytics
            if (window.uniqueModulesManager) {
                console.log('🔮 Manually triggering module initialization for analytics');
                setTimeout(() => {
                    window.uniqueModulesManager.showAnalyticsSection();
                }, 200);
            }

            // Also trigger direct injection as backup
            if (window.injectModulesDirectly) {
                console.log('🔮 Triggering direct module injection');
                // Immediate injection
                window.injectModulesDirectly();
                // Backup injections
                setTimeout(() => {
                    window.injectModulesDirectly();
                }, 50);
                setTimeout(() => {
                    window.injectModulesDirectly();
                }, 150);
            }
        }
    }

    showSessionHistory() {
        // Implementation for session history view
        console.log('Showing session history');
        this.hideAllSections();
        // Add session history view implementation
    }

    showContentHub() {
        // Hide other sections
        this.hideAllSections();

        // Initialize and show Content Hub
        if (!window.contentHubInstance) {
            if (typeof ContentHub !== 'undefined') {
                window.contentHubInstance = new ContentHub();
                console.log('✅ Content Hub instance created from navigation');
            } else {
                console.error('❌ ContentHub class not available');
                return;
            }
        }
        window.contentHubInstance.showContentHub();
    }

    showTournaments() {
        // Hide other sections
        this.hideAllSections();

        // Initialize and show Tournaments
        if (!window.tournamentsInstance) {
            window.tournamentsInstance = new TournamentsManager();
        }
        window.tournamentsInstance.showSection();
    }

    showSettings() {
        // Implementation for settings view
        console.log('Showing settings');
        this.hideAllSections();
        // Add settings view implementation
    }

    hideAllSections() {
        // Hide all main sections
        const dashboard = document.querySelector('.dashboard-content');
        const contentHub = document.getElementById('contentHub');
        const towerAnalytics = document.getElementById('towerAnalytics');
        const tournaments = document.getElementById('tournaments');
        const myLabs = document.getElementById('myLabs');

        if (dashboard) dashboard.style.display = 'none';
        if (contentHub) contentHub.style.display = 'none';
        if (towerAnalytics) towerAnalytics.style.display = 'none';
        if (tournaments) tournaments.style.display = 'none';
        if (myLabs) myLabs.style.display = 'none';

        // Hide Tower Analytics if it exists
        if (window.towerAnalytics) {
            window.towerAnalytics.hideSection();
        }

        // Hide Tournaments if it exists
        if (window.tournamentsInstance) {
            window.tournamentsInstance.hideSection();
        }
    }

    openDataModal() {
        console.log('Opening data modal...');
        const modal = document.getElementById('dataModal');
        if (modal) {
            modal.style.display = 'block';
            const input = document.getElementById('gameDataInput');
            if (input) {
                input.focus();
            } else {
                console.error('gameDataInput element not found');
            }

            // Initialize preset selector
            this.initializePresetSelector();

            // Initialize card selection interface
            this.initializeCardSelection();
        } else {
            console.error('dataModal element not found');
        }
    }

    closeDataModal() {
        const modal = document.getElementById('dataModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('gameDataInput').value = '';
            // Clear card selection
            this.clearCardSelection();
        }
    }

    importGameData() {
        console.log('Import game data called...');
        const input = document.getElementById('gameDataInput');
        if (!input) {
            console.error('gameDataInput not found');
            alert('Error: Input field not found.');
            return;
        }

        const data = input.value.trim();
        console.log('Data length:', data.length);

        if (!data) {
            alert('Please paste your game statistics data.');
            return;
        }

        try {
            console.log('Parsing game stats...');
            const parsedData = GameDataParser.parseGameStats(data);
            console.log('Parsed data:', parsedData);

            // Detect tournament runs based on tier having "+" suffix
            if (parsedData.tier && typeof parsedData.tier === 'number') {
                // Check if original tier string had "+" (already parsed to number)
                const tierMatch = data.match(/Tier[:\s]+(\d+\+?)/i);
                if (tierMatch && tierMatch[1].includes('+')) {
                    parsedData.isTournament = true;
                    console.log('🏆 Detected tournament run from tier:', tierMatch[1]);
                }
            }

            // Add selected cards to parsed data
            const selectedCards = this.getSelectedCards();
            if (selectedCards.length > 0) {
                parsedData.cards_used = selectedCards;
                console.log('Added selected cards:', selectedCards);
            }

            // Add active modules to parsed data
            if (window.uniqueModulesManager) {
                const activeModules = window.uniqueModulesManager.getActiveModules();
                if (activeModules.length > 0) {
                    parsedData.modules_used = activeModules.map(m => ({
                        key: m.key,
                        name: m.name,
                        category: m.category
                    }));
                    console.log('Added active modules:', parsedData.modules_used);
                }
            }

            // Add preset info if one was used
            if (window.presetManager && window.presetManager.currentPreset) {
                parsedData.preset_used = window.presetManager.currentPreset;
                console.log('Added preset:', parsedData.preset_used);
            }

            console.log('Adding session...');
            this.addSession(parsedData);
            console.log('Session added successfully');

            console.log('Updating display...');
            this.updateDisplay();
            console.log('Display updated');

            console.log('Closing modal...');
            this.closeDataModal();
            console.log('Modal closed');

            console.log('Showing success message...');
            this.showSuccessMessage('Game data imported successfully!');

            // Refresh Tower Analytics if it exists
            if (window.towerAnalytics && typeof window.towerAnalytics.refreshData === 'function') {
                console.log('Refreshing Tower Analytics...');
                window.towerAnalytics.refreshData();
            }

            // Trigger achievement checks
            if (window.towerAchievements && typeof window.towerAchievements.onRunUploaded === 'function') {
                console.log('🏆 Checking achievements for uploaded run...');
                window.towerAchievements.onRunUploaded(parsedData);
            }

            console.log('Import completed successfully');
        } catch (error) {
            console.error('Error parsing game data:', error);
            alert('Error parsing game data: ' + error.message + '\n\nPlease check the format and try again.');
        }
    }

    parseGameStats(statsText) {
        console.log('Parsing stats text:', statsText.substring(0, 200) + '...');

        const stats = {
            timestamp: new Date().toISOString(),
            sessionId: `session_${Date.now()}`
        };

        const lines = statsText.split('\n');
        const fieldMappings = {
            'Game Time': 'gameTime',
            'Real Time': 'realTime',
            'Tier': 'tier',
            'Wave': 'wave',
            'Killed By': 'killedBy',
            'Coins Earned': 'coinsEarned',
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
            'Damage Dealt': 'damageDealt',
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
            'Basic': 'basic',
            'Fast': 'fast',
            'Tank': 'tank',
            'Ranged': 'ranged',
            'Boss': 'boss',
            'Protector': 'protector',
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

        // Process each line
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Split on tab or multiple spaces to separate field name from value
            let parts = line.split('\t');
            if (parts.length < 2) {
                parts = line.split(/\s{2,}/);
            }
            if (parts.length < 2) return;

            const fieldName = parts[0].trim();
            const fieldValue = parts[1].trim();

            console.log(`Parsing field: "${fieldName}" = "${fieldValue}"`);

            if (fieldMappings[fieldName]) {
                const statKey = fieldMappings[fieldName];

                // Store the value - we'll keep most as strings since the display handles formatting
                stats[statKey] = fieldValue;
            }
        });

        return stats;
    }

    async addSession(sessionData) {
        console.log('addSession called with data:', sessionData);

        // Add timestamp if missing
        if (!sessionData.timestamp) {
            sessionData.timestamp = new Date().toISOString();
        }

        // Save to API (database) if authenticated
        if (window.discordAuth?.authenticatedFetch) {
            try {
                console.log('💾 Saving run to database...');
                console.log('📦 Session data being sent:', {
                    tier: sessionData.tier,
                    wave: sessionData.wave,
                    damage: sessionData.damage,
                    coins: sessionData.coins,
                    basicEnemies: sessionData.basicEnemies,
                    fastEnemies: sessionData.fastEnemies,
                    tankEnemies: sessionData.tankEnemies,
                    totalFields: Object.keys(sessionData).length
                });
                const response = await window.discordAuth.authenticatedFetch('/api/tower/runs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionData)
                });

                const data = await response.json();
                console.log('📥 API response:', data);

                if (data.success) {
                    console.log('✅ Run saved to database successfully!', data);
                    // Use the ID from the database
                    if (data.run && data.run.id) {
                        sessionData.id = data.run.id;
                    }
                } else {
                    console.error('❌ Failed to save run to database:', data.error);
                    console.error('❌ Full error response:', data);
                    alert('Warning: Run saved locally but failed to sync to database. It may not persist after logout.');
                }
            } catch (error) {
                console.error('❌ Error saving run to database:', error);
                console.error('❌ Error details:', error.message, error.stack);
                alert('Warning: Run saved locally but failed to sync to database. It may not persist after logout.');
            }
        } else {
            console.warn('⚠️ Not authenticated - run will only be saved locally');
        }

        // Also save to localStorage as backup
        console.log('Sessions before adding:', this.sessions.length);
        this.sessions.push(sessionData);
        console.log('Sessions after adding:', this.sessions.length);

        this.currentSession = sessionData;
        console.log('Current session set');

        this.saveToStorage();
        console.log('Data saved to local storage');
    }

    async deleteSession(session) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this run?')) {
            return;
        }

        console.log('Deleting session:', session);

        const sessionId = session.sessionId || session.timestamp;

        // Delete from API if this is an API session (sessionId can be number or UUID string)
        if (session.sessionId) {
            try {
                console.log(`🗑️ Deleting run ID ${session.sessionId} from Supabase...`);
                // Use authenticated fetch for DELETE request
                const response = window.discordAuth?.authenticatedFetch
                    ? await window.discordAuth.authenticatedFetch(`/api/tower/runs/${session.sessionId}`, {
                        method: 'DELETE'
                    })
                    : await fetch(`/api/tower/runs/${session.sessionId}`, {
                        method: 'DELETE'
                    });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('✅ Successfully deleted from Supabase:', data);
            } catch (error) {
                console.error('❌ Failed to delete from server:', error);
                const errorMsg = error.message.includes('fetch') || error.message.includes('Failed to fetch')
                    ? 'Cannot reach server. Check your internet connection and try again.'
                    : `Failed to delete run: ${error.message}`;
                alert(errorMsg);
                return;
            }
        }

        // Find and remove the session from local array
        const index = this.sessions.findIndex(s =>
            (s.sessionId === sessionId) || (s.timestamp === sessionId)
        );

        if (index > -1) {
            this.sessions.splice(index, 1);
            console.log('Session deleted. Remaining sessions:', this.sessions.length);

            // Update current session if we deleted it
            if (this.currentSession === session) {
                this.currentSession = this.sessions[this.sessions.length - 1] || null;
            }

            // Save and update display
            this.saveToStorage();
            this.updateDisplay();

            // Notify other components (like RunComparison) that runs were updated
            window.dispatchEvent(new CustomEvent('runsUpdated'));

            this.showSuccessMessage('Run deleted successfully!');
        } else {
            console.error('Session not found for deletion');
            alert('Could not find session to delete');
        }
    }

    updateDisplay() {
        console.log('updateDisplay called');
        console.log('Current session:', this.currentSession);
        console.log('Total sessions:', this.sessions.length);

        this.updateStatCards();
        console.log('Stat cards updated');

        this.updateChart();
        console.log('Chart updated');

        this.updateHistoryList();
        console.log('History list updated');

        this.updateTrendCards();
        console.log('Trend cards updated');
    }

    updateStatCards() {
        const session = this.currentSession || {};

        // Calculate hourly rates
        const timeStr = session.realTime || session.real_time || '0h 0m 0s';
        const hours = this.parseTimeToHours(timeStr);
        const coins = FormattingUtils.parseNumericValue(session.coinsEarned || session.coins_earned || session.coins || '0');
        const cells = FormattingUtils.parseNumericValue(session.cellsEarned || session.cells_earned || '0');
        const shards = FormattingUtils.parseNumericValue(session.rerollShardsEarned || session.reroll_shards_earned || '0');

        // Debug logging
        console.log('💰 Coins/Hour Calculation Debug:');
        console.log('  Time String:', timeStr);
        console.log('  Parsed Hours:', hours);
        console.log('  Total Coins:', FormattingUtils.formatNumber(coins));
        console.log('  Coins/Hour:', hours > 0 ? FormattingUtils.formatNumber(coins / hours) : '0');

        // Validate - coins per hour shouldn't exceed total coins
        const coinsPerHour = hours > 0 ? coins / hours : 0;
        const cellsPerHour = hours > 0 ? cells / hours : 0;
        const shardsPerHour = hours > 0 ? shards / hours : 0;

        // Sanity check - if hourly rate exceeds total, something is wrong
        if (coinsPerHour > coins) {
            console.error('⚠️ ERROR: Coins/hour exceeds total coins! Data inconsistency detected.');
            console.error('  This indicates time parsing error or data mismatch');
        }

        // Update Coins/Hour card
        const coinsHourValue = document.getElementById('coins-hour-value');
        if (coinsHourValue) {
            coinsHourValue.textContent = FormattingUtils.formatNumber(coinsPerHour);
        }

        // Update Cells/Hour card
        const cellsHourValue = document.getElementById('cells-hour-value');
        if (cellsHourValue) {
            cellsHourValue.textContent = FormattingUtils.formatNumber(cellsPerHour);
        }

        // Update Shards/Hour card
        const shardsHourValue = document.getElementById('shards-hour-value');
        if (shardsHourValue) {
            shardsHourValue.textContent = FormattingUtils.formatNumber(shardsPerHour);
        }

        // Update the "change" text to show the actual earned amounts
        const coinsHourChange = document.getElementById('coins-hour-change');
        if (coinsHourChange && session.coinsEarned) {
            coinsHourChange.textContent = `${session.coinsEarned || '0'} total`;
        }

        const cellsHourChange = document.getElementById('cells-hour-change');
        if (cellsHourChange && session.cellsEarned) {
            cellsHourChange.textContent = `${session.cellsEarned || session.cells_earned || '0'} total`;
        }

        const shardsHourChange = document.getElementById('shards-hour-change');
        if (shardsHourChange && session.rerollShardsEarned) {
            shardsHourChange.textContent = `${session.rerollShardsEarned || session.reroll_shards_earned || '0'} total`;
        }

        // Update comprehensive stats grid
        this.updateComprehensiveStats();
    }

    updateComprehensiveStats() {
        const grid = document.getElementById('comprehensive-stats-grid');
        if (!grid) return;

        const session = this.currentSession || {};

        // Debug: log the session to see what fields we actually have
        console.log('Current session data:', session);
        console.log('Session keys:', Object.keys(session));

        // Calculate hourly rates
        const hours = this.parseTimeToHours(session.realTime || session.real_time || '0h 0m 0s');
        const coinsPerHour = hours > 0 ? FormattingUtils.parseNumericValue(session.coinsEarned || session.coins_earned || session.coins || '0') / hours : 0;
        const cellsPerHour = hours > 0 ? FormattingUtils.parseNumericValue(session.cellsEarned || session.cells_earned || '0') / hours : 0;
        const rerollShardsPerHour = hours > 0 ? FormattingUtils.parseNumericValue(session.rerollShardsEarned || session.reroll_shards_earned || '0') / hours : 0;

        // Get field mappings for label lookup
        const fieldMappings = FieldMappings.getFieldMappings();
        const reverseMappings = Object.fromEntries(
            Object.entries(fieldMappings).map(([label, key]) => [key, label])
        );

        // Add computed fields to reverse mappings
        reverseMappings['coins_per_hour'] = 'Coins/Hour';
        reverseMappings['cells_per_hour'] = 'Cells/Hour';
        reverseMappings['reroll_shards_per_hour'] = 'Reroll Shards/Hour';

        // Clear existing content
        grid.innerHTML = '';

        // Use grouped fields with category headers
        const groups = FieldMappings.getGroupedDisplayFields();

        groups.forEach(group => {
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'stats-category-header';
            categoryHeader.textContent = group.category;
            grid.appendChild(categoryHeader);

            // Create cards for each field in this category
            group.fields.forEach(fieldKey => {
                const label = reverseMappings[fieldKey] || fieldKey;

                // Convert snake_case to camelCase for fallback lookup
                const camelCaseKey = fieldKey.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

                // Try snake_case first, then camelCase (for raw_data compatibility)
                let value = session[fieldKey] || session[camelCaseKey];

                // Handle computed hourly rates
                if (fieldKey === 'coins_per_hour') {
                    value = FormattingUtils.formatNumber(coinsPerHour);
                } else if (fieldKey === 'cells_per_hour') {
                    value = FormattingUtils.formatNumber(cellsPerHour);
                } else if (fieldKey === 'reroll_shards_per_hour') {
                    value = FormattingUtils.formatNumber(rerollShardsPerHour);
                }

                // Set default value if not found
                if (value === undefined || value === null) {
                    if (label.includes('Time')) {
                        value = '0h 0m 0s';
                    } else if (label.includes('Cash') || label.includes('$')) {
                        value = '$0';
                    } else if (label === 'Killed By') {
                        value = 'N/A';
                    } else if (label.includes('Berserk') && label.includes('Gain')) {
                        value = 'x0';
                    } else {
                        value = '0';
                    }
                }

                const card = document.createElement('div');
                card.className = 'comprehensive-stat-card';

                // Format the value if it's a number
                let displayValue = value;
                if (typeof displayValue === 'number' && displayValue !== 0) {
                    displayValue = FormattingUtils.formatNumber(displayValue);
                } else if (typeof displayValue === 'string' && displayValue !== 'N/A') {
                    // Skip formatting only for time notation or multipliers
                    const hasTimeFormat = /\d+[dhms]/.test(displayValue);
                    const hasMultiplier = /^x\d/.test(displayValue);

                    if (hasTimeFormat || hasMultiplier) {
                        // Keep time and multiplier formats as-is
                    } else {
                        // Parse and reformat all numeric values (including those with K, M, B, T suffixes)
                        // This ensures European format (comma decimals) gets converted to English (period decimals)
                        const numValue = FormattingUtils.parseNumericValue(displayValue);
                        if (numValue > 0) {
                            displayValue = FormattingUtils.formatNumber(numValue);
                        }
                    }
                }

                card.innerHTML = `
                    <span class="comprehensive-stat-label">${label}</span>
                    <span class="comprehensive-stat-value">${displayValue}</span>
                `;
                grid.appendChild(card);
            });
        });
    }

    updateTrendCards() {
        const trendGrid = document.getElementById('trend-grid');
        if (!trendGrid) return;

        // Clear existing content
        trendGrid.innerHTML = '';

        // Use currentSession if available, otherwise latest session
        const session = this.currentSession || (this.sessions && this.sessions.length > 0 ? this.sessions[this.sessions.length - 1] : null);

        if (!session) return;

        // Parse real time to calculate hourly rates
        const realTime = session.realTime || session.real_time || '0h 0m 0s';
        const hours = this.parseTimeToHours(realTime);

        // Get values (check both camelCase and snake_case)
        const coinsEarned = FormattingUtils.parseNumericValue(session.coinsEarned || session.coins_earned || session.coins || '0');
        const cellsEarned = FormattingUtils.parseNumericValue(session.cellsEarned || session.cells_earned || '0');
        const rerollShards = FormattingUtils.parseNumericValue(session.rerollShardsEarned || session.reroll_shards_earned || '0');

        // Calculate hourly rates
        const coinsPerHour = hours > 0 ? coinsEarned / hours : 0;
        const cellsPerHour = hours > 0 ? cellsEarned / hours : 0;
        const shardsPerHour = hours > 0 ? rerollShards / hours : 0;

        trendGrid.innerHTML = `
            <div class="trend-card">
                <div class="trend-info">
                    <div class="currency-pair">
                        <span class="base">🪙</span>
                        <div class="arrow-icon"></div>
                        <span class="quote">/HR</span>
                    </div>
                    <div class="trend-value">${FormattingUtils.formatNumber(coinsPerHour)}</div>
                    <div class="trend-change positive">
                        <span>Coins per Hour</span>
                    </div>
                </div>
                <div class="trend-chart coins-chart"></div>
            </div>

            <div class="trend-card">
                <div class="trend-info">
                    <div class="currency-pair">
                        <span class="base">🧬</span>
                        <div class="arrow-icon"></div>
                        <span class="quote">/HR</span>
                    </div>
                    <div class="trend-value">${FormattingUtils.formatNumber(cellsPerHour)}</div>
                    <div class="trend-change positive">
                        <span>Cells per Hour</span>
                    </div>
                </div>
                <div class="trend-chart cells-chart"></div>
            </div>

            <div class="trend-card">
                <div class="trend-info">
                    <div class="currency-pair">
                        <span class="base">🔄</span>
                        <div class="arrow-icon"></div>
                        <span class="quote">/HR</span>
                    </div>
                    <div class="trend-value">${FormattingUtils.formatNumber(shardsPerHour)}</div>
                    <div class="trend-change positive">
                        <span>Shards per Hour</span>
                    </div>
                </div>
                <div class="trend-chart shards-chart"></div>
            </div>
        `;
    }

    updateChart() {
        if (!this.chart) return;

        const chartData = this.prepareChartData();
        this.chart.data = chartData;
        this.chart.update();
    }

    prepareChartData() {
        // Use filtered sessions for the chart
        const filteredSessions = this.getFilteredSessions();
        const sessions = filteredSessions.slice(-10); // Last 10 of filtered sessions

        // Create meaningful labels with Tier and Wave
        const labels = sessions.map(s => {
            const tierBadge = s.isTournament ? '🏆 ' : '';
            return `${tierBadge}T${s.tier || 0} W${Math.floor((s.wave || 0) / 1000)}K`;
        });

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Wave (in thousands)',
                    data: sessions.map(s => (s.wave || 0) / 1000), // Waves in K
                    borderColor: '#31AFD6',
                    backgroundColor: 'rgba(49, 175, 214, 0.2)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Coins/Hour (in billions)',
                    data: sessions.map(s => {
                        const realTime = s.realTime || s.real_time || '0h 0m 0s';
                        const hours = this.parseTimeToHours(realTime);
                        const coins = FormattingUtils.parseNumericValue(s.coinsEarned || s.coins_earned || s.coins || '0');
                        return hours > 0 ? (coins / hours) / 1000000000 : 0; // Coins per hour in billions
                    }),
                    borderColor: '#F5A623',
                    backgroundColor: 'rgba(245, 166, 35, 0.2)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                },
                {
                    label: 'Cells/Hour',
                    data: sessions.map(s => {
                        const realTime = s.realTime || s.real_time || '0h 0m 0s';
                        const hours = this.parseTimeToHours(realTime);
                        const cells = FormattingUtils.parseNumericValue(s.cellsEarned || s.cells_earned || '0');
                        return hours > 0 ? cells / hours : 0;
                    }),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    initializeChart() {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;

        const chartData = this.prepareChartData();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#E0E0E0',
                            font: {
                                size: 13,
                                weight: '600',
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 18,
                            boxWidth: 10,
                            boxHeight: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.95)',
                        titleColor: '#26E2B3',
                        bodyColor: '#FFFFFF',
                        borderColor: '#26E2B3',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(89, 88, 141, 0.3)',
                            borderColor: 'rgba(89, 88, 141, 0.5)'
                        },
                        ticks: {
                            color: '#59588D',
                            font: {
                                size: 9
                            },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Wave (K)',
                            color: '#31AFD6',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(89, 88, 141, 0.3)',
                            borderColor: 'rgba(89, 88, 141, 0.5)'
                        },
                        ticks: {
                            color: '#31AFD6',
                            font: {
                                size: 10
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Efficiency (Coins/Hour, Cells/Hour)',
                            color: '#F5A623',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            color: '#F5A623',
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    applyRunFilter() {
        // Apply the selected filter and update all displays
        console.log(`Applying filter: ${this.activeFilter}`);

        // Update currentSession to the latest filtered session
        const filteredSessions = this.getFilteredSessions();
        if (filteredSessions.length > 0) {
            this.currentSession = filteredSessions[filteredSessions.length - 1];
            console.log('✅ Updated currentSession to latest filtered session:', this.currentSession);
        }

        this.updateDisplay();
    }

    getFilteredSessions() {
        if (!this.sessions || this.sessions.length === 0) {
            return [];
        }

        switch (this.activeFilter) {
            case 'current':
                // Return only the most recent session
                return this.sessions.slice(-1);

            case 'last5':
                // Return last 5 sessions
                return this.sessions.slice(-5);

            case 'week':
                // Return sessions from the last 7 days
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return this.sessions.filter(session => {
                    const sessionDate = new Date(session.timestamp);
                    return sessionDate >= weekAgo;
                });

            case 'tournaments':
                // Return only tournament runs (Tier with +)
                console.log('🏆 Filtering tournaments from', this.sessions.length, 'sessions');
                const tournamentSessions = this.sessions.filter(session => {
                    console.log(`  Session T${session.tier} W${session.wave}: isTournament=${session.isTournament}`);
                    return session.isTournament === true;
                });
                console.log('🏆 Found', tournamentSessions.length, 'tournament runs');
                return tournamentSessions;

            case 'regular':
                // Return only regular runs (non-tournament)
                console.log('📋 Filtering regular runs from', this.sessions.length, 'sessions');
                const regularSessions = this.sessions.filter(session => {
                    const isRegular = !session.isTournament;
                    console.log(`  Session T${session.tier} W${session.wave}: isTournament=${session.isTournament}, isRegular=${isRegular}`);
                    return isRegular;
                });
                console.log('📋 Found', regularSessions.length, 'regular runs');
                return regularSessions;

            case 'all':
            default:
                // Return all sessions
                return this.sessions;
        }
    }

    updateHistoryList() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        // Clear existing items
        historyList.innerHTML = '';

        // Get filtered sessions
        const filteredSessions = this.getFilteredSessions();
        const recentSessions = filteredSessions.slice(-10).reverse(); // Show last 10 of filtered

        if (recentSessions.length === 0) {
            historyList.innerHTML = '<div class="no-sessions">No sessions match this filter</div>';
            return;
        }

        recentSessions.forEach((session, index) => {
            const historyItem = this.createHistoryItem(session, index);
            historyList.appendChild(historyItem);
        });
    }

    createHistoryItem(session, index) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const timeAgo = this.getTimeAgo(session.timestamp);
        const changeValue = this.calculateSessionChange(session);
        const tournamentBadge = session.isTournament ? '<span class="tournament-badge" title="Tournament Run">🏆</span>' : '';
        const sessionId = session.id || session.sessionId || session.timestamp;

        item.innerHTML = `
            <input type="checkbox" class="run-compare-checkbox" data-session-id="${sessionId}" title="Select for comparison">
            <div class="history-icon tower-icon"></div>
            <div class="history-text">
                <span class="history-title">${tournamentBadge}T${session.tier || '?'} W${FormattingUtils.formatNumber(session.wave || 0)}</span>
                <div class="history-meta">
                    <span class="history-date">${timeAgo}</span>
                    <span class="history-change ${changeValue >= 0 ? 'positive' : 'negative'}">
                        ${changeValue >= 0 ? '+' : ''}${FormattingUtils.formatNumber(changeValue)}
                    </span>
                    <button class="load-run-btn" data-session-id="${sessionId}" title="Load stats into tiles">
                        📊
                    </button>
                    <button class="share-run-btn" data-run='${JSON.stringify(session)}' title="Share this run">
                        📤
                    </button>
                    <button class="delete-run-btn" data-session-id="${sessionId}" title="Delete this run">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        // Add event listener for load stats button
        const loadBtn = item.querySelector('.load-run-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadRunIntoTiles(session);
            });
        }

        // Add event listener for checkbox (prevent click event propagation)
        const checkbox = item.querySelector('.run-compare-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleRunComparison(session, e.target.checked);
            });
        }

        // Add event listener for clicking the session to select it
        item.addEventListener('click', (e) => {
            // Don't select if clicking on buttons or checkbox
            if (e.target.closest('.delete-run-btn') ||
                e.target.closest('.share-run-btn') ||
                e.target.closest('.load-run-btn') ||
                e.target.closest('.run-compare-checkbox')) {
                return;
            }
            this.selectSession(session);
        });

        // Add event listener for delete button
        const deleteBtn = item.querySelector('.delete-run-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(session);
            });
        }

        return item;
    }

    selectSession(session) {
        // Update current session and refresh stats display
        this.currentSession = session;
        this.updateComprehensiveStats();
        this.updateTrendCards(); // Also update hourly rates
        console.log('✅ Selected session:', session);
    }

    loadRunIntoTiles(session) {
        // Load this run's stats into the Tower Analytics tiles
        console.log('📊 Loading run into tiles:', session);

        // Notify Tower Analytics to display this specific run
        if (window.towerMigration?.analyticsManager) {
            window.towerMigration.analyticsManager.displayRunStats(session);
        } else if (window.TowerAnalytics) {
            // Fallback to old Tower Analytics
            window.TowerAnalytics.currentSession = session;
            window.TowerAnalytics.loadDashboard();
        }

        // Also update the current view
        this.currentSession = session;
        this.updateComprehensiveStats();
        this.updateTrendCards();
    }

    toggleRunComparison(session, isSelected) {
        // Initialize comparison array if it doesn't exist
        if (!this.comparisonRuns) {
            this.comparisonRuns = [];
        }

        if (isSelected) {
            // Add to comparison (max 5 runs)
            if (this.comparisonRuns.length >= 5) {
                alert('Maximum 5 runs can be selected for comparison');
                // Uncheck the checkbox
                const checkbox = document.querySelector(`.run-compare-checkbox[data-session-id="${session.id || session.sessionId || session.timestamp}"]`);
                if (checkbox) checkbox.checked = false;
                return;
            }
            this.comparisonRuns.push(session);
            console.log(`✅ Added run to comparison (${this.comparisonRuns.length}/5)`);
        } else {
            // Remove from comparison
            this.comparisonRuns = this.comparisonRuns.filter(r =>
                (r.id || r.sessionId || r.timestamp) !== (session.id || session.sessionId || session.timestamp)
            );
            console.log(`➖ Removed run from comparison (${this.comparisonRuns.length}/5)`);
        }

        // Update comparison UI
        this.updateComparisonUI();
    }

    updateComparisonUI() {
        // Show/hide comparison section based on selected runs
        const comparisonSection = document.getElementById('run-comparison-container');
        if (!comparisonSection) return;

        if (this.comparisonRuns && this.comparisonRuns.length > 0) {
            comparisonSection.style.display = 'block';

            // Update RunComparison with selected runs
            if (window.runComparison) {
                window.runComparison.selectedRuns = this.comparisonRuns;
                window.runComparison.visualizeSelectedRuns();
            }
        } else {
            comparisonSection.style.display = 'none';
        }
    }

    parseTimeToHours(timeString) {
        // Parse time string like "3h 17m 52s" or "3d 0h 20m 57s" into hours
        if (!timeString || typeof timeString !== 'string') return 0;

        let totalHours = 0;

        // Extract days, hours, minutes, seconds
        const daysMatch = timeString.match(/(\d+)d/);
        const hoursMatch = timeString.match(/(\d+)h/);
        const minutesMatch = timeString.match(/(\d+)m/);
        const secondsMatch = timeString.match(/(\d+)s/);

        if (daysMatch) totalHours += parseInt(daysMatch[1]) * 24;
        if (hoursMatch) totalHours += parseInt(hoursMatch[1]);
        if (minutesMatch) totalHours += parseInt(minutesMatch[1]) / 60;
        if (secondsMatch) totalHours += parseInt(secondsMatch[1]) / 3600;

        return totalHours;
    }

    calculateSessionChange(session) {
        // Simple change calculation based on wave progress
        const previousSession = this.sessions[this.sessions.indexOf(session) - 1];
        if (!previousSession) return session.wave || 0;

        return (session.wave || 0) - (previousSession.wave || 0);
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const sessionTime = new Date(timestamp);
        const diffMs = now - sessionTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays === 0) {
            if (diffHours === 0) return 'Just now';
            return `${diffHours}h ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return `${diffDays} days ago`;
        }
    }


    showSuccessMessage(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #50E3C2, #40DDFF);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    resetAllData() {
        console.log('🗑️ Resetting all data to zero...');

        // Clear all sessions
        this.sessions = [];
        this.currentSession = null;

        // Clear localStorage completely
        try {
            localStorage.clear();
            console.log('✅ localStorage cleared');
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }

        // Update the display
        this.updateDisplay();

        // Refresh Tower Analytics if it exists
        if (window.towerAnalytics && typeof window.towerAnalytics.refreshData === 'function') {
            console.log('🔄 Refreshing Tower Analytics...');
            window.towerAnalytics.refreshData();
        }

        // Show confirmation
        this.showSuccessMessage('All data has been reset to zero!');

        console.log('✅ Reset completed');
    }

    saveToStorage() {
        try {
            StorageManager.set('towerStats', this.sessions);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadStoredData() {
        try {
            this.sessions = StorageManager.get('towerStats', []);
            this.currentSession = this.sessions[this.sessions.length - 1] || null;

            // Debug logging
            console.log('Loaded sessions:', this.sessions.length);
            if (this.currentSession) {
                console.log('Current session keys:', Object.keys(this.currentSession));
                console.log('Sample values:', {
                    tier: this.currentSession.tier,
                    wave: this.currentSession.wave,
                    damageDealt: this.currentSession.damageDealt,
                    coinsEarned: this.currentSession.coinsEarned
                });
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.sessions = [];
            this.currentSession = null;
        }
    }

    // Card Selection Methods
    initializePresetSelector() {
        if (!window.presetManager) {
            console.warn('PresetManager not available');
            return;
        }

        const presetSelector = document.getElementById('presetSelector');
        const saveCurrentBtn = document.getElementById('saveCurrentPreset');
        const presetDescription = document.getElementById('presetDescription');

        if (!presetSelector) return;

        // Populate preset options
        const presetOptions = window.presetManager.getPresetOptions();

        // Clear existing options (except the first one)
        presetSelector.innerHTML = '<option value="">-- Select a preset --</option>';

        presetOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            optionElement.dataset.description = option.description;
            optionElement.dataset.custom = option.isCustom;
            presetSelector.appendChild(optionElement);
        });

        // Handle preset selection
        presetSelector.addEventListener('change', (e) => {
            const presetKey = e.target.value;
            if (presetKey) {
                const selectedOption = e.target.options[e.target.selectedIndex];
                if (presetDescription) {
                    presetDescription.textContent = selectedOption.dataset.description || '';
                }
                window.presetManager.applyPreset(presetKey);
                this.showSuccessMessage(`Preset "${selectedOption.textContent}" applied!`);
            } else {
                if (presetDescription) {
                    presetDescription.textContent = '';
                }
            }
        });

        // Handle save current preset
        if (saveCurrentBtn) {
            saveCurrentBtn.addEventListener('click', () => {
                const name = prompt('Enter a name for this preset:');
                if (name && name.trim()) {
                    const description = prompt('Enter a description (optional):');
                    const presetKey = window.presetManager.saveCurrentAsPreset(
                        name.trim(),
                        description?.trim() || ''
                    );
                    this.showSuccessMessage(`Preset "${name}" saved!`);

                    // Refresh the selector
                    this.initializePresetSelector();
                }
            });
        }
    }

    initializeCardSelection() {
        if (!window.cardsManager) {
            console.warn('CardsManager not available');
            return;
        }

        const cardGrid = document.getElementById('modalCardGrid');
        const clearBtn = document.getElementById('clearCardSelection');
        const selectAllBtn = document.getElementById('selectAllCards');

        if (!cardGrid) return;

        // Get card images from CardsManager
        const cardImages = window.cardsManager.cardImages;

        // Clear existing cards
        cardGrid.innerHTML = '';

        // Create card items
        cardImages.forEach((cardImage, index) => {
            const cardName = cardImage.replace(' Card.png', '').replace('.png', '');
            const cardItem = document.createElement('div');
            cardItem.className = 'modal-card-item';
            cardItem.dataset.cardName = cardName;

            cardItem.innerHTML = `
                <img src="assets/cards/${cardImage}" alt="${cardName}" onerror="this.style.display='none'">
                <div class="card-name">${cardName}</div>
            `;

            // Add click event listener
            cardItem.addEventListener('click', () => {
                this.toggleCardSelection(cardItem);
            });

            cardGrid.appendChild(cardItem);
        });

        // Setup control buttons
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearCardSelection();
            });
        }

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllCards();
            });
        }

        // Update count display
        this.updateCardCount();
    }

    toggleCardSelection(cardElement) {
        cardElement.classList.toggle('selected');
        this.updateCardCount();
    }

    clearCardSelection() {
        const cardGrid = document.getElementById('modalCardGrid');
        if (cardGrid) {
            const selectedCards = cardGrid.querySelectorAll('.modal-card-item.selected');
            selectedCards.forEach(card => card.classList.remove('selected'));
            this.updateCardCount();
        }
    }

    selectAllCards() {
        const cardGrid = document.getElementById('modalCardGrid');
        if (cardGrid) {
            const allCards = cardGrid.querySelectorAll('.modal-card-item');
            allCards.forEach(card => card.classList.add('selected'));
            this.updateCardCount();
        }
    }

    updateCardCount() {
        const countElement = document.getElementById('selectedCardCount');
        const cardGrid = document.getElementById('modalCardGrid');

        if (countElement && cardGrid) {
            const selectedCount = cardGrid.querySelectorAll('.modal-card-item.selected').length;
            countElement.textContent = `${selectedCount} cards selected`;
        }
    }

    getSelectedCards() {
        const cardGrid = document.getElementById('modalCardGrid');
        if (!cardGrid) return [];

        const selectedCards = cardGrid.querySelectorAll('.modal-card-item.selected');
        return Array.from(selectedCards).map(card => card.dataset.cardName);
    }
}

// CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.towerStats = new TowerStatsManager();

    // Initialize NavigationManager
    window.navigationManager.init();

    // Make reset function available globally for console access
    window.resetData = () => {
        if (confirm('Are you sure you want to reset ALL data to zero? This cannot be undone.')) {
            window.towerStats.resetAllData();
        }
    };

    console.log('🔧 Reset commands available:');
    console.log('• Type: resetData() in console');
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    if (window.towerStats && window.towerStats.chart) {
        window.towerStats.chart.resize();
    }
});

// Export for use in other scripts
window.TowerStatsManager = TowerStatsManager;