/**
 * Table Renderer Module
 * Handles rendering of the runs table with all interactive elements
 */
class TableRenderer {
    constructor(tableBodyId = 'analyticsRunsTableBody') {
        this.tableBodyId = tableBodyId;
        this.eventListeners = new Map();
        this.selectedRunId = null;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // Main rendering method
    renderTable(runs, selectedRunId = null) {
        const tbody = document.getElementById(this.tableBodyId);
        if (!tbody) {
            console.error(`Table body with ID '${this.tableBodyId}' not found`);
            return;
        }

        this.selectedRunId = selectedRunId;

        if (!runs || !runs.length) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #B0B0C8;">No runs found</td></tr>';
            return;
        }

        tbody.innerHTML = runs.slice(0, 20).map(run => this.renderTableRow(run)).join('');
        this.emit('tableRendered', { runCount: runs.length });
    }

    // Render individual table row
    renderTableRow(run) {
        const isSelected = this.selectedRunId === run.id;
        const rowClass = isSelected ? 'class="analytics-selected-run"' : '';

        return `
            <tr ${rowClass} data-run-id="${run.id}">
                <td>${this.formatDate(run.timestamp)}</td>
                <td>${this.renderCategorySelector(run)}</td>
                <td>${this.getTierBadge(run.tier)}</td>
                <td>${FormattingUtils.formatNumber(run.wave || 0)}</td>
                <td><span style="color: #FF6B6B;">${run.killed_by || 'Unknown'}</span></td>
                <td><strong style="color: #4CAF50;">${run.real_time || 'N/A'}</strong></td>
                <td>${FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(run.damage_dealt))}</td>
                <td>${FormattingUtils.formatNumber(run.total_enemies || 0)}</td>
                <td><strong style="color: #FFD700;">${FormattingUtils.formatNumber(FormattingUtils.parseNumericValue(run.coins_earned))}</strong></td>
                <td>${this.renderActionButtons(run)}</td>
            </tr>
        `;
    }

    // Render category selector dropdown
    renderCategorySelector(run) {
        return `
            <select
                class="analytics-category-select"
                onchange="window.tableRenderer.handleCategoryChange(${run.id}, this.value)"
                style="background: rgba(0,0,0,0.3); color: #E6E6FA; border: 1px solid rgba(255,255,255,0.2); padding: 4px; border-radius: 4px; font-size: 11px;"
            >
                <option value="" ${!run.category ? 'selected' : ''}>None</option>
                <option value="milestone" ${run.category === 'milestone' ? 'selected' : ''}>🏆 Milestone</option>
                <option value="tournament" ${run.category === 'tournament' ? 'selected' : ''}>🎯 Tournament</option>
                <option value="farm" ${run.category === 'farm' ? 'selected' : ''}>🌾 Farm</option>
            </select>
        `;
    }

    // Render action buttons
    renderActionButtons(run) {
        return `
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button
                    class="analytics-view-btn"
                    onclick="window.tableRenderer.handleViewRun(${run.id})"
                    style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;"
                >
                    📊 View
                </button>
                <button
                    class="analytics-delete-btn"
                    onclick="window.tableRenderer.handleDeleteRun(${run.id})"
                    style="background: linear-gradient(135deg, #ff4757, #ff3742); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;"
                >
                    🗑️ Delete
                </button>
            </div>
        `;
    }

    // Event handlers
    handleCategoryChange(runId, category) {
        this.emit('categoryChanged', { runId, category });
    }

    handleViewRun(runId) {
        this.emit('viewRun', { runId });
    }

    handleDeleteRun(runId) {
        if (confirm('Are you sure you want to delete this run? This action cannot be undone.')) {
            this.emit('deleteRun', { runId });
        }
    }

    // Utility methods
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    getTierBadge(tier) {
        if (!tier) return '<span class="analytics-tier-badge analytics-tier-1-5">T0</span>';

        const tierNum = parseInt(tier);
        let badgeClass = 'analytics-tier-1-5';

        if (tierNum >= 21) badgeClass = 'analytics-tier-21-plus';
        else if (tierNum >= 16) badgeClass = 'analytics-tier-16-20';
        else if (tierNum >= 11) badgeClass = 'analytics-tier-11-15';
        else if (tierNum >= 6) badgeClass = 'analytics-tier-6-10';

        return `<span class="analytics-tier-badge ${badgeClass}">T${tierNum}</span>`;
    }

    // Update selected run
    setSelectedRun(runId) {
        this.selectedRunId = runId;

        // Update visual selection in table
        const tbody = document.getElementById(this.tableBodyId);
        if (tbody) {
            // Remove previous selection
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.classList.remove('analytics-selected-run');
            });

            // Add selection to current run
            if (runId) {
                const selectedRow = tbody.querySelector(`tr[data-run-id="${runId}"]`);
                if (selectedRow) {
                    selectedRow.classList.add('analytics-selected-run');
                }
            }
        }

        this.emit('selectedRunChanged', { runId });
    }

    // Get current selection
    getSelectedRunId() {
        return this.selectedRunId;
    }
}

// Export for use in other modules
window.TableRenderer = TableRenderer;