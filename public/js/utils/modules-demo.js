// Demo utility for unique modules system
class ModulesDemo {
    constructor() {
        this.initialized = false;
    }

    // Initialize demo
    init() {
        if (this.initialized) return;

        console.log('🎮 ModulesDemo initialized');
        this.setupDemoControls();
        this.initialized = true;
    }

    // Setup demo controls
    setupDemoControls() {
        // Add demo button to activate some modules
        if (window.uniqueModulesManager) {
            // Listen for module events
            if (window.eventBus) {
                window.eventBus.on('modules:selection-changed', (data) => {
                    console.log('🔮 Module selection changed:', data);
                    this.displayActiveModulesEffect();
                });

                window.eventBus.on('modules:all-cleared', () => {
                    console.log('🔮 All modules cleared');
                });
            }
        }
    }

    // Display effect of active modules
    displayActiveModulesEffect() {
        if (!window.uniqueModulesManager) return;

        const activeModules = window.uniqueModulesManager.getActiveModules();

        if (activeModules.length > 0) {
            console.log('🔮 Active modules and their effects:');
            activeModules.forEach(module => {
                console.log(`  - ${module.name} (${module.category}):`, module.effects);
            });

            // Calculate combined effects
            const combinedEffects = this.calculateCombinedEffects(activeModules);
            console.log('🔮 Combined effects:', combinedEffects);
        }
    }

    // Calculate combined effects from active modules
    calculateCombinedEffects(modules) {
        const combined = {
            damageMultipliers: [],
            specialEffects: [],
            cooldownReductions: [],
            chances: {},
            counters: {}
        };

        modules.forEach(module => {
            Object.entries(module.effects).forEach(([key, value]) => {
                // Group effects by type
                if (key.includes('Multiplier') || key.includes('Increase')) {
                    combined.damageMultipliers.push({ module: module.name, effect: key, value });
                } else if (key.includes('Chance')) {
                    combined.chances[key] = (combined.chances[key] || 0) + value;
                } else if (key.includes('Reduction') || key.includes('Cooldown')) {
                    combined.cooldownReductions.push({ module: module.name, effect: key, value });
                } else if (typeof value === 'boolean' && value) {
                    combined.specialEffects.push({ module: module.name, effect: key });
                } else if (typeof value === 'number') {
                    combined.counters[key] = (combined.counters[key] || 0) + value;
                }
            });
        });

        return combined;
    }

    // Demo function to activate a preset configuration
    activatePresetConfiguration(presetName = 'sample') {
        if (!window.uniqueModulesManager) {
            console.warn('🔮 UniqueModulesManager not available');
            return;
        }

        const presets = {
            sample: ['astralDeliverance', 'sharpFortitude', 'projectFunding', 'dimensionCore'],
            offensive: ['beingAnihilator', 'havocBringer', 'projectFunding', 'dimensionCore'],
            defensive: ['sharpFortitude', 'wormholeRedirector', 'spaceDisplacer', 'harmonyConductor'],
            economic: ['projectFunding', 'blackHoleDigestor', 'galaxyCompressor', 'pulsarHarvester']
        };

        const moduleKeys = presets[presetName];
        if (!moduleKeys) {
            console.warn('🔮 Unknown preset:', presetName);
            return;
        }

        // Clear all modules first
        window.uniqueModulesManager.clearAllModules();

        // Activate preset modules
        moduleKeys.forEach(moduleKey => {
            const tile = document.querySelector(`[data-module-key="${moduleKey}"]`);
            if (tile) {
                window.uniqueModulesManager.toggleModule(moduleKey, tile);
            }
        });

        console.log(`🔮 Activated preset "${presetName}" with modules:`, moduleKeys);
    }

    // Test all module categories
    testAllCategories() {
        if (!window.uniqueModulesManager) return;

        const categories = ['all', 'cannons', 'armor', 'generators', 'cores'];
        let currentIndex = 0;

        const testNextCategory = () => {
            if (currentIndex >= categories.length) {
                window.uniqueModulesManager.filterByCategory('all');
                console.log('🔮 Category test completed');
                return;
            }

            const category = categories[currentIndex];
            window.uniqueModulesManager.filterByCategory(category);
            console.log(`🔮 Testing category: ${category}`);

            currentIndex++;
            setTimeout(testNextCategory, 1000);
        };

        testNextCategory();
    }

    // Get module statistics
    getModuleStatistics() {
        if (!window.uniqueModulesManager) return null;

        const totalModules = window.uniqueModulesManager.getTotalModulesCount();
        const activeCount = window.uniqueModulesManager.activeModules.size;
        const byCategory = {};

        // Count modules by category
        Object.entries(window.uniqueModulesManager.moduleDefinitions).forEach(([category, modules]) => {
            byCategory[category] = {
                total: Object.keys(modules).length,
                active: 0
            };

            Object.keys(modules).forEach(moduleKey => {
                if (window.uniqueModulesManager.isModuleActive(moduleKey)) {
                    byCategory[category].active++;
                }
            });
        });

        const stats = {
            total: totalModules,
            active: activeCount,
            inactive: totalModules - activeCount,
            activationRate: ((activeCount / totalModules) * 100).toFixed(1) + '%',
            byCategory
        };

        console.log('🔮 Module Statistics:', stats);
        return stats;
    }

    // Export current configuration
    exportConfiguration() {
        if (!window.uniqueModulesManager) return null;

        const config = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            activeModules: Array.from(window.uniqueModulesManager.activeModules),
            moduleData: window.uniqueModulesManager.getActiveModules()
        };

        console.log('🔮 Current configuration:', config);

        // Create downloadable JSON
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modules-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return config;
    }
}

// Global demo instance
if (typeof window !== 'undefined') {
    window.ModulesDemo = ModulesDemo;
    window.modulesDemo = new ModulesDemo();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.modulesDemo.init();
        });
    } else {
        window.modulesDemo.init();
    }

    // Add global demo functions for easy testing
    window.testModules = {
        activatePreset: (name) => window.modulesDemo.activatePresetConfiguration(name),
        testCategories: () => window.modulesDemo.testAllCategories(),
        getStats: () => window.modulesDemo.getModuleStatistics(),
        export: () => window.modulesDemo.exportConfiguration()
    };
}