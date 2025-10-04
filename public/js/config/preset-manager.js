// Preset Management System for Cards and Modules
class PresetManager {
    constructor() {
        this.presets = this.loadPresets();
        this.currentPreset = null;

        // Built-in presets
        this.builtInPresets = {
            farm: {
                name: '🌾 Farm Setup',
                description: 'Optimized for coin and cash farming',
                cards: ['Cash Card', 'Coins Card', 'Critical Coin Card', 'Free Upgrades Card', 'Attack Speed Card', 'Damage Card', 'Range Card'],
                modules: {
                    cannons: 'shrinkRay',
                    generators: 'projectFunding',
                    armor: null,
                    cores: null
                }
            },
            tournament: {
                name: '🏆 Tournament Setup',
                description: 'Maximum damage output for tournaments',
                cards: ['Damage Card', 'Critical Chance Card', 'Attack Speed Card', 'Death Ray Card', 'Plasma Cannon Card', 'Super Tower Card', 'Ultimate Crit Card', 'Berserker Card'],
                modules: {
                    cannons: 'beingAnihilator',
                    generators: 'pulsarHarvester',
                    armor: 'antiCubePortal',
                    cores: 'dimensionCore'
                }
            },
            push: {
                name: '📈 Push Setup',
                description: 'Balanced for tier pushing',
                cards: ['Damage Card', 'Health Card', 'Health Regen Card', 'Extra Defense Card', 'Death Ray Card', 'Energy Shield Card', 'Recovery Package CArd', 'Second Wind Card'],
                modules: {
                    cannons: 'deathPenalty',
                    armor: 'wormholeRedirector',
                    generators: 'galaxyCompressor',
                    cores: 'multiverseNexus'
                }
            },
            defense: {
                name: '🛡️ Defense Setup',
                description: 'Maximum survivability',
                cards: ['Health Card', 'Health Regen Card', 'Extra Defense Card', 'Fortress Card', 'Energy Shield Card', 'Slow Aura Card', 'Land Mine Stun Card', 'Recovery Package CArd'],
                modules: {
                    armor: 'sharpFortitude',
                    generators: 'singularityHarness',
                    cores: 'harmonyConductor',
                    cannons: null
                }
            }
        };
    }

    // Load presets from localStorage
    loadPresets() {
        try {
            const saved = localStorage.getItem('gamePresets');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load presets:', error);
        }
        return {};
    }

    // Save presets to localStorage
    savePresets() {
        try {
            localStorage.setItem('gamePresets', JSON.stringify(this.presets));
        } catch (error) {
            console.error('Failed to save presets:', error);
        }
    }

    // Get all presets (built-in + custom)
    getAllPresets() {
        return {
            ...this.builtInPresets,
            ...this.presets
        };
    }

    // Get a specific preset
    getPreset(presetKey) {
        return this.builtInPresets[presetKey] || this.presets[presetKey] || null;
    }

    // Save a new custom preset
    saveNewPreset(name, description, cards, modules) {
        const key = this.generatePresetKey(name);
        this.presets[key] = {
            name: name,
            description: description || '',
            cards: cards || [],
            modules: modules || {},
            custom: true,
            timestamp: Date.now()
        };
        this.savePresets();
        return key;
    }

    // Delete a custom preset
    deletePreset(presetKey) {
        if (this.presets[presetKey]) {
            delete this.presets[presetKey];
            this.savePresets();
            return true;
        }
        return false;
    }

    // Generate a key from preset name
    generatePresetKey(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    // Apply a preset to cards and modules
    applyPreset(presetKey) {
        const preset = this.getPreset(presetKey);
        if (!preset) {
            console.error('Preset not found:', presetKey);
            return false;
        }

        this.currentPreset = presetKey;

        // Apply cards
        if (window.cardsManager && preset.cards) {
            this.applyCardsFromPreset(preset.cards);
        }

        // Apply modules
        if (window.uniqueModulesManager && preset.modules) {
            this.applyModulesFromPreset(preset.modules);
        }

        console.log(`✨ Preset "${preset.name}" applied`);
        return true;
    }

    // Apply cards from preset
    applyCardsFromPreset(cards) {
        if (!window.cardsManager) return;

        // Clear current selection
        window.cardsManager.activeCards.clear();

        // Deactivate all card tiles
        document.querySelectorAll('.analytics-card-tile').forEach(tile => {
            tile.classList.remove('active');
        });

        // Activate preset cards
        cards.forEach(cardName => {
            const cardTile = document.querySelector(`[data-card-name="${cardName}"]`);
            if (cardTile) {
                window.cardsManager.activeCards.add(cardName);
                cardTile.classList.add('active');
            }
        });

        window.cardsManager.updateActiveCardCount();
        window.cardsManager.saveActiveCards();
    }

    // Apply modules from preset
    applyModulesFromPreset(modules) {
        if (!window.uniqueModulesManager) return;

        // Clear current selection
        window.uniqueModulesManager.clearAllModules();

        // Activate preset modules
        Object.entries(modules).forEach(([category, moduleKey]) => {
            if (moduleKey) {
                const moduleTile = document.querySelector(`[data-module-key="${moduleKey}"]`);
                if (moduleTile) {
                    window.uniqueModulesManager.activeModules.add(moduleKey);
                    moduleTile.classList.add('active');
                }
            }
        });

        window.uniqueModulesManager.updateActiveModuleCount();
        window.uniqueModulesManager.saveActiveModules();
    }

    // Get current setup as preset data
    getCurrentSetup() {
        const cards = window.cardsManager ? Array.from(window.cardsManager.activeCards) : [];
        const modules = {};

        if (window.uniqueModulesManager) {
            // Organize active modules by category
            window.uniqueModulesManager.activeModules.forEach(moduleKey => {
                for (const [category, categoryModules] of Object.entries(window.uniqueModulesManager.moduleDefinitions)) {
                    if (categoryModules[moduleKey]) {
                        modules[category] = moduleKey;
                        break;
                    }
                }
            });
        }

        return { cards, modules };
    }

    // Save current setup as new preset
    saveCurrentAsPreset(name, description) {
        const setup = this.getCurrentSetup();
        return this.saveNewPreset(name, description, setup.cards, setup.modules);
    }

    // Clear all preset data (for current session)
    clearCurrentPreset() {
        this.currentPreset = null;
    }

    // Get preset options for dropdown
    getPresetOptions() {
        const allPresets = this.getAllPresets();
        return Object.entries(allPresets).map(([key, preset]) => ({
            value: key,
            label: preset.name,
            description: preset.description,
            isCustom: preset.custom || false
        }));
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PresetManager = PresetManager;
    window.presetManager = new PresetManager();
}
