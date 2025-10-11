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

    showRecommendations() {
        const recSection = document.getElementById('labs-recommendations');
        const recContent = document.getElementById('recommendations-content');

        if (!recSection || !recContent) return;

        // Calculate efficiency recommendations based on lab efficiency data
        const recommendations = this.calculateRecommendations();

        recContent.innerHTML = `
            <div class="recommendations-grid">
                ${recommendations.map(rec => `
                    <div class="recommendation-card ${rec.priority}">
                        <div class="rec-header">
                            <span class="rec-lab">${rec.name}</span>
                            <span class="rec-priority">${rec.priorityLabel}</span>
                        </div>
                        <div class="rec-stats">
                            <div class="rec-stat">
                                <span class="rec-label">Current Level:</span>
                                <span class="rec-value">${rec.current}</span>
                            </div>
                            <div class="rec-stat">
                                <span class="rec-label">Efficiency:</span>
                                <span class="rec-value">${rec.efficiency}% /day</span>
                            </div>
                        </div>
                        <div class="rec-advice">${rec.advice}</div>
                    </div>
                `).join('')}
            </div>
        `;

        recSection.style.display = 'block';
    }

    calculateRecommendations() {
        // Lab efficiency data (% per day) - simplified for now
        const efficiencies = {
            'super-tower-bonus': { efficiency: 13.38, name: 'Super Tower Bonus' },
            'critical-factor': { efficiency: 1.24, name: 'Critical Factor' },
            'super-crit-multi': { efficiency: 1.24, name: 'Super Crit Multi' },
            'attack-speed': { efficiency: 1.24, name: 'Attack Speed' },
            'damage': { efficiency: 1.24, name: 'Damage' },
            'super-crit-chance': { efficiency: 0.86, name: 'Super Crit Chance' }
        };

        const recommendations = [];

        for (const [key, data] of Object.entries(efficiencies)) {
            const current = this.labs[key] || 0;
            let priority = 'medium';
            let priorityLabel = 'Medium Priority';
            let advice = 'Consider upgrading when you have resources.';

            if (data.efficiency > 5) {
                priority = 'high';
                priorityLabel = 'HIGH PRIORITY';
                advice = 'Highest efficiency! Upgrade this first.';
            } else if (data.efficiency > 1.2) {
                priority = 'medium';
                priorityLabel = 'Medium Priority';
                advice = 'Good efficiency. Upgrade after high priority labs.';
            } else {
                priority = 'low';
                priorityLabel = 'Low Priority';
                advice = 'Lower efficiency. Upgrade later.';
            }

            recommendations.push({
                name: data.name,
                current,
                efficiency: data.efficiency,
                priority,
                priorityLabel,
                advice
            });
        }

        // Sort by efficiency (descending)
        recommendations.sort((a, b) => b.efficiency - a.efficiency);

        return recommendations.slice(0, 6); // Top 6 recommendations
    }
}

// Initialize on page load
window.labsManager = new LabsManager();
