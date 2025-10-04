// Session History Manager
// Responsible for managing session list, filtering, and history display

class SessionHistoryManager {
    constructor() {
        this.sessions = [];
        this.activeFilter = 'all'; // 'current', 'last5', 'week', 'all', 'tournaments', 'regular'
        this.onSessionSelect = null; // Callback when session is selected
        this.onSessionDelete = null; // Callback when session is deleted
    }

    /**
     * Set sessions data
     * @param {Array} sessions - Array of session objects
     */
    setSessions(sessions) {
        this.sessions = sessions || [];
    }

    /**
     * Get all sessions
     * @returns {Array} Array of sessions
     */
    getSessions() {
        return this.sessions;
    }

    /**
     * Set active filter
     * @param {string} filter - Filter name
     */
    setFilter(filter) {
        this.activeFilter = filter;
    }

    /**
     * Get filtered sessions based on active filter
     * @returns {Array} Filtered sessions
     */
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
                // Return only tournament runs
                console.log('🏆 Filtering tournaments from', this.sessions.length, 'sessions');
                const tournamentSessions = this.sessions.filter(session => {
                    console.log(`  Session T${session.tier} W${session.wave}: isTournament=${session.isTournament}`);
                    return session.isTournament === true;
                });
                console.log('🏆 Found', tournamentSessions.length, 'tournament runs');
                return tournamentSessions;

            case 'regular':
                // Return only regular runs (non-tournament)
                return this.sessions.filter(session => !session.isTournament);

            case 'all':
            default:
                // Return all sessions
                return this.sessions;
        }
    }

    /**
     * Get the latest filtered session
     * @returns {Object|null} Latest session or null
     */
    getLatestFilteredSession() {
        const filtered = this.getFilteredSessions();
        return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }

    /**
     * Update history list display
     */
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

    /**
     * Create a history item element
     * @param {Object} session - Session data
     * @param {number} index - Item index
     * @returns {HTMLElement} History item element
     */
    createHistoryItem(session, index) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const timeAgo = DataNormalizationUtils.getTimeAgo(session.timestamp);
        const changeValue = this.calculateSessionChange(session);
        const tournamentBadge = session.isTournament ? '<span class="tournament-badge" title="Tournament Run">🏆</span>' : '';

        item.innerHTML = `
            <div class="history-icon tower-icon"></div>
            <div class="history-text">
                <span class="history-title">${tournamentBadge}Session completed - Wave ${FormattingUtils.formatNumber(session.wave || 0)}</span>
                <div class="history-meta">
                    <span class="history-date">${timeAgo}</span>
                    <span class="history-change ${changeValue >= 0 ? 'positive' : 'negative'}">
                        ${changeValue >= 0 ? '+' : ''}${FormattingUtils.formatNumber(changeValue)}
                    </span>
                    <button class="share-run-btn" data-run='${JSON.stringify(session)}' title="Share this run">
                        📤
                    </button>
                    <button class="delete-run-btn" data-session-id="${session.sessionId}" title="Delete this run">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        // Add click handler for session selection
        item.addEventListener('click', (e) => {
            // Don't select if clicking on delete or share buttons
            if (e.target.closest('.delete-run-btn') || e.target.closest('.share-run-btn')) {
                return;
            }
            if (this.onSessionSelect) {
                this.onSessionSelect(session);
            }
        });

        // Add click handler for delete button
        const deleteBtn = item.querySelector('.delete-run-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onSessionDelete) {
                    this.onSessionDelete(session);
                }
            });
        }

        // Add click handler for share button
        const shareBtn = item.querySelector('.share-run-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareRun(session);
            });
        }

        return item;
    }

    /**
     * Calculate session change (wave difference from previous)
     * @param {Object} session - Current session
     * @returns {number} Change value
     */
    calculateSessionChange(session) {
        // This is a simplified version - could be enhanced to compare with previous session
        return session.wave || 0;
    }

    /**
     * Share run (copy to clipboard)
     * @param {Object} session - Session to share
     */
    shareRun(session) {
        const shareText = `Tower Stats - Tier ${session.tier}, Wave ${FormattingUtils.formatNumber(session.wave)}
Coins: ${session.coins || '0'}
Damage: ${session.damage || '0'}
${session.isTournament ? '🏆 Tournament Run' : ''}`;

        navigator.clipboard.writeText(shareText).then(() => {
            this.showNotification('Run copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('Failed to copy run');
        });
    }

    /**
     * Show notification message
     * @param {string} message - Message to show
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Add a new session
     * @param {Object} session - Session to add
     */
    addSession(session) {
        this.sessions.push(session);
        this.updateHistoryList();
    }

    /**
     * Remove a session
     * @param {string} sessionId - Session ID to remove
     */
    removeSession(sessionId) {
        this.sessions = this.sessions.filter(s => s.sessionId !== sessionId);
        this.updateHistoryList();
    }

    /**
     * Merge sessions with API data (API takes priority)
     * @param {Array} apiSessions - Sessions from API
     * @returns {Array} Merged sessions
     */
    mergeSessions(apiSessions) {
        const apiSessionIds = new Set(apiSessions.map(s => s.sessionId));
        const localSessionsFiltered = this.sessions.filter(s => !apiSessionIds.has(s.sessionId));
        this.sessions = [...apiSessions, ...localSessionsFiltered];
        return this.sessions;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionHistoryManager;
}
