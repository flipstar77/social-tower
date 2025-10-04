// Unique Modules Management System
class UniqueModulesManager {
    constructor() {
        this.modulesGridElement = null;
        this.analyticsModulesGridElement = null;
        this.initialized = false;
        this.analyticsInitialized = false;
        this.activeModules = new Set();
        this.moduleCategories = ['cannons', 'armor', 'generators', 'cores'];

        // Module definitions organized by category
        this.moduleDefinitions = {
            cannons: {
                astralDeliverance: {
                    name: 'Astral Deliverance',
                    description: 'Bounce shot\'s range is increased by 3% of tower\'s total range. Each bounce increases the projectile\'s damage.',
                    category: 'cannons',
                    rarity: 'unique',
                    effects: {
                        bounceRangeMultiplier: 0.03,
                        bounceDamageIncrease: true
                    }
                },
                beingAnihilator: {
                    name: 'Being Anihilator',
                    description: 'When you super crit, your next [x] attacks are guaranteed super crits.',
                    category: 'cannons',
                    rarity: 'unique',
                    effects: {
                        guaranteedSuperCrits: 3
                    }
                },
                deathPenalty: {
                    name: 'Death Penalty',
                    description: 'Chance to mark an enemy for death when it spawns: the first hit destroys it.',
                    category: 'cannons',
                    rarity: 'unique',
                    effects: {
                        deathMarkChance: 0.15,
                        instantKillMarked: true
                    }
                },
                havocBringer: {
                    name: 'Havoc Bringer',
                    description: '[x]% chance for rend armor to instantly go to max.',
                    category: 'cannons',
                    rarity: 'unique',
                    effects: {
                        maxRendArmorChance: 0.25
                    }
                },
                shrinkRay: {
                    name: 'Shrink Ray',
                    description: 'Attacks have a 1% chance to apply a non-stacking effect that decreases the enemy\'s mass by [x]%.',
                    category: 'cannons',
                    rarity: 'unique',
                    effects: {
                        shrinkChance: 0.01,
                        massReduction: 0.30
                    }
                }
            },
            armor: {
                antiCubePortal: {
                    name: 'Anti-Cube Portal',
                    description: 'Enemies take [x]× damage for 7s after they are hit by a shockwave.',
                    category: 'armor',
                    rarity: 'unique',
                    effects: {
                        shockwaveDamageMultiplier: 2.5,
                        shockwaveDebuffDuration: 7000
                    }
                },
                negativeMassProjector: {
                    name: 'Negative Mass Projector',
                    description: 'If an orb doesn\'t kill the enemy, it applies a stacking debuff reducing its damage & speed by [x]% per hit, up to a max reduction of 50%.',
                    category: 'armor',
                    rarity: 'unique',
                    effects: {
                        orbDebuffReduction: 0.10,
                        maxDebuffReduction: 0.50
                    }
                },
                sharpFortitude: {
                    name: 'Sharp Fortitude',
                    description: 'Wall\'s health and regen are increased by x[x]. Enemies take +1% increased damage from wall thorns per subsequent hit.',
                    category: 'armor',
                    rarity: 'unique',
                    effects: {
                        wallHealthMultiplier: 3.0,
                        wallRegenMultiplier: 3.0,
                        thornDamageIncrease: 0.01
                    }
                },
                wormholeRedirector: {
                    name: 'Wormhole Redirector',
                    description: 'Health Regen can heal up to [x]% of Package Max Recovery.',
                    category: 'armor',
                    rarity: 'unique',
                    effects: {
                        packageMaxRecovery: 0.75
                    }
                },
                spaceDisplacer: {
                    name: 'Space Displacer',
                    description: 'Landmines have a [x]% chance to spawn as an Inner Land Mine (20 max) instead of a normal mine. These mines move around the tower.',
                    category: 'armor',
                    rarity: 'unique',
                    effects: {
                        innerLandMineChance: 0.30,
                        maxInnerLandMines: 20
                    }
                }
            },
            generators: {
                blackHoleDigestor: {
                    name: 'Black Hole Digestor',
                    description: 'Temporarily get [x]% extra Coins/Kill Bonus for each free upgrade you got on the current wave. (Free upgrades cannot increase Tower Range.)',
                    category: 'generators',
                    rarity: 'unique',
                    effects: {
                        coinBonusPerFreeUpgrade: 0.20
                    }
                },
                galaxyCompressor: {
                    name: 'Galaxy Compressor',
                    description: 'Collecting a recovery package reduces the cooldown of all Ultimate Weapons by [x] seconds.',
                    category: 'generators',
                    rarity: 'unique',
                    effects: {
                        ultimateCooldownReduction: 5
                    }
                },
                projectFunding: {
                    name: 'Project Funding',
                    description: 'Tower damage is multiplied by [x]% of the number of digits in your current cash.',
                    category: 'generators',
                    rarity: 'unique',
                    effects: {
                        damagePerDigit: 0.05
                    }
                },
                pulsarHarvester: {
                    name: 'Pulsar Harvester',
                    description: 'Each time a projectile hits an enemy, there is a [x]% chance that it will reduce the enemy\'s Health and Attack level by 1.',
                    category: 'generators',
                    rarity: 'unique',
                    effects: {
                        levelReductionChance: 0.08
                    }
                },
                singularityHarness: {
                    name: 'Singularity Harness',
                    description: 'Increase the range of each bot by +[x]m. Enemies hit by the Flame Bot receive double damage.',
                    category: 'generators',
                    rarity: 'unique',
                    effects: {
                        botRangeIncrease: 15,
                        flameBotDamageMultiplier: 2.0
                    }
                }
            },
            cores: {
                dimensionCore: {
                    name: 'Dimension Core',
                    description: 'Has a chance of hitting the initial target. Shock chance and multiplier are doubled. If shock is applied again to the same enemy, the shock multiplier adds up to a max stack of [x].',
                    category: 'cores',
                    rarity: 'unique',
                    effects: {
                        shockChanceMultiplier: 2.0,
                        shockDamageMultiplier: 2.0,
                        maxShockStacks: 5
                    }
                },
                harmonyConductor: {
                    name: 'Harmony Conductor',
                    description: '[x]% chance for poisoned enemies to miss-attack (bosses chance is halved).',
                    category: 'cores',
                    rarity: 'unique',
                    effects: {
                        poisonMissChance: 0.40,
                        bossMissChanceReduction: 0.5
                    }
                },
                magneticHook: {
                    name: 'Magnetic Hook',
                    description: 'Inner Land Mines are fired at bosses as they enter Tower Range. 25% of elites have Inner Land Mines fired at them as they enter Tower range.',
                    category: 'cores',
                    rarity: 'unique',
                    effects: {
                        bossLandMineTarget: true,
                        eliteLandMineChance: 0.25
                    }
                },
                multiverseNexus: {
                    name: 'Multiverse Nexus',
                    description: 'Death Wave, Golden Tower, and Black Hole ultimate weapons will always activate at the same time, but the cooldown will be the average of those plus/minus [x] seconds.',
                    category: 'cores',
                    rarity: 'unique',
                    effects: {
                        ultimateSync: true,
                        cooldownVariance: 10
                    }
                },
                omChip: {
                    name: 'Om Chip',
                    description: 'Spotlight will rotate to focus a boss. This effect can only happen again after [x] bosses.',
                    category: 'cores',
                    rarity: 'unique',
                    effects: {
                        spotlightBossTarget: true,
                        bossesUntilNext: 3
                    }
                }
            }
        };
    }

    // Initialize the modules system
    init() {
        if (this.initialized) return;

        console.log('🔮 Initializing UniqueModulesManager...');

        this.modulesGridElement = document.getElementById('uniqueModulesGrid');

        if (!this.modulesGridElement) {
            console.warn('🔮 Unique modules elements not found, skipping initialization');
            console.log('🔮 Available elements:', document.querySelectorAll('[id*="module"]'));
            return;
        }

        console.log('🔮 Found modulesGridElement:', this.modulesGridElement);

        this.setupEventListeners();
        this.renderAllModules();
        this.loadActiveModules();
        this.initialized = true;

        console.log('🔮 UniqueModulesManager initialized successfully');
        console.log('🔮 Total modules available:', this.getTotalModulesCount());

        // Add a global method for manual initialization
        window.debugModules = () => {
            console.log('🔮 Manual debug initialization');
            this.renderAllModules();
            if (this.analyticsModulesGridElement) {
                this.renderAnalyticsModules();
            }
        };
    }

    // Initialize analytics integration
    initAnalytics() {
        if (this.analyticsInitialized) return;

        console.log('🔮 Initializing analytics integration...');

        this.analyticsModulesGridElement = document.getElementById('analyticsModulesGrid');

        if (!this.analyticsModulesGridElement) {
            console.warn('🔮 Analytics modules elements not found, skipping analytics initialization');
            console.log('🔮 Available analytics elements:', document.querySelectorAll('[id*="analytics"]'));
            return;
        }

        console.log('🔮 Found analyticsModulesGridElement:', this.analyticsModulesGridElement);

        this.setupAnalyticsEventListeners();
        this.renderAnalyticsModules();
        this.loadActiveModules(); // Sync with existing active modules
        this.analyticsInitialized = true;

        console.log('🔮 UniqueModulesManager analytics integration initialized successfully');
        console.log('🔮 Analytics modules rendered:', this.analyticsModulesGridElement.children.length);
    }

    // Setup event listeners
    setupEventListeners() {
        // Category filter buttons
        document.querySelectorAll('.module-category-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
            });
        });

        // Clear all modules button
        const clearAllBtn = document.getElementById('clearAllModulesBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllModules();
            });
        }

        // Save modules configuration
        const saveConfigBtn = document.getElementById('saveModulesConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                this.saveConfiguration();
            });
        }

        // Load modules configuration
        const loadConfigBtn = document.getElementById('loadModulesConfigBtn');
        if (loadConfigBtn) {
            loadConfigBtn.addEventListener('click', () => {
                this.loadConfiguration();
            });
        }
    }

    // Setup analytics event listeners
    setupAnalyticsEventListeners() {
        // Analytics category filter buttons
        const analyticsContainer = document.querySelector('.analytics-modules-container');
        if (analyticsContainer) {
            analyticsContainer.querySelectorAll('.module-category-filter').forEach(button => {
                button.addEventListener('click', (e) => {
                    const category = e.target.dataset.category;
                    this.filterAnalyticsByCategory(category);
                });
            });
        }

        // Analytics action buttons
        const saveBtn = document.getElementById('saveModulesConfigBtnAnalytics');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveConfiguration();
            });
        }

        const loadBtn = document.getElementById('loadModulesConfigBtnAnalytics');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadConfiguration();
            });
        }

        const clearBtn = document.getElementById('clearAllModulesBtnAnalytics');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllModules();
            });
        }
    }

    // Render analytics modules
    renderAnalyticsModules() {
        console.log('🔮 renderAnalyticsModules called');
        console.log('🔮 analyticsModulesGridElement:', this.analyticsModulesGridElement);

        if (!this.analyticsModulesGridElement) {
            console.error('🔮 Cannot render - analyticsModulesGridElement is null');
            return;
        }

        // Clear existing modules
        this.analyticsModulesGridElement.innerHTML = '';
        console.log('🔮 Cleared existing content');

        let tileCount = 0;
        // Create a simplified grid for analytics
        try {
            Object.entries(this.moduleDefinitions).forEach(([categoryKey, modules]) => {
                console.log(`🔮 Processing category ${categoryKey}:`, modules);
                Object.entries(modules).forEach(([moduleKey, module]) => {
                    try {
                        const moduleTile = this.createAnalyticsModuleTile(moduleKey, module);
                        this.analyticsModulesGridElement.appendChild(moduleTile);
                        tileCount++;
                    } catch (tileError) {
                        console.error(`🔮 Error creating tile for ${moduleKey}:`, tileError);
                    }
                });
            });
        } catch (error) {
            console.error('🔮 Error in renderAnalyticsModules loop:', error);
        }

        console.log(`🔮 Rendered ${tileCount} tiles (${this.getTotalModulesCount()} modules) in analytics view`);
        console.log('🔮 Grid children count:', this.analyticsModulesGridElement.children.length);
    }

    // Create analytics module tile (more compact)
    createAnalyticsModuleTile(moduleKey, module) {
        console.log(`🔮 Creating tile for ${moduleKey}:`, module.name);

        const tile = document.createElement('div');
        tile.className = 'unique-module-tile analytics-module';
        tile.setAttribute('data-module-key', moduleKey);
        tile.setAttribute('data-category', module.category);

        // Simplified version without effects for now
        tile.innerHTML = `
            <div class="module-header">
                <div class="module-name">${module.name}</div>
                <div class="module-category-badge ${module.category}">${this.getCategoryDisplayName(module.category)}</div>
            </div>
            <div class="module-description">${module.description}</div>
        `;

        // Add click event for toggling
        tile.addEventListener('click', () => {
            this.toggleModule(moduleKey, tile);
            // Sync with main modules view if it exists
            this.syncModuleState(moduleKey);
        });

        return tile;
    }

    // Sync module state between analytics and main views
    syncModuleState(moduleKey) {
        const isActive = this.activeModules.has(moduleKey);

        // Update main view tile if it exists
        const mainTile = this.modulesGridElement?.querySelector(`[data-module-key="${moduleKey}"]`);
        if (mainTile) {
            mainTile.classList.toggle('active', isActive);
        }

        // Update analytics view tile if it exists
        const analyticsTile = this.analyticsModulesGridElement?.querySelector(`[data-module-key="${moduleKey}"]`);
        if (analyticsTile) {
            analyticsTile.classList.toggle('active', isActive);
        }
    }

    // Filter analytics modules by category
    filterAnalyticsByCategory(category) {
        if (!this.analyticsModulesGridElement) return;

        const tiles = this.analyticsModulesGridElement.querySelectorAll('.unique-module-tile');

        tiles.forEach(tile => {
            if (category === 'all' || tile.dataset.category === category) {
                tile.style.display = 'block';
            } else {
                tile.style.display = 'none';
            }
        });

        // Update filter button states
        const analyticsContainer = document.querySelector('.analytics-modules-container');
        if (analyticsContainer) {
            analyticsContainer.querySelectorAll('.module-category-filter').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });
        }
    }

    // Render all modules
    renderAllModules() {
        if (!this.modulesGridElement) {
            console.error('🔮 Cannot render modules - modulesGridElement is null');
            return;
        }

        console.log('🔮 Starting to render all modules...');

        // Clear existing modules
        this.modulesGridElement.innerHTML = '';

        // Create modules for each category
        Object.entries(this.moduleDefinitions).forEach(([categoryKey, modules]) => {
            console.log(`🔮 Rendering category: ${categoryKey} with ${Object.keys(modules).length} modules`);
            const categorySection = this.createCategorySection(categoryKey, modules);
            this.modulesGridElement.appendChild(categorySection);
        });

        console.log(`🔮 Rendered ${this.getTotalModulesCount()} unique modules in ${this.modulesGridElement.children.length} category sections`);
        console.log('🔮 Module grid HTML length:', this.modulesGridElement.innerHTML.length);
    }

    // Create category section
    createCategorySection(categoryKey, modules) {
        const section = document.createElement('div');
        section.className = 'modules-category-section';
        section.setAttribute('data-category', categoryKey);

        const header = document.createElement('div');
        header.className = 'modules-category-header';
        header.innerHTML = `
            <h3 class="modules-category-title">${this.getCategoryDisplayName(categoryKey)}</h3>
            <div class="modules-category-count">${Object.keys(modules).length} modules</div>
        `;

        const grid = document.createElement('div');
        grid.className = 'modules-grid';

        Object.entries(modules).forEach(([moduleKey, module]) => {
            const moduleTile = this.createModuleTile(moduleKey, module);
            grid.appendChild(moduleTile);
        });

        section.appendChild(header);
        section.appendChild(grid);
        return section;
    }

    // Create a single module tile
    createModuleTile(moduleKey, module) {
        const tile = document.createElement('div');
        tile.className = 'unique-module-tile';
        tile.setAttribute('data-module-key', moduleKey);
        tile.setAttribute('data-category', module.category);

        tile.innerHTML = `
            <div class="module-header">
                <div class="module-name">${module.name}</div>
                <div class="module-category-badge ${module.category}">${this.getCategoryDisplayName(module.category)}</div>
            </div>
            <div class="module-description">${module.description}</div>
            <div class="module-effects">
                ${this.renderEffects(module.effects)}
            </div>
            <div class="module-rarity ${module.rarity}">${module.rarity.toUpperCase()}</div>
        `;

        // Add click event for toggling
        tile.addEventListener('click', () => {
            this.toggleModule(moduleKey, tile);
        });

        return tile;
    }

    // Render module effects
    renderEffects(effects) {
        if (!effects || typeof effects !== 'object') {
            console.log('🔮 No effects to render:', effects);
            return '';
        }

        try {
            return Object.entries(effects).map(([key, value]) => {
                const displayKey = this.formatEffectKey(key);
                const displayValue = this.formatEffectValue(value);
                return `<div class="module-effect"><span class="effect-key">${displayKey}:</span> <span class="effect-value">${displayValue}</span></div>`;
            }).join('');
        } catch (error) {
            console.error('🔮 Error rendering effects:', error);
            return '';
        }
    }

    // Format effect key for display
    formatEffectKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    // Format effect value for display
    formatEffectValue(value) {
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') {
            if (value < 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
            return value.toString();
        }
        return value.toString();
    }

    // Toggle module active state (one per category)
    toggleModule(moduleKey, moduleElement) {
        const isActive = this.activeModules.has(moduleKey);

        if (isActive) {
            // Deactivate this module
            this.activeModules.delete(moduleKey);
            moduleElement.classList.remove('active');
        } else {
            // Find the category of this module
            const category = moduleElement.getAttribute('data-category');

            // Deactivate all other modules in the same category
            this.activeModules.forEach(activeKey => {
                // Find which category the active module belongs to
                for (const [cat, modules] of Object.entries(this.moduleDefinitions)) {
                    if (modules[activeKey]) {
                        if (cat === category) {
                            // Remove this module from active set
                            this.activeModules.delete(activeKey);

                            // Update UI for both views
                            document.querySelectorAll(`[data-module-key="${activeKey}"]`).forEach(tile => {
                                tile.classList.remove('active');
                            });
                        }
                        break;
                    }
                }
            });

            // Activate this module
            this.activeModules.add(moduleKey);
            moduleElement.classList.add('active');
        }

        this.updateActiveModuleCount();
        this.saveActiveModules();

        // Emit event for other systems
        if (window.eventBus) {
            window.eventBus.emit('modules:selection-changed', {
                activeModules: Array.from(this.activeModules),
                moduleKey: moduleKey,
                action: this.activeModules.has(moduleKey) ? 'activated' : 'deactivated'
            });
        }

        console.log(`🔮 ${this.getModuleName(moduleKey)} ${this.activeModules.has(moduleKey) ? 'activated' : 'deactivated'}`);
    }

    // Filter modules by category
    filterByCategory(category) {
        if (!this.modulesGridElement) return;

        const sections = this.modulesGridElement.querySelectorAll('.modules-category-section');

        sections.forEach(section => {
            if (category === 'all' || section.dataset.category === category) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });

        // Update filter button states
        document.querySelectorAll('.module-category-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }

    // Clear all active modules
    clearAllModules() {
        this.activeModules.clear();

        document.querySelectorAll('.unique-module-tile').forEach(tile => {
            tile.classList.remove('active');
        });

        this.updateActiveModuleCount();
        this.saveActiveModules();

        if (window.eventBus) {
            window.eventBus.emit('modules:all-cleared');
        }

        console.log('🔮 All modules cleared');
    }

    // Update active module count display
    updateActiveModuleCount() {
        const count = this.activeModules.size;
        const countText = `${count} module${count !== 1 ? 's' : ''} active`;

        // Update main view count
        const countElement = document.getElementById('activeModuleCount');
        if (countElement) {
            countElement.textContent = countText;
        }

        // Update analytics view count
        const analyticsCountElement = document.getElementById('activeModuleCountAnalytics');
        if (analyticsCountElement) {
            analyticsCountElement.textContent = countText;
        }
    }

    // Get category display name
    getCategoryDisplayName(categoryKey) {
        const names = {
            cannons: 'Cannons',
            armor: 'Armor',
            generators: 'Generators',
            cores: 'Cores'
        };
        return names[categoryKey] || categoryKey;
    }

    // Get module name by key
    getModuleName(moduleKey) {
        for (const category of Object.values(this.moduleDefinitions)) {
            if (category[moduleKey]) {
                return category[moduleKey].name;
            }
        }
        return moduleKey;
    }

    // Get total modules count
    getTotalModulesCount() {
        return Object.values(this.moduleDefinitions).reduce((total, category) => {
            return total + Object.keys(category).length;
        }, 0);
    }

    // Save active modules to localStorage
    saveActiveModules() {
        try {
            localStorage.setItem('uniqueModules:active', JSON.stringify(Array.from(this.activeModules)));
        } catch (error) {
            console.error('🔮 Failed to save active modules:', error);
        }
    }

    // Load active modules from localStorage
    loadActiveModules() {
        try {
            const saved = localStorage.getItem('uniqueModules:active');
            if (saved) {
                const activeList = JSON.parse(saved);
                this.activeModules = new Set(activeList);

                // Update UI for both main and analytics views
                activeList.forEach(moduleKey => {
                    // Update main view
                    const mainTile = this.modulesGridElement?.querySelector(`[data-module-key="${moduleKey}"]`);
                    if (mainTile) {
                        mainTile.classList.add('active');
                    }

                    // Update analytics view
                    const analyticsTile = this.analyticsModulesGridElement?.querySelector(`[data-module-key="${moduleKey}"]`);
                    if (analyticsTile) {
                        analyticsTile.classList.add('active');
                    }
                });

                this.updateActiveModuleCount();
            }
        } catch (error) {
            console.error('🔮 Failed to load active modules:', error);
        }
    }

    // Save configuration with name
    saveConfiguration() {
        const configName = prompt('Enter configuration name:');
        if (!configName) return;

        try {
            const configs = JSON.parse(localStorage.getItem('uniqueModules:configurations') || '{}');
            configs[configName] = {
                modules: Array.from(this.activeModules),
                timestamp: Date.now()
            };
            localStorage.setItem('uniqueModules:configurations', JSON.stringify(configs));
            console.log(`🔮 Configuration "${configName}" saved`);
        } catch (error) {
            console.error('🔮 Failed to save configuration:', error);
        }
    }

    // Load configuration by name
    loadConfiguration() {
        try {
            const configs = JSON.parse(localStorage.getItem('uniqueModules:configurations') || '{}');
            const configNames = Object.keys(configs);

            if (configNames.length === 0) {
                alert('No saved configurations found');
                return;
            }

            const configName = prompt(`Select configuration:\n${configNames.join('\n')}`);
            if (!configName || !configs[configName]) return;

            this.clearAllModules();
            configs[configName].modules.forEach(moduleKey => {
                const tile = document.querySelector(`[data-module-key="${moduleKey}"]`);
                if (tile) {
                    this.toggleModule(moduleKey, tile);
                }
            });

            console.log(`🔮 Configuration "${configName}" loaded`);
        } catch (error) {
            console.error('🔮 Failed to load configuration:', error);
        }
    }

    // Get active modules data
    getActiveModules() {
        const activeData = [];
        this.activeModules.forEach(moduleKey => {
            for (const [categoryKey, modules] of Object.entries(this.moduleDefinitions)) {
                if (modules[moduleKey]) {
                    activeData.push({
                        key: moduleKey,
                        category: categoryKey,
                        ...modules[moduleKey]
                    });
                    break;
                }
            }
        });
        return activeData;
    }

    // Get modules by category
    getModulesByCategory(category) {
        return this.moduleDefinitions[category] || {};
    }

    // Check if module is active
    isModuleActive(moduleKey) {
        return this.activeModules.has(moduleKey);
    }

    // Show section
    showSection() {
        if (!this.initialized) {
            this.init();
        }
        this.renderAllModules();
        this.loadActiveModules();
    }

    // Show analytics section
    showAnalyticsSection() {
        console.log('🔮 showAnalyticsSection called');

        // Always re-check for the element in case it was dynamically created
        this.analyticsModulesGridElement = document.getElementById('analyticsModulesGrid');
        console.log('🔮 Found analyticsModulesGrid element:', !!this.analyticsModulesGridElement);

        if (!this.analyticsModulesGridElement) {
            console.error('🔮 Cannot find analyticsModulesGrid element!');
            console.log('🔮 Available elements with "analytics" in ID:',
                Array.from(document.querySelectorAll('[id*="analytics"]')).map(el => el.id));
            return;
        }

        if (!this.analyticsInitialized) {
            this.initAnalytics();
        } else {
            // Re-render in case the element was cleared
            this.renderAnalyticsModules();
        }

        this.loadActiveModules();

        // Force re-render after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (this.analyticsModulesGridElement && this.analyticsModulesGridElement.children.length === 0) {
                console.log('🔮 Analytics grid empty, forcing re-render...');
                this.renderAnalyticsModules();
            }
        }, 100);
    }

    // Hide section
    hideSection() {
        // Cleanup if needed
    }
}

// Global unique modules manager instance
if (typeof window !== 'undefined') {
    try {
        console.log('🔮 Loading UniqueModulesManager class...');
        window.UniqueModulesManager = UniqueModulesManager;
        console.log('🔮 Creating UniqueModulesManager instance...');
        window.uniqueModulesManager = new UniqueModulesManager();
        console.log('🔮 UniqueModulesManager instance created successfully');
    } catch (error) {
        console.error('🔮 Error creating UniqueModulesManager:', error);
    }
}