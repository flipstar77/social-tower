// Stats Display Manager
// Responsible for updating stat cards, comprehensive stats, and trend cards

class StatsDisplayManager {
    constructor() {
        this.currentSession = null;
    }

    /**
     * Set the current session to display
     * @param {Object} session - Session object
     */
    setCurrentSession(session) {
        this.currentSession = session;
    }

    /**
     * Update main stat cards (Tier, Wave, Coins)
     */
    updateStatCards() {
        // Update tier
        const tierValue = document.getElementById('tier-value');
        if (tierValue) {
            tierValue.textContent = this.currentSession?.tier || '0';
        }

        // Update wave
        const waveValue = document.getElementById('wave-value');
        if (waveValue) {
            const wave = this.currentSession?.wave || 0;
            waveValue.textContent = FormattingUtils.formatNumber(wave);
        }

        // Update coins
        const coinsValue = document.getElementById('coins-value');
        if (coinsValue) {
            coinsValue.textContent = this.currentSession?.coinsEarned || this.currentSession?.coins || '0';
        }
    }

    /**
     * Update comprehensive stats grid with all session details
     */
    updateComprehensiveStats() {
        const grid = document.getElementById('comprehensive-stats-grid');
        if (!grid) return;

        const session = this.currentSession || {};

        console.log('Current session data:', session);
        console.log('Session keys:', Object.keys(session));

        // Get field mappings for label lookup
        const fieldMappings = FieldMappings.getFieldMappings();
        const reverseMappings = Object.fromEntries(
            Object.entries(fieldMappings).map(([label, key]) => [key, label])
        );

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

                // Set default value if not found
                if (value === undefined || value === null) {
                    value = this.getDefaultValue(label);
                }

                const card = document.createElement('div');
                card.className = 'comprehensive-stat-card';

                // Format the value appropriately
                const displayValue = this.formatDisplayValue(value);

                card.innerHTML = `
                    <span class="comprehensive-stat-label">${label}</span>
                    <span class="comprehensive-stat-value">${displayValue}</span>
                `;
                grid.appendChild(card);
            });
        });
    }

    /**
     * Get default value for a field based on label
     * @param {string} label - Field label
     * @returns {string} Default value
     */
    getDefaultValue(label) {
        if (label.includes('Time')) return '0h 0m 0s';
        if (label.includes('Cash') || label.includes('$')) return '$0';
        if (label === 'Killed By') return 'N/A';
        if (label.includes('Berserk') && label.includes('Gain')) return 'x0';
        return '0';
    }

    /**
     * Format value for display, preserving game notation
     * @param {any} value - Value to format
     * @returns {string} Formatted value
     */
    formatDisplayValue(value) {
        if (typeof value === 'number' && value !== 0) {
            return FormattingUtils.formatNumber(value);
        }

        if (typeof value === 'string' && value !== 'N/A') {
            // Skip formatting if it has time notation (dhms), multipliers (x), or game suffixes (T, B, M, K, etc.)
            const hasSpecialFormat = /[dhms]|x\d|[KMBTQPEZYRΛΠΣΩ]|a[a-z]/.test(value);
            if (!hasSpecialFormat && !value.startsWith('$')) {
                // Only format plain numeric strings
                const numValue = FormattingUtils.parseNumericValue(value);
                if (numValue > 0) {
                    return FormattingUtils.formatNumber(numValue);
                }
            }
        }

        return value;
    }

    /**
     * Update trend cards with hourly rates
     */
    updateTrendCards() {
        const trendGrid = document.getElementById('trend-grid');
        if (!trendGrid) return;

        // Clear existing content
        trendGrid.innerHTML = '';

        const session = this.currentSession;
        if (!session) return;

        // Parse real time to calculate hourly rates
        const realTime = session.realTime || session.real_time || '0h 0m 0s';
        const hours = DataNormalizationUtils.parseTimeToHours(realTime);

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

    /**
     * Update all stat displays
     */
    updateAll() {
        this.updateStatCards();
        this.updateComprehensiveStats();
        this.updateTrendCards();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsDisplayManager;
}
