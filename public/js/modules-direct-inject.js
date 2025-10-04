// Direct Module Injection - Temporary Fix
// This bypasses the manager and directly injects modules into the analytics grid

// Predefined module presets
const modulePresets = {
    balanced: {
        name: '⚖️ Balanced Build',
        modules: ['astraldeliverance', 'sharpfortitude', 'galaxycompressor', 'harmonyconductor']
    },
    offensive: {
        name: '⚔️ Offensive Build',
        modules: ['beinganihilator', 'negativemassprojector', 'pulsarharvester', 'dimensioncore']
    },
    defensive: {
        name: '🛡️ Defensive Build',
        modules: ['shrinkray', 'wormholeredirector', 'singularityharness', 'magnetichook']
    },
    economy: {
        name: '💰 Economy Build',
        modules: ['deathpenalty', 'spacedisplacer', 'blackholedigestor', 'multiversenexus']
    }
};

function injectModulesDirectly() {
    console.log('🔮 Direct injection of modules starting...');

    const grid = document.getElementById('analyticsModulesGrid');
    if (!grid) {
        console.error('🔮 analyticsModulesGrid not found!');
        return;
    }

    // Check if modules already exist (only skip if we have the expected 20 modules)
    if (grid.children.length >= 20) {
        console.log('🔮 Modules already present (20+), skipping injection');
        setupModulePresetControls(); // Still setup controls
        return;
    } else if (grid.children.length > 0) {
        console.log(`🔮 Partial modules present (${grid.children.length}), clearing and re-injecting`);
    }

    // Clear any existing content
    grid.innerHTML = '';

    // All 20 modules
    const modules = [
        // Cannons
        { name: 'Astral Deliverance', category: 'cannons', description: "Bounce shot's range is increased by 3% of tower's total range. Each bounce increases the projectile's damage." },
        { name: 'Being Anihilator', category: 'cannons', description: 'When you super crit, your next [x] attacks are guaranteed super crits.' },
        { name: 'Death Penalty', category: 'cannons', description: 'Chance to mark an enemy for death when it spawns: the first hit destroys it.' },
        { name: 'Havoc Bringer', category: 'cannons', description: '[x]% chance for rend armor to instantly go to max.' },
        { name: 'Shrink Ray', category: 'cannons', description: "Attacks have a 1% chance to apply a non-stacking effect that decreases the enemy's mass by [x]%." },

        // Armor
        { name: 'Anti-Cube Portal', category: 'armor', description: 'Enemies take [x]× damage for 7s after they are hit by a shockwave.' },
        { name: 'Negative Mass Projector', category: 'armor', description: "If an orb doesn't kill the enemy, it applies a stacking debuff reducing its damage & speed by [x]% per hit, up to a max reduction of 50%." },
        { name: 'Sharp Fortitude', category: 'armor', description: "Wall's health and regen are increased by x[x]. Enemies take +1% increased damage from wall thorns per subsequent hit." },
        { name: 'Wormhole Redirector', category: 'armor', description: 'Health Regen can heal up to [x]% of Package Max Recovery.' },
        { name: 'Space Displacer', category: 'armor', description: 'Landmines have a [x]% chance to spawn as an Inner Land Mine (20 max) instead of a normal mine. These mines move around the tower.' },

        // Generators
        { name: 'Black Hole Digestor', category: 'generators', description: 'Temporarily get [x]% extra Coins/Kill Bonus for each free upgrade you got on the current wave.' },
        { name: 'Galaxy Compressor', category: 'generators', description: 'Collecting a recovery package reduces the cooldown of all Ultimate Weapons by [x] seconds.' },
        { name: 'Project Funding', category: 'generators', description: 'Tower damage is multiplied by [x]% of the number of digits in your current cash.' },
        { name: 'Pulsar Harvester', category: 'generators', description: "Each time a projectile hits an enemy, there is a [x]% chance that it will reduce the enemy's Health and Attack level by 1." },
        { name: 'Singularity Harness', category: 'generators', description: 'Increase the range of each bot by +[x]m. Enemies hit by the Flame Bot receive double damage.' },

        // Cores
        { name: 'Dimension Core', category: 'cores', description: 'Has a chance of hitting the initial target. Shock chance and multiplier are doubled. If shock is applied again to the same enemy, the shock multiplier adds up to a max stack of [x].' },
        { name: 'Harmony Conductor', category: 'cores', description: '[x]% chance for poisoned enemies to miss-attack (bosses chance is halved).' },
        { name: 'Magnetic Hook', category: 'cores', description: 'Inner Land Mines are fired at bosses as they enter Tower Range. 25% of elites have Inner Land Mines fired at them as they enter Tower range.' },
        { name: 'Multiverse Nexus', category: 'cores', description: 'Death Wave, Golden Tower, and Black Hole ultimate weapons will always activate at the same time, but the cooldown will be the average of those plus/minus [x] seconds.' },
        { name: 'Om Chip', category: 'cores', description: 'Spotlight will rotate to focus a boss. This effect can only happen again after [x] bosses.' }
    ];

    // Create tiles
    modules.forEach((module, index) => {
        const tile = document.createElement('div');
        tile.className = 'unique-module-tile analytics-module glass-tile';
        tile.setAttribute('data-module-key', module.name.toLowerCase().replace(/\s+/g, ''));
        tile.setAttribute('data-category', module.category);

        // Category badge colors
        const categoryColors = {
            cannons: 'background: linear-gradient(135deg, #ff6b6b, #ee5a24);',
            armor: 'background: linear-gradient(135deg, #5f6fee, #3742fa);',
            generators: 'background: linear-gradient(135deg, #26de81, #20bf6b);',
            cores: 'background: linear-gradient(135deg, #fed330, #f7b731);'
        };

        tile.innerHTML = `
            <div class="module-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div class="module-name" style="font-weight: bold; flex: 1;">${module.name}</div>
                <div class="module-category-badge" style="padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; color: white; ${categoryColors[module.category]}">${module.category}</div>
            </div>
            <div class="module-description" style="font-size: 0.85rem; line-height: 1.3; opacity: 0.8;">${module.description}</div>
        `;

        // Add click handler with one-per-category logic
        tile.onclick = function() {
            const isActive = tile.classList.contains('active');

            if (!isActive) {
                // Deactivate all other modules in the same category
                grid.querySelectorAll(`[data-category="${module.category}"]`).forEach(categoryTile => {
                    categoryTile.classList.remove('active');
                });
                // Activate this module
                tile.classList.add('active');
            } else {
                // Deactivate this module
                tile.classList.remove('active');
            }

            // Save selection to localStorage
            const activeModules = [];
            grid.querySelectorAll('.active').forEach(activeTile => {
                activeModules.push(activeTile.getAttribute('data-module-key'));
            });
            localStorage.setItem('uniqueModules:active', JSON.stringify(activeModules));

            // Update counter
            const activeCount = activeModules.length;
            const counter = document.getElementById('activeModuleCountAnalytics');
            if (counter) {
                counter.textContent = `${activeCount} module${activeCount !== 1 ? 's' : ''} active`;
            }
        };

        grid.appendChild(tile);
    });

    console.log(`🔮 Direct injection complete: ${modules.length} modules added`);

    // Load saved selections from localStorage
    try {
        const saved = localStorage.getItem('uniqueModules:active');
        if (saved) {
            const activeList = JSON.parse(saved);
            activeList.forEach(moduleKey => {
                const tile = grid.querySelector(`[data-module-key="${moduleKey}"]`);
                if (tile) {
                    tile.classList.add('active');
                }
            });
            console.log(`🔮 Restored ${activeList.length} active modules from storage`);
        }
    } catch (error) {
        console.error('🔮 Error loading saved modules:', error);
    }

    // Update counter
    const activeCount = grid.querySelectorAll('.active').length;
    const counter = document.getElementById('activeModuleCountAnalytics');
    if (counter) {
        counter.textContent = `${activeCount} module${activeCount !== 1 ? 's' : ''} active`;
    }

    // Setup preset controls
    setupModulePresetControls();
}

