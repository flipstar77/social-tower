/**
 * Labs Manager - Handles user lab level tracking and recommendations
 */
class LabsManager {
    constructor() {
        this.labs = {};
        this.discordId = null;
    }

    async init() {
        console.log('🧪 Initializing Labs Manager...');

        // Get Discord ID from auth
        if (window.discordAuth?.user?.user_metadata?.provider_id) {
            this.discordId = window.discordAuth.user.user_metadata.provider_id;
        }

        this.setupEventListeners();
        await this.loadUserLabs();
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
    }

    async loadUserLabs() {
        if (!this.discordId) {
            console.log('⚠️ No Discord ID, skipping lab load');
            return;
        }

        try {
            const response = await fetch(`/api/user-labs/${this.discordId}`);
            const data = await response.json();

            if (data.success && data.labs) {
                this.labs = data.labs;
                this.populateForm(this.labs);
                console.log('✅ Loaded user labs:', this.labs);
            }
        } catch (error) {
            console.error('❌ Failed to load labs:', error);
        }
    }

    populateForm(labs) {
        // Populate all lab input fields
        const labMapping = {
            'damage': 'lab-damage',
            'critFactor': 'lab-crit-factor',
            'critChance': 'lab-crit-chance',
            'attackSpeed': 'lab-attack-speed',
            'health': 'lab-health',
            'defense': 'lab-defense',
            'regen': 'lab-regen',
            'range': 'lab-range',
            'knockback': 'lab-knockback',
            'speed': 'lab-speed',
            'coins': 'lab-coins',
            'interest': 'lab-interest',
            'cash': 'lab-cash',
            'superTower': 'lab-super-tower',
            'superCrit': 'lab-super-crit',
            'lifesteal': 'lab-lifesteal'
        };

        for (const [labKey, inputId] of Object.entries(labMapping)) {
            const input = document.getElementById(inputId);
            if (input && labs[labKey] !== undefined) {
                input.value = labs[labKey];
            }
        }
    }

    collectFormData() {
        const labs = {
            damage: parseInt(document.getElementById('lab-damage')?.value) || 0,
            critFactor: parseInt(document.getElementById('lab-crit-factor')?.value) || 0,
            critChance: parseInt(document.getElementById('lab-crit-chance')?.value) || 0,
            attackSpeed: parseInt(document.getElementById('lab-attack-speed')?.value) || 0,
            health: parseInt(document.getElementById('lab-health')?.value) || 0,
            defense: parseInt(document.getElementById('lab-defense')?.value) || 0,
            regen: parseInt(document.getElementById('lab-regen')?.value) || 0,
            range: parseInt(document.getElementById('lab-range')?.value) || 0,
            knockback: parseInt(document.getElementById('lab-knockback')?.value) || 0,
            speed: parseInt(document.getElementById('lab-speed')?.value) || 0,
            coins: parseInt(document.getElementById('lab-coins')?.value) || 0,
            interest: parseInt(document.getElementById('lab-interest')?.value) || 0,
            cash: parseInt(document.getElementById('lab-cash')?.value) || 0,
            superTower: parseInt(document.getElementById('lab-super-tower')?.value) || 0,
            superCrit: parseInt(document.getElementById('lab-super-crit')?.value) || 0,
            lifesteal: parseInt(document.getElementById('lab-lifesteal')?.value) || 0
        };

        return labs;
    }

    async saveLabs() {
        if (!this.discordId) {
            this.showStatus('❌ Please log in with Discord first', 'error');
            return;
        }

        this.showStatus('💾 Saving lab levels...', 'loading');

        const labs = this.collectFormData();

        try {
            const response = await fetch(`/api/user-labs/${this.discordId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ labs })
            });

            const data = await response.json();

            if (data.success) {
                this.labs = labs;
                this.showStatus('✅ Lab levels saved successfully!', 'success');
                this.showRecommendations();
                console.log('✅ Saved labs:', labs);
            } else {
                this.showStatus('❌ Failed to save: ' + data.error, 'error');
            }
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
        // Lab efficiency data (% per day)
        const efficiencies = {
            superTower: { efficiency: 13.38, name: 'Super Tower' },
            critFactor: { efficiency: 1.24, name: 'Crit Factor' },
            superCrit: { efficiency: 1.24, name: 'Super Crit' },
            attackSpeed: { efficiency: 1.24, name: 'Attack Speed' },
            damage: { efficiency: 1.24, name: 'Damage' },
            critChance: { efficiency: 0.86, name: 'Crit Chance' }
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
