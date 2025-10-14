/**
 * Labs Manager - Handles user lab level tracking and recommendations
 */
class LabsManager {
    constructor() {
        this.labs = {};
        this.discordId = null;
        this.supabase = null;
    }

    async init() {
        console.log('🧪 Initializing Labs Manager...');

        // Get Supabase client from discordAuth
        if (window.discordAuth?.supabase) {
            this.supabase = window.discordAuth.supabase;
        }

        // Get Discord ID from auth
        if (window.discordAuth?.user?.user_metadata?.provider_id) {
            this.discordId = window.discordAuth.user.user_metadata.provider_id;
        }

        this.renderLabInputs();
        this.setupEventListeners();
        await this.loadUserLabs();
    }

    renderLabInputs() {
        console.log('🎨 Rendering lab inputs...');

        if (!window.ALL_LABS || !window.CATEGORY_LABELS) {
            console.error('❌ Lab data not loaded! Make sure lab-data.js is loaded first.');
            return;
        }

        const grid = document.getElementById('labs-category-grid');
        if (!grid) {
            console.error('❌ labs-category-grid container not found');
            return;
        }

        // Group labs by category
        const labsByCategory = {};
        window.ALL_LABS.forEach(lab => {
            if (!labsByCategory[lab.category]) {
                labsByCategory[lab.category] = [];
            }
            labsByCategory[lab.category].push(lab);
        });

        // Render each category
        let html = '';
        for (const [categoryKey, categoryLabs] of Object.entries(labsByCategory)) {
            const categoryLabel = window.CATEGORY_LABELS[categoryKey] || categoryKey;

            html += `
                <div class="lab-category">
                    <h3 class="category-title">${categoryLabel}</h3>
                    <div class="lab-inputs-grid">
            `;

            categoryLabs.forEach(lab => {
                const labId = window.labNameToId(lab.name);
                const maxLevel = lab.maxLevel || 999;
                html += `
                    <div class="lab-input-group">
                        <label for="lab-${labId}">${lab.name} <span class="max-level">(Max: ${maxLevel})</span></label>
                        <input type="number" id="lab-${labId}" class="lab-input" min="0" max="${maxLevel}" placeholder="0" data-lab-key="${labId}">
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
        console.log(`✅ Rendered ${window.ALL_LABS.length} labs in ${Object.keys(labsByCategory).length} categories`);
    }

    setupEventListeners() {
        // Save button
        const saveBtn = document.getElementById('save-labs-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveLabs());
        }

        // Clear button
        const clearBtn = document.getElementById('clear-labs-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLabs());
        }

        // Add input validation to all lab inputs
        document.querySelectorAll('.lab-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const max = parseInt(e.target.max);
                const value = parseInt(e.target.value);

                if (value > max) {
                    e.target.value = max;
                } else if (value < 0) {
                    e.target.value = 0;
                }
            });
        });
    }

    setupTabListeners() {
        // Recommendation tab buttons
        document.querySelectorAll('.rec-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const focus = e.target.dataset.focus;
                this.switchRecommendationTab(focus);
            });
        });
    }

    updateDiscordId() {
        // Update Discord ID from auth
        if (window.discordAuth?.user?.user_metadata?.provider_id) {
            this.discordId = window.discordAuth.user.user_metadata.provider_id;
            console.log('✅ Discord ID updated:', this.discordId);
            return true;
        }
        return false;
    }

    async loadUserLabs() {
        // Try to update Discord ID if not set
        if (!this.discordId) {
            this.updateDiscordId();
        }

        // Try to get Supabase client if not set
        if (!this.supabase && window.discordAuth?.supabase) {
            this.supabase = window.discordAuth.supabase;
            console.log('✅ Supabase client retrieved');
        }

        if (!this.discordId || !this.supabase) {
            console.log('⚠️ No Discord ID or Supabase client, skipping lab load');
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_labs')
                .select('labs')
                .eq('discord_user_id', this.discordId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Error loading labs:', error);
                return;
            }

            if (data && data.labs) {
                this.labs = data.labs;
                this.populateForm(this.labs);
                console.log('✅ Loaded user labs:', this.labs);
            }
        } catch (error) {
            console.error('❌ Failed to load labs:', error);
        }
    }

    populateForm(labs) {
        // Populate all lab input fields dynamically
        for (const [labKey, level] of Object.entries(labs)) {
            const input = document.getElementById(`lab-${labKey}`);
            if (input && level !== undefined) {
                input.value = level;
            }
        }
    }

    collectFormData() {
        const labs = {};

        // Collect all lab inputs dynamically
        document.querySelectorAll('.lab-input').forEach(input => {
            const labKey = input.dataset.labKey;
            const value = parseInt(input.value) || 0;
            if (labKey) {
                labs[labKey] = value;
            }
        });

        return labs;
    }

    async saveLabs() {
        // Try to update Discord ID if not set
        if (!this.discordId) {
            this.updateDiscordId();
        }

        // Try to get Supabase client if not set
        if (!this.supabase && window.discordAuth?.supabase) {
            this.supabase = window.discordAuth.supabase;
        }

        if (!this.discordId || !this.supabase) {
            this.showStatus('❌ Please log in with Discord first', 'error');
            return;
        }

        this.showStatus('💾 Saving lab levels...', 'loading');

        const labs = this.collectFormData();

        try {
            const { data, error } = await this.supabase
                .from('user_labs')
                .upsert({
                    discord_user_id: this.discordId,
                    labs: labs,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'discord_user_id'
                })
                .select();

            if (error) {
                console.error('❌ Error saving labs:', error);
                this.showStatus('❌ Failed to save: ' + error.message, 'error');
                return;
            }

            this.labs = labs;
            this.showStatus('✅ Lab levels saved successfully!', 'success');
            this.showRecommendations();
            console.log('✅ Saved labs:', labs);
        } catch (error) {
            console.error('❌ Save error:', error);
            this.showStatus('❌ Failed to save lab levels', 'error');
        }
    }

    clearLabs() {
        // Clear all input fields
        document.querySelectorAll('.lab-input').forEach(input => {
            input.value = '';
        });
        this.showStatus('🗑️ Form cleared', 'info');
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('labs-status');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `labs-status ${type}`;
        statusEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }

    async showRecommendations() {
        const recSection = document.getElementById('labs-recommendations');
        if (!recSection) return;

        recSection.style.display = 'block';

        // Setup tab listeners now that the section is visible
        this.setupTabListeners();

        // Load recommendations for the default tab (damage)
        await this.loadRecommendations('damage');
    }

    async loadRecommendations(focus = 'damage') {
        if (!this.discordId) {
            console.log('⚠️ No Discord ID, cannot load recommendations');
            return;
        }

        const recContent = document.getElementById('recommendations-content');
        if (!recContent) return;

        recContent.innerHTML = '<div style="text-align: center; padding: 20px;">Loading recommendations...</div>';

        try {
            const apiUrl = window.API_CONFIG.getApiUrl('api/calculator/priorities');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discord_user_id: this.discordId,
                    focus,
                    limit: 5
                })
            });

            const result = await response.json();

            if (!result.success) {
                recContent.innerHTML = `<div style="color: #F72585; padding: 20px;">${result.message || 'Failed to load recommendations'}</div>`;
                return;
            }

            // Render stats and recommendations
            this.renderStats(result.data.currentStats);
            this.renderRecommendations(result.data.priorities, focus);

        } catch (error) {
            console.error('❌ Error loading recommendations:', error);
            recContent.innerHTML = `<div style="color: #F72585; padding: 20px;">Error: ${error.message}</div>`;
        }
    }

    renderStats(stats) {
        const summaryEl = document.getElementById('stats-summary');
        if (!summaryEl || !stats) return;

        const focusEmojis = {
            damage: '🗡️',
            health: '❤️',
            economy: '💰'
        };

        summaryEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">🗡️</div>
                <div class="stat-label">eDamage</div>
                <div class="stat-value">${this.formatNumber(stats.eDamage)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">❤️</div>
                <div class="stat-label">eHP</div>
                <div class="stat-value">${this.formatNumber(stats.eHP)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-label">eEcon</div>
                <div class="stat-value">${this.formatNumber(stats.eEcon)}</div>
            </div>
        `;
    }

    renderRecommendations(priorities, focus) {
        const recContent = document.getElementById('recommendations-content');
        if (!recContent || !priorities || priorities.length === 0) {
            recContent.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No recommendations available</div>';
            return;
        }

        const focusLabels = {
            damage: 'eDamage',
            health: 'eHP',
            economy: 'eEcon'
        };

        const focusLabel = focusLabels[focus] || focus;

        recContent.innerHTML = priorities.map((priority, index) => `
            <div class="recommendation-item" style="background: rgba(255, 255, 255, ${0.05 - index * 0.005});">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 5px;">
                            ${index + 1}. ${priority.displayName}
                        </div>
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">
                            Level ${priority.currentLevel} → ${priority.newLevel}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: 700; color: #F72585; margin-bottom: 3px;">
                            +${priority.improvementPercent.toFixed(2)}%
                        </div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                            ${focusLabel}
                        </div>
                    </div>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 20px; font-size: 13px; color: rgba(255, 255, 255, 0.6);">
                    <div>⏱️ ROI: ${priority.roi.toFixed(2)}/hour</div>
                    <div>💎 Cost: ${this.formatNumber(priority.upgradeCost)} coins</div>
                </div>
            </div>
        `).join('');
    }

    switchRecommendationTab(focus) {
        // Update tab active states
        document.querySelectorAll('.rec-tab').forEach(tab => {
            if (tab.dataset.focus === focus) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Load recommendations for the selected focus
        this.loadRecommendations(focus);
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }
}

// Initialize on page load
window.labsManager = new LabsManager();