// Load a preset configuration
function loadModulePreset(presetKey) {
    const preset = modulePresets[presetKey];
    if (!preset) return;

    const grid = document.getElementById('analyticsModulesGrid');
    if (!grid) return;

    // Clear all active modules
    grid.querySelectorAll('.unique-module-tile').forEach(tile => {
        tile.classList.remove('active');
    });

    // Activate preset modules
    preset.modules.forEach(moduleKey => {
        const tile = grid.querySelector(`[data-module-key="${moduleKey}"]`);
        if (tile) {
            tile.classList.add('active');
        }
    });

    // Save to localStorage
    localStorage.setItem('uniqueModules:active', JSON.stringify(preset.modules));

    // Update counter
    const counter = document.getElementById('activeModuleCountAnalytics');
    if (counter) {
        counter.textContent = `${preset.modules.length} modules active`;
    }

    console.log(`🔮 Loaded preset: ${preset.name}`);
}

// Clear all modules
function clearAllModules() {
    const grid = document.getElementById('analyticsModulesGrid');
    if (!grid) return;

    grid.querySelectorAll('.unique-module-tile').forEach(tile => {
        tile.classList.remove('active');
    });

    localStorage.removeItem('uniqueModules:active');

    const counter = document.getElementById('activeModuleCountAnalytics');
    if (counter) {
        counter.textContent = '0 modules active';
    }

    console.log('🔮 Cleared all modules');
}

// Save current selection as preset
function saveModulePreset() {
    const grid = document.getElementById('analyticsModulesGrid');
    if (!grid) return;

    const activeModules = [];
    grid.querySelectorAll('.unique-module-tile.active').forEach(tile => {
        activeModules.push(tile.getAttribute('data-module-key'));
    });

    const presetName = prompt('Enter preset name:');
    if (!presetName) return;

    try {
        const customPresets = JSON.parse(localStorage.getItem('uniqueModules:customPresets') || '{}');
        customPresets[presetName] = {
            name: presetName,
            modules: activeModules,
            timestamp: Date.now()
        };
        localStorage.setItem('uniqueModules:customPresets', JSON.stringify(customPresets));
        alert(`Preset "${presetName}" saved successfully!`);
        console.log(`🔮 Saved custom preset: ${presetName}`);
    } catch (error) {
        console.error('🔮 Error saving preset:', error);
        alert('Failed to save preset');
    }
}

// Setup event listeners for preset controls
function setupModulePresetControls() {
    // Preset selector
    const presetSelect = document.getElementById('modulePresetSelect');
    if (presetSelect && !presetSelect.hasAttribute('data-initialized')) {
        presetSelect.setAttribute('data-initialized', 'true');
        presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                loadModulePreset(e.target.value);
                e.target.value = ''; // Reset dropdown
            }
        });
    }

    // Save preset button
    const saveBtn = document.getElementById('saveModulePresetBtn');
    if (saveBtn && !saveBtn.hasAttribute('data-initialized')) {
        saveBtn.setAttribute('data-initialized', 'true');
        saveBtn.addEventListener('click', saveModulePreset);
    }

    // Clear all button
    const clearBtn = document.getElementById('clearAllModulesBtn');
    if (clearBtn && !clearBtn.hasAttribute('data-initialized')) {
        clearBtn.setAttribute('data-initialized', 'true');
        clearBtn.addEventListener('click', clearAllModules);
    }
}

// Attach to global scope
window.injectModulesDirectly = injectModulesDirectly;
window.loadModulePreset = loadModulePreset;
window.clearAllModules = clearAllModules;
window.saveModulePreset = saveModulePreset;

// Auto-inject when Tower Analytics is shown
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔮 Setting up automatic module injection...');

    // Immediate injection check
    const checkAndInject = () => {
        const analyticsSection = document.getElementById('towerAnalytics');
        const grid = document.getElementById('analyticsModulesGrid');

        if (analyticsSection && grid && analyticsSection.style.display !== 'none') {
            if (grid.children.length === 0) {
                console.log('🔮 Tower Analytics visible and grid empty - injecting modules');
                injectModulesDirectly();
            }
        }
    };

    // Check every 500ms if Tower Analytics is visible and inject if needed
    setInterval(checkAndInject, 500);

    // Also setup the traditional override method
    const setupTowerAnalyticsOverride = () => {
        if (window.towerAnalytics) {
            const originalShow = window.towerAnalytics.showSection;
            window.towerAnalytics.showSection = function() {
                console.log('🔮 Tower Analytics showSection called, injecting modules...');
                originalShow.call(this);

                // Force immediate injection
                setTimeout(() => {
                    console.log('🔮 Forcing module injection after showSection');
                    injectModulesDirectly();
                }, 1);

                // Backup injections
                setTimeout(() => {
                    const grid = document.getElementById('analyticsModulesGrid');
                    if (grid && grid.children.length === 0) {
                        console.log('🔮 Grid still empty, backup injection 1');
                        injectModulesDirectly();
                    }
                }, 50);

                setTimeout(() => {
                    const grid = document.getElementById('analyticsModulesGrid');
                    if (grid && grid.children.length === 0) {
                        console.log('🔮 Grid still empty, backup injection 2');
                        injectModulesDirectly();
                    }
                }, 200);
            };
            console.log('🔮 Tower Analytics override installed');
            return true;
        }
        return false;
    };

    // Try to setup override immediately and keep trying
    if (!setupTowerAnalyticsOverride()) {
        const setupInterval = setInterval(() => {
            if (setupTowerAnalyticsOverride()) {
                clearInterval(setupInterval);
            }
        }, 100);

        // Stop trying after 10 seconds
        setTimeout(() => clearInterval(setupInterval), 10000);
    }
});

console.log('🔮 Direct module injection script loaded');