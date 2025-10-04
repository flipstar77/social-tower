// Session Management Module
class SessionManager {
    constructor() {
        this.sessions = [];
        this.currentSession = null;
        this.storageKey = 'farmSessions';
        this.initialized = false;
    }

    // Initialize session manager
    init() {
        if (this.initialized) return;

        this.loadSessions();
        this.initialized = true;
        console.log('📊 SessionManager initialized');
    }

    // Load sessions from storage
    loadSessions() {
        try {
            const stored = StorageManager.get(this.storageKey, []);
            this.sessions = Array.isArray(stored) ? stored : [];
            console.log(`📊 Loaded ${this.sessions.length} sessions from storage`);
        } catch (error) {
            console.error('📊 Error loading sessions:', error);
            this.sessions = [];
        }
    }

    // Save sessions to storage
    saveSessions() {
        try {
            StorageManager.set(this.storageKey, this.sessions);
            console.log(`📊 Saved ${this.sessions.length} sessions to storage`);
        } catch (error) {
            console.error('📊 Error saving sessions:', error);
        }
    }

    // Add a new session
    addSession(sessionData) {
        try {
            const session = {
                id: this.generateSessionId(),
                timestamp: Date.now(),
                date: new Date().toISOString(),
                ...sessionData
            };

            this.sessions.push(session);
            this.currentSession = session;
            this.saveSessions();

            console.log('📊 Added new session:', session.id);
            return session;
        } catch (error) {
            console.error('📊 Error adding session:', error);
            return null;
        }
    }

    // Update current session
    updateCurrentSession(updateData) {
        if (!this.currentSession) {
            console.warn('📊 No current session to update');
            return false;
        }

        try {
            Object.assign(this.currentSession, updateData);

            // Update in sessions array
            const index = this.sessions.findIndex(s => s.id === this.currentSession.id);
            if (index !== -1) {
                this.sessions[index] = this.currentSession;
                this.saveSessions();
                console.log('📊 Updated current session:', this.currentSession.id);
                return true;
            }
        } catch (error) {
            console.error('📊 Error updating session:', error);
        }
        return false;
    }

    // Get current session
    getCurrentSession() {
        return this.currentSession;
    }

    // Set current session
    setCurrentSession(sessionId) {
        const session = this.getSessionById(sessionId);
        if (session) {
            this.currentSession = session;
            return true;
        }
        return false;
    }

    // Get session by ID
    getSessionById(sessionId) {
        return this.sessions.find(s => s.id === sessionId);
    }

    // Get all sessions
    getAllSessions() {
        return [...this.sessions];
    }

    // Get sessions with filtering
    getFilteredSessions(filter = {}) {
        let filtered = [...this.sessions];

        if (filter.dateRange) {
            const { start, end } = filter.dateRange;
            filtered = filtered.filter(session => {
                const sessionDate = new Date(session.timestamp);
                return sessionDate >= start && sessionDate <= end;
            });
        }

        if (filter.minWave !== undefined) {
            filtered = filtered.filter(session => (session.wave || 0) >= filter.minWave);
        }

        if (filter.maxWave !== undefined) {
            filtered = filtered.filter(session => (session.wave || 0) <= filter.maxWave);
        }

        if (filter.hasData) {
            filtered = filtered.filter(session => session.wave > 0 || session.damage > 0);
        }

        return filtered;
    }

    // Delete session
    deleteSession(sessionId) {
        try {
            const index = this.sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                const deleted = this.sessions.splice(index, 1)[0];

                // Clear current session if it was deleted
                if (this.currentSession && this.currentSession.id === sessionId) {
                    this.currentSession = null;
                }

                this.saveSessions();
                console.log('📊 Deleted session:', sessionId);
                return deleted;
            }
        } catch (error) {
            console.error('📊 Error deleting session:', error);
        }
        return null;
    }

    // Clear all sessions
    clearAllSessions() {
        try {
            this.sessions = [];
            this.currentSession = null;
            this.saveSessions();
            console.log('📊 Cleared all sessions');
            return true;
        } catch (error) {
            console.error('📊 Error clearing sessions:', error);
            return false;
        }
    }

    // Calculate session statistics
    calculateStats() {
        if (this.sessions.length === 0) {
            return this.getEmptyStats();
        }

        const validSessions = this.sessions.filter(s => s.wave > 0);

        if (validSessions.length === 0) {
            return this.getEmptyStats();
        }

        const waves = validSessions.map(s => s.wave || 0);
        const damages = validSessions.map(s => s.damage || 0);
        const coins = validSessions.map(s => s.coins || 0);

        return {
            totalSessions: this.sessions.length,
            validSessions: validSessions.length,
            avgWave: waves.reduce((a, b) => a + b, 0) / waves.length,
            maxWave: Math.max(...waves),
            minWave: Math.min(...waves),
            totalDamage: damages.reduce((a, b) => a + b, 0),
            avgDamage: damages.reduce((a, b) => a + b, 0) / damages.length,
            maxDamage: Math.max(...damages),
            totalCoins: coins.reduce((a, b) => a + b, 0),
            avgCoins: coins.reduce((a, b) => a + b, 0) / coins.length,
            maxCoins: Math.max(...coins),
            sessionRate: this.calculateSessionRate(),
            lastSession: validSessions[validSessions.length - 1]
        };
    }

    // Get empty stats structure
    getEmptyStats() {
        return {
            totalSessions: 0,
            validSessions: 0,
            avgWave: 0,
            maxWave: 0,
            minWave: 0,
            totalDamage: 0,
            avgDamage: 0,
            maxDamage: 0,
            totalCoins: 0,
            avgCoins: 0,
            maxCoins: 0,
            sessionRate: 0,
            lastSession: null
        };
    }

    // Calculate session rate (sessions per day)
    calculateSessionRate() {
        if (this.sessions.length < 2) return 0;

        const validSessions = this.sessions.filter(s => s.timestamp);
        if (validSessions.length < 2) return 0;

        const sorted = validSessions.sort((a, b) => a.timestamp - b.timestamp);
        const firstSession = sorted[0];
        const lastSession = sorted[sorted.length - 1];

        const daysDiff = (lastSession.timestamp - firstSession.timestamp) / (1000 * 60 * 60 * 24);

        return daysDiff > 0 ? validSessions.length / daysDiff : 0;
    }

    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Export sessions to JSON
    exportSessions() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalSessions: this.sessions.length,
                sessions: this.sessions
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('📊 Error exporting sessions:', error);
            return null;
        }
    }

    // Import sessions from JSON
    importSessions(jsonData, options = {}) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            if (!data.sessions || !Array.isArray(data.sessions)) {
                throw new Error('Invalid session data format');
            }

            if (options.replace) {
                this.sessions = data.sessions;
                this.currentSession = null;
            } else {
                // Merge sessions, avoiding duplicates
                const existingIds = new Set(this.sessions.map(s => s.id));
                const newSessions = data.sessions.filter(s => !existingIds.has(s.id));
                this.sessions.push(...newSessions);
            }

            this.saveSessions();
            console.log(`📊 Imported ${data.sessions.length} sessions`);
            return true;
        } catch (error) {
            console.error('📊 Error importing sessions:', error);
            return false;
        }
    }

    // Get recent sessions (last N sessions)
    getRecentSessions(count = 10) {
        return this.sessions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }

    // Search sessions
    searchSessions(query) {
        const lowerQuery = query.toLowerCase();
        return this.sessions.filter(session => {
            return (
                session.id.toLowerCase().includes(lowerQuery) ||
                (session.notes && session.notes.toLowerCase().includes(lowerQuery)) ||
                session.wave.toString().includes(lowerQuery)
            );
        });
    }
}

// Global session manager instance
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    window.sessionManager = new SessionManager();
}