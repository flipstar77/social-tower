// Tournaments Management System
class TournamentsManager {
    constructor() {
        this.tournaments = [];
        this.storageKey = 'social-tower-tournaments';
        this.loadTournaments();

        if (document.getElementById('tournaments')) {
            this.init();
        }
    }

    init() {
        console.log('🏆 Initializing Tournaments...');
        this.setupEventListeners();
        this.loadDashboard();
    }

    setupEventListeners() {
        if (!window.tournaments) {
            window.tournaments = this;
        }

        // Setup form submission
        const form = document.getElementById('addTournamentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTournament();
            });
        }
    }

    showSection() {
        const section = document.getElementById('tournaments');
        if (section) {
            section.style.display = 'block';
            this.loadDashboard();
            // Initialize bracket difficulty when tournaments section is shown
            this.initBracketDifficulty();
        }
    }

    async initBracketDifficulty() {
        // Wait for discord auth and bracket difficulty manager to be ready
        if (window.discordAuth && window.bracketDifficulty && window.discordAuth.user) {
            const discordUserId = window.discordAuth.user.user_metadata?.provider_id;
            if (discordUserId) {
                await window.bracketDifficulty.init(discordUserId);
            }
        }
    }

    hideSection() {
        const section = document.getElementById('tournaments');
        if (section) {
            section.style.display = 'none';
        }
    }

    loadDashboard() {
        this.renderStatsCards();
        this.renderTournamentsTable();
    }

    renderStatsCards() {
        const container = document.getElementById('tournamentsStatsGrid');
        if (!container) return;

        if (!this.tournaments || this.tournaments.length === 0) {
            container.innerHTML = '<div class="tournaments-empty">No tournament data available. Add your first tournament!</div>';
            return;
        }

        const stats = this.calculateStats();

        const cards = [
            { value: stats.totalTournaments, label: 'Total Tournaments', icon: '🏆' },
            { value: stats.bestRank, label: 'Best Rank', icon: '🥇' },
            { value: stats.averageRank.toFixed(1), label: 'Average Rank', icon: '📊' },
            { value: stats.highestTier, label: 'Highest Tier', icon: '⬆️' },
            { value: FormattingUtils.formatNumber(stats.highestWave), label: 'Highest Wave', icon: '🌊' },
            { value: FormattingUtils.formatNumber(stats.totalScore), label: 'Total Score', icon: '💯' },
            { value: stats.winRate + '%', label: 'Top 10 Rate', icon: '🎯' },
            { value: stats.recentStreak, label: 'Recent Streak', icon: '🔥' }
        ];

        container.innerHTML = cards.map(card => `
            <div class="tournaments-stat-card">
                <div class="tournaments-stat-value">${card.value}</div>
                <div class="tournaments-stat-label">${card.icon} ${card.label}</div>
            </div>
        `).join('');
    }

    renderTournamentsTable() {
        const tbody = document.getElementById('tournamentsTableBody');
        if (!tbody) return;

        if (!this.tournaments.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #B0B0C8;">No tournaments found. Add your first tournament!</td></tr>';
            return;
        }

        // Sort by date (newest first)
        const sortedTournaments = [...this.tournaments].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        tbody.innerHTML = sortedTournaments.map(tournament => `
            <tr>
                <td>${FormattingUtils.formatDate(tournament.date)}</td>
                <td><strong>${tournament.name}</strong></td>
                <td><span class="rank-badge rank-${this.getRankClass(tournament.rank)}">#${tournament.rank}</span></td>
                <td><strong style="color: #FFD700;">${FormattingUtils.formatNumber(tournament.score)}</strong></td>
                <td><span class="tier-badge tier-${tournament.tier}">${tournament.tier}</span></td>
                <td>${FormattingUtils.formatNumber(tournament.wave)}</td>
                <td><span class="rewards-text">${tournament.rewards || 'N/A'}</span></td>
                <td>
                    <button class="tournaments-action-btn delete-btn" onclick="window.tournaments.deleteTournament(${tournament.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    calculateStats() {
        if (!this.tournaments.length) {
            return {
                totalTournaments: 0,
                bestRank: 'N/A',
                averageRank: 0,
                highestTier: 0,
                highestWave: 0,
                totalScore: 0,
                winRate: 0,
                recentStreak: 0
            };
        }

        const ranks = this.tournaments.map(t => t.rank);
        const tiers = this.tournaments.map(t => t.tier);
        const waves = this.tournaments.map(t => t.wave);
        const scores = this.tournaments.map(t => t.score);

        const bestRank = Math.min(...ranks);
        const averageRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
        const highestTier = Math.max(...tiers);
        const highestWave = Math.max(...waves);
        const totalScore = scores.reduce((a, b) => a + b, 0);

        // Calculate win rate (top 10 finishes)
        const top10Count = ranks.filter(rank => rank <= 10).length;
        const winRate = Math.round((top10Count / ranks.length) * 100);

        // Calculate recent streak (consecutive top 10 from most recent)
        const recent = [...this.tournaments]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        let recentStreak = 0;
        for (const tournament of recent) {
            if (tournament.rank <= 10) {
                recentStreak++;
            } else {
                break;
            }
        }

        return {
            totalTournaments: this.tournaments.length,
            bestRank,
            averageRank,
            highestTier,
            highestWave,
            totalScore,
            winRate,
            recentStreak
        };
    }

    showAddDialog() {
        ModalManager.showAddTournamentModal();
        // Set today's date as default
        const dateInput = document.getElementById('tournamentDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    hideAddDialog() {
        ModalManager.hideAddTournamentModal();
        ModalManager.resetForm('addTournamentForm');
    }

    showImportDialog() {
        ModalManager.showImportTournamentModal();
    }

    hideImportDialog() {
        ModalManager.hideImportTournamentModal();
        ModalManager.clearTextarea('tournamentDataInput');
    }

    importTournamentData() {
        const textarea = document.getElementById('tournamentDataInput');
        if (!textarea || !textarea.value.trim()) {
            NotificationManager.error('Please enter tournament data to import');
            return;
        }

        try {
            const content = textarea.value.trim();
            const newTournaments = GameDataParser.parseTournamentCSV(content);

            if (newTournaments.length > 0) {
                // Add IDs if missing
                newTournaments.forEach(tournament => {
                    if (!tournament.id) {
                        tournament.id = Date.now() + Math.random();
                    }
                });

                this.tournaments = [...this.tournaments, ...newTournaments];
                this.saveTournaments();
                this.loadDashboard();
                this.hideImportDialog();
                NotificationManager.tournamentAdded(newTournaments.length);
            } else {
                NotificationManager.error('No valid tournament data found in import');
            }
        } catch (error) {
            console.error('Import error:', error);
            NotificationManager.importError(error.message);
        }
    }


    addTournament() {
        const form = document.getElementById('addTournamentForm');
        const formData = new FormData(form);

        const tournament = {
            id: Date.now(), // Simple ID generation
            date: document.getElementById('tournamentDate').value,
            name: document.getElementById('tournamentName').value,
            rank: parseInt(document.getElementById('tournamentRank').value),
            score: parseInt(document.getElementById('tournamentScore').value),
            tier: parseInt(document.getElementById('tournamentTier').value),
            wave: parseInt(document.getElementById('tournamentWave').value),
            rewards: document.getElementById('tournamentRewards').value
        };

        this.tournaments.push(tournament);
        this.saveTournaments();
        this.loadDashboard();
        this.hideAddDialog();
        NotificationManager.tournamentAdded();
    }

    deleteTournament(id) {
        if (confirm('Are you sure you want to delete this tournament?')) {
            this.tournaments = this.tournaments.filter(t => t.id !== id);
            this.saveTournaments();
            this.loadDashboard();
            NotificationManager.tournamentDeleted();
        }
    }

    uploadFile(input) {
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let newTournaments = [];

                if (file.name.endsWith('.json')) {
                    newTournaments = JSON.parse(content);
                } else {
                    // Parse text format (you can customize this based on your format)
                    newTournaments = this.parseTextFile(content);
                }

                if (Array.isArray(newTournaments)) {
                    // Add IDs if missing
                    newTournaments.forEach(tournament => {
                        if (!tournament.id) {
                            tournament.id = Date.now() + Math.random();
                        }
                    });

                    this.tournaments = [...this.tournaments, ...newTournaments];
                    this.saveTournaments();
                    this.loadDashboard();
                    this.showNotification(`Successfully imported ${newTournaments.length} tournaments!`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('File import error:', error);
                this.showNotification('Failed to import file: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
        input.value = ''; // Reset input
    }

    parseTextFile(content) {
        // Simple parser for text files - customize based on your format
        const lines = content.split('\n').filter(line => line.trim());
        const tournaments = [];

        lines.forEach(line => {
            // Expected format: Date,Name,Rank,Score,Tier,Wave,Rewards
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 6) {
                tournaments.push({
                    date: parts[0],
                    name: parts[1],
                    rank: parseInt(parts[2]),
                    score: parseInt(parts[3]),
                    tier: parseInt(parts[4]),
                    wave: parseInt(parts[5]),
                    rewards: parts[6] || ''
                });
            }
        });

        return tournaments;
    }

    loadTournaments() {
        this.tournaments = StorageManager.get(this.storageKey, []);
    }

    saveTournaments() {
        StorageManager.set(this.storageKey, this.tournaments);
    }



    getRankClass(rank) {
        if (rank <= 3) return 'gold';
        if (rank <= 10) return 'silver';
        if (rank <= 50) return 'bronze';
        return 'normal';
    }

}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.TournamentsManager = TournamentsManager;

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('tournaments')) {
            new TournamentsManager();
        }
    });
}