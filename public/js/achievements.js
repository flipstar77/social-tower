// Tower Achievements & Gamification System
class TowerAchievements {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.userAchievements = this.loadUserAchievements();
        this.init();
    }

    init() {
        console.log('🏆 Initializing Tower Achievements...');
        this.createAchievementsUI();
        this.checkAchievements();

        // Set up global reference
        window.towerAchievements = this;
    }

    // Define all available achievements
    initializeAchievements() {
        return {
            // === GETTING STARTED ===
            'first_login': {
                id: 'first_login',
                title: '🏗️ Welcome to the Tower!',
                description: 'Log in to the Tower Dashboard for the first time',
                icon: '🎉',
                category: 'Getting Started',
                points: 10,
                rarity: 'common'
            },
            'stats_explorer': {
                id: 'stats_explorer',
                title: '📊 Stats Explorer',
                description: 'View your Tower Analytics for the first time',
                icon: '🔍',
                category: 'Getting Started',
                points: 5,
                rarity: 'common'
            },
            'wiki_searcher': {
                id: 'wiki_searcher',
                title: '📚 Knowledge Seeker',
                description: 'Use the wiki search feature',
                icon: '🔎',
                category: 'Getting Started',
                points: 10,
                rarity: 'common'
            },

            // === TIER PROGRESS (All Tiers 1-20) ===
            't1_beat': { id: 't1_beat', title: '🛡️ Tier 1 Complete', description: 'Complete Tier 1 - First steps', icon: '1️⃣', category: 'Tier Progress', points: 10, rarity: 'common' },
            't2_beat': { id: 't2_beat', title: '⚔️ Tier 2 Complete', description: 'Complete Tier 2 - Building momentum', icon: '2️⃣', category: 'Tier Progress', points: 15, rarity: 'common' },
            't3_beat': { id: 't3_beat', title: '🗡️ Tier 3 Complete', description: 'Complete Tier 3 - Getting serious', icon: '3️⃣', category: 'Tier Progress', points: 20, rarity: 'common' },
            't4_beat': { id: 't4_beat', title: '🏹 Tier 4 Complete', description: 'Complete Tier 4 - Rising power', icon: '4️⃣', category: 'Tier Progress', points: 25, rarity: 'common' },
            't5_beat': { id: 't5_beat', title: '🏅 Tier 5 Complete', description: 'Complete Tier 5 - Halfway milestone', icon: '5️⃣', category: 'Tier Progress', points: 30, rarity: 'uncommon' },
            't6_beat': { id: 't6_beat', title: '⚡ Tier 6 Complete', description: 'Complete Tier 6 - Advanced territory', icon: '6️⃣', category: 'Tier Progress', points: 35, rarity: 'uncommon' },
            't7_beat': { id: 't7_beat', title: '🔥 Tier 7 Complete', description: 'Complete Tier 7 - Lucky seven', icon: '7️⃣', category: 'Tier Progress', points: 40, rarity: 'uncommon' },
            't8_beat': { id: 't8_beat', title: '💎 Tier 8 Complete', description: 'Complete Tier 8 - Elite status', icon: '8️⃣', category: 'Tier Progress', points: 50, rarity: 'uncommon' },
            't9_beat': { id: 't9_beat', title: '👑 Tier 9 Complete', description: 'Complete Tier 9 - Almost double digits', icon: '9️⃣', category: 'Tier Progress', points: 60, rarity: 'rare' },
            't10_beat': { id: 't10_beat', title: '🌟 Tier 10 Complete', description: 'Complete Tier 10 - Double digit glory', icon: '🔟', category: 'Tier Progress', points: 75, rarity: 'rare' },
            't11_beat': { id: 't11_beat', title: '✨ Tier 11 Complete', description: 'Complete Tier 11 - Into the deep', icon: '1️⃣1️⃣', category: 'Tier Progress', points: 85, rarity: 'rare' },
            't12_beat': { id: 't12_beat', title: '🛡️ Tier 12 Complete', description: 'Complete Tier 12 - Battle veteran', icon: '1️⃣2️⃣', category: 'Tier Progress', points: 100, rarity: 'rare' },
            't13_beat': { id: 't13_beat', title: '🔮 Tier 13 Complete', description: 'Complete Tier 13 - Unlucky for enemies', icon: '1️⃣3️⃣', category: 'Tier Progress', points: 110, rarity: 'epic' },
            't14_beat': { id: 't14_beat', title: '⭐ Tier 14 Complete', description: 'Complete Tier 14 - Near legendary', icon: '1️⃣4️⃣', category: 'Tier Progress', points: 125, rarity: 'epic' },
            't15_beat': { id: 't15_beat', title: '🏆 Tier 15 Complete', description: 'Complete Tier 15 - Legendary achievement', icon: '1️⃣5️⃣', category: 'Tier Progress', points: 150, rarity: 'epic' },
            't16_beat': { id: 't16_beat', title: '🌠 Tier 16 Complete', description: 'Complete Tier 16 - Beyond legendary', icon: '1️⃣6️⃣', category: 'Tier Progress', points: 175, rarity: 'epic' },
            't17_beat': { id: 't17_beat', title: '💫 Tier 17 Complete', description: 'Complete Tier 17 - Ascending higher', icon: '1️⃣7️⃣', category: 'Tier Progress', points: 200, rarity: 'epic' },
            't18_beat': { id: 't18_beat', title: '🌌 Tier 18 Complete', description: 'Complete Tier 18 - Cosmic power', icon: '1️⃣8️⃣', category: 'Tier Progress', points: 225, rarity: 'legendary' },
            't19_beat': { id: 't19_beat', title: '🌟 Tier 19 Complete', description: 'Complete Tier 19 - Almost perfection', icon: '1️⃣9️⃣', category: 'Tier Progress', points: 275, rarity: 'legendary' },
            't20_beat': { id: 't20_beat', title: '👑 Tier 20 Master', description: 'Complete Tier 20 - Ultimate mastery achieved', icon: '2️⃣0️⃣', category: 'Tier Progress', points: 350, rarity: 'legendary' },

            // === WAVE MILESTONES ===
            'wave_100': {
                id: 'wave_100',
                title: '🌊 Century Surfer',
                description: 'Reach wave 100',
                icon: '💯',
                category: 'Wave Progress',
                points: 15,
                rarity: 'common'
            },
            'wave_500': {
                id: 'wave_500',
                title: '🌊 Wave Walker',
                description: 'Reach wave 500',
                icon: '🚶',
                category: 'Wave Progress',
                points: 25,
                rarity: 'uncommon'
            },
            'wave_1000': {
                id: 'wave_1000',
                title: '🌊 Wave Rider',
                description: 'Reach wave 1000',
                icon: '🏄',
                category: 'Wave Progress',
                points: 40,
                rarity: 'uncommon'
            },
            'wave_2500': {
                id: 'wave_2500',
                title: '🌊 Wave Crusher',
                description: 'Reach wave 2500',
                icon: '🏄‍♂️',
                category: 'Wave Progress',
                points: 60,
                rarity: 'rare'
            },
            'wave_5000': {
                id: 'wave_5000',
                title: '🌊 Wave Master',
                description: 'Reach wave 5000',
                icon: '🌊',
                category: 'Wave Progress',
                points: 80,
                rarity: 'rare'
            },
            'wave_10000': {
                id: 'wave_10000',
                title: '🌊 Wave God',
                description: 'Reach wave 10000 - Legendary endurance',
                icon: '🔱',
                category: 'Wave Progress',
                points: 150,
                rarity: 'epic'
            },

            // === COIN MILESTONES (Comprehensive) ===
            'coins_1k': { id: 'coins_1k', title: '💰 First Thousand', description: 'Earn 1,000 coins in a run', icon: '💵', category: 'Coin Milestones', points: 5, rarity: 'common' },
            'coins_10k': { id: 'coins_10k', title: '💰 Ten Thousand', description: 'Earn 10,000 coins in a run', icon: '💵', category: 'Coin Milestones', points: 10, rarity: 'common' },
            'coins_100k': { id: 'coins_100k', title: '💰 Hundred Thousand', description: 'Earn 100,000 coins in a run', icon: '💸', category: 'Coin Milestones', points: 15, rarity: 'common' },
            'coins_1m': { id: 'coins_1m', title: '💎 Millionaire', description: 'Earn 1 Million coins in a run', icon: '💎', category: 'Coin Milestones', points: 20, rarity: 'uncommon' },
            'coins_10m': { id: 'coins_10m', title: '💎 Ten Million', description: 'Earn 10 Million coins in a run', icon: '💍', category: 'Coin Milestones', points: 25, rarity: 'uncommon' },
            'coins_100m': { id: 'coins_100m', title: '💎 Hundred Million', description: 'Earn 100 Million coins in a run', icon: '👑', category: 'Coin Milestones', points: 30, rarity: 'uncommon' },
            'coins_1b': { id: 'coins_1b', title: '🤑 Billionaire', description: 'Earn 1 Billion coins in a run', icon: '🤑', category: 'Coin Milestones', points: 40, rarity: 'rare' },
            'coins_10b': { id: 'coins_10b', title: '🤑 Ten Billion', description: 'Earn 10 Billion coins in a run', icon: '💰', category: 'Coin Milestones', points: 50, rarity: 'rare' },
            'coins_100b': { id: 'coins_100b', title: '🤑 Hundred Billion', description: 'Earn 100 Billion coins in a run', icon: '🏦', category: 'Coin Milestones', points: 60, rarity: 'rare' },
            'coins_1t': { id: 'coins_1t', title: '💳 Trillionaire', description: 'Earn 1 Trillion coins in a run', icon: '💳', category: 'Coin Milestones', points: 75, rarity: 'epic' },
            'coins_10t': { id: 'coins_10t', title: '💳 Ten Trillion', description: 'Earn 10 Trillion coins in a run', icon: '🏧', category: 'Coin Milestones', points: 90, rarity: 'epic' },
            'coins_100t': { id: 'coins_100t', title: '💳 Hundred Trillion', description: 'Earn 100 Trillion coins in a run', icon: '🏛️', category: 'Coin Milestones', points: 110, rarity: 'epic' },
            'coins_1q': { id: 'coins_1q', title: '👑 Quadrillionaire', description: 'Earn 1 Quadrillion coins in a run', icon: '👑', category: 'Coin Milestones', points: 150, rarity: 'legendary' },
            'coins_10q': { id: 'coins_10q', title: '👑 Ten Quadrillion', description: 'Earn 10 Quadrillion coins in a run', icon: '💫', category: 'Coin Milestones', points: 200, rarity: 'legendary' },
            'coins_100q': { id: 'coins_100q', title: '👑 Hundred Quadrillion', description: 'Earn 100 Quadrillion coins in a run', icon: '✨', category: 'Coin Milestones', points: 250, rarity: 'legendary' },
            'coins_1qn': { id: 'coins_1qn', title: '🌟 Quintillionaire', description: 'Earn 1 Quintillion coins in a run', icon: '🌟', category: 'Coin Milestones', points: 300, rarity: 'legendary' },

            // === DAMAGE MILESTONES ===
            'damage_million': {
                id: 'damage_million',
                title: '⚔️ Million Damage',
                description: 'Deal 1 Million damage in a single run',
                icon: '💥',
                category: 'Damage Dealt',
                points: 30,
                rarity: 'uncommon'
            },
            'damage_billion': {
                id: 'damage_billion',
                title: '💀 Billion Damage',
                description: 'Deal 1 Billion damage in a single run',
                icon: '🔥',
                category: 'Damage Dealt',
                points: 60,
                rarity: 'rare'
            },
            'damage_trillion': {
                id: 'damage_trillion',
                title: '🌋 Trillion Damage',
                description: 'Deal 1 Trillion damage in a single run',
                icon: '💣',
                category: 'Damage Dealt',
                points: 120,
                rarity: 'epic'
            },

            // === ULTIMATE WEAPONS ===
            'black_hole_unlock': {
                id: 'black_hole_unlock',
                title: '⚫ Black Hole Master',
                description: 'Unlock and use Black Hole',
                icon: '🕳️',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },
            'death_wave_unlock': {
                id: 'death_wave_unlock',
                title: '💀 Death Wave Wielder',
                description: 'Unlock and use Death Wave',
                icon: '🌊',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },
            'golden_tower_unlock': {
                id: 'golden_tower_unlock',
                title: '🏰 Golden Tower Guardian',
                description: 'Unlock and use Golden Tower',
                icon: '👑',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },
            'chrono_field_unlock': {
                id: 'chrono_field_unlock',
                title: '⏰ Time Master',
                description: 'Unlock and use Chrono Field',
                icon: '🕰️',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },
            'chain_lightning_unlock': {
                id: 'chain_lightning_unlock',
                title: '⚡ Lightning Lord',
                description: 'Unlock and use Chain Lightning',
                icon: '🌩️',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },
            'inner_mines_unlock': {
                id: 'inner_mines_unlock',
                title: '💣 Mine Master',
                description: 'Unlock and use Inner Land Mines',
                icon: '⛏️',
                category: 'Ultimate Weapons',
                points: 50,
                rarity: 'rare'
            },

            // === BOTS & SPECIAL ABILITIES ===
            'bot_collector': {
                id: 'bot_collector',
                title: '🤖 Bot Enthusiast',
                description: 'Use 3 different bot types',
                icon: '🔧',
                category: 'Bots & Abilities',
                points: 40,
                rarity: 'uncommon'
            },
            'golden_bot_master': {
                id: 'golden_bot_master',
                title: '🤖 Golden Bot Expert',
                description: 'Successfully use Golden Bot 10 times',
                icon: '🥇',
                category: 'Bots & Abilities',
                points: 60,
                rarity: 'rare'
            },

            // === ELITE CELLS & UPGRADES ===
            'elite_cells_100': {
                id: 'elite_cells_100',
                title: '🔋 Cell Collector',
                description: 'Earn 100 Elite Cells',
                icon: '⚡',
                category: 'Elite Progress',
                points: 35,
                rarity: 'uncommon'
            },
            'elite_cells_1000': {
                id: 'elite_cells_1000',
                title: '🔋 Cell Hoarder',
                description: 'Earn 1000 Elite Cells',
                icon: '🔌',
                category: 'Elite Progress',
                points: 70,
                rarity: 'rare'
            },

            // === MODULES & EQUIPMENT ===
            'module_master': {
                id: 'module_master',
                title: '🔧 Module Expert',
                description: 'Equip 10 modules in a single run',
                icon: '⚙️',
                category: 'Equipment',
                points: 45,
                rarity: 'uncommon'
            },
            'rare_module_find': {
                id: 'rare_module_find',
                title: '💎 Rare Module Hunter',
                description: 'Find your first rare module',
                icon: '🎯',
                category: 'Equipment',
                points: 55,
                rarity: 'rare'
            },

            // === LABORATORY RESEARCH ===
            'lab_researcher': {
                id: 'lab_researcher',
                title: '🧪 Lab Researcher',
                description: 'Complete 10 lab upgrades',
                icon: '🔬',
                category: 'Laboratory',
                points: 40,
                rarity: 'uncommon'
            },
            'lab_master': {
                id: 'lab_master',
                title: '🧪 Lab Master',
                description: 'Complete 50 lab upgrades',
                icon: '⚗️',
                category: 'Laboratory',
                points: 80,
                rarity: 'rare'
            },

            // === TOURNAMENTS & COMPETITION ===
            'tournament_participant': {
                id: 'tournament_participant',
                title: '🏆 Tournament Fighter',
                description: 'Participate in your first tournament',
                icon: '🥊',
                category: 'Tournaments',
                points: 35,
                rarity: 'uncommon'
            },
            'tournament_winner': {
                id: 'tournament_winner',
                title: '🏆 Tournament Champion',
                description: 'Win a tournament',
                icon: '👑',
                category: 'Tournaments',
                points: 100,
                rarity: 'epic'
            },

            // === SURVIVAL & ENDURANCE ===
            'survivor_1hour': {
                id: 'survivor_1hour',
                title: '⏱️ One Hour Warrior',
                description: 'Survive for 1 hour in a single run',
                icon: '🕐',
                category: 'Survival',
                points: 30,
                rarity: 'uncommon'
            },
            'survivor_6hours': {
                id: 'survivor_6hours',
                title: '⏱️ Marathon Fighter',
                description: 'Survive for 6 hours in a single run',
                icon: '🕕',
                category: 'Survival',
                points: 75,
                rarity: 'rare'
            },
            'survivor_12hours': {
                id: 'survivor_12hours',
                title: '⏱️ Endurance Legend',
                description: 'Survive for 12 hours in a single run',
                icon: '🕐',
                category: 'Survival',
                points: 150,
                rarity: 'epic'
            },

            // === CARDS & STRATEGY ===
            'card_collector': {
                id: 'card_collector',
                title: '🃏 Card Collector',
                description: 'Collect 10 different cards',
                icon: '🎴',
                category: 'Cards',
                points: 35,
                rarity: 'uncommon'
            },
            'card_master': {
                id: 'card_master',
                title: '🃏 Card Master',
                description: 'Achieve Card Mastery level 10',
                icon: '🎭',
                category: 'Cards',
                points: 80,
                rarity: 'rare'
            },

            // === ENGAGEMENT & DEDICATION ===
            'first_upload': { id: 'first_upload', title: '📤 First Upload', description: 'Upload your first run', icon: '🎉', category: 'Engagement', points: 10, rarity: 'common' },
            'upload_10': { id: 'upload_10', title: '📤 Regular Uploader', description: 'Upload 10 runs', icon: '📊', category: 'Engagement', points: 25, rarity: 'uncommon' },
            'upload_50': { id: 'upload_50', title: '📤 Active Tracker', description: 'Upload 50 runs', icon: '📈', category: 'Engagement', points: 50, rarity: 'rare' },
            'upload_100': { id: 'upload_100', title: '📤 Data Hoarder', description: 'Upload 100 runs', icon: '💾', category: 'Engagement', points: 100, rarity: 'epic' },
            'upload_500': { id: 'upload_500', title: '📤 Statistics Master', description: 'Upload 500 runs', icon: '🏆', category: 'Engagement', points: 250, rarity: 'legendary' },

            'streak_3': { id: 'streak_3', title: '🔥 3-Day Streak', description: 'Upload runs 3 days in a row', icon: '🔥', category: 'Engagement', points: 15, rarity: 'common' },
            'streak_7': { id: 'streak_7', title: '🔥 Week Warrior', description: 'Upload runs 7 days in a row', icon: '💪', category: 'Engagement', points: 35, rarity: 'uncommon' },
            'streak_14': { id: 'streak_14', title: '🔥 Fortnight Fighter', description: 'Upload runs 14 days in a row', icon: '⚡', category: 'Engagement', points: 75, rarity: 'rare' },
            'streak_30': { id: 'streak_30', title: '🔥 Month Master', description: 'Upload runs 30 days in a row', icon: '📅', category: 'Engagement', points: 150, rarity: 'epic' },
            'streak_60': { id: 'streak_60', title: '🔥 Dedication Legend', description: 'Upload runs 60 days in a row', icon: '👑', category: 'Engagement', points: 300, rarity: 'legendary' },
            'streak_100': { id: 'streak_100', title: '🔥 Century Streak', description: 'Upload runs 100 days in a row', icon: '💫', category: 'Engagement', points: 500, rarity: 'legendary' },

            // === SPECIAL & CHALLENGE ===
            'speedrun_t1': {
                id: 'speedrun_t1',
                title: '⚡ Speed Demon',
                description: 'Complete Tier 1 in under 30 minutes',
                icon: '💨',
                category: 'Special Challenge',
                points: 100,
                rarity: 'epic'
            },
            'no_damage_tier': {
                id: 'no_damage_tier',
                title: '🛡️ Untouchable',
                description: 'Complete a tier without taking damage',
                icon: '✨',
                category: 'Special Challenge',
                points: 120,
                rarity: 'epic'
            },
            'orb_master': {
                id: 'orb_master',
                title: '⚫ Orb Specialist',
                description: 'Use orbs effectively in 10 runs',
                icon: '🔮',
                category: 'Special Challenge',
                points: 60,
                rarity: 'rare'
            },
            'orbless_hero': {
                id: 'orbless_hero',
                title: '🚫 Orbless Hero',
                description: 'Complete Tier 5 without using orbs',
                icon: '🌟',
                category: 'Special Challenge',
                points: 100,
                rarity: 'epic'
            }
        };
    }

    // Load user achievements from localStorage
    loadUserAchievements() {
        try {
            const saved = localStorage.getItem('tower_achievements');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }

        return {
            unlocked: [],
            points: 0,
            firstLogin: null,
            lastLogin: null,
            loginStreak: 0,
            uploadStreak: 0,
            lastUploadDate: null,
            totalUploads: 0,
            uploadDates: [], // Track upload dates for streak calculation
            stats: {
                wikiSearches: 0,
                dashboardViews: 0,
                botsUsed: 0,
                tournamentsParticipated: 0,
                cardsCollected: 0,
                ultimateWeaponsUsed: {},
                elitesCompleted: {}
            }
        };
    }

    // Save user achievements to localStorage
    saveUserAchievements() {
        try {
            localStorage.setItem('tower_achievements', JSON.stringify(this.userAchievements));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    // Check if user has achieved any new achievements
    checkAchievements() {
        // First login check
        if (!this.userAchievements.firstLogin) {
            this.userAchievements.firstLogin = Date.now();
            this.unlockAchievement('first_login');
        }

        // Update login streak
        this.updateLoginStreak();

        // Check for stats explorer achievement
        if (this.userAchievements.stats.dashboardViews > 0 && !this.isUnlocked('stats_explorer')) {
            this.unlockAchievement('stats_explorer');
        }

        // Save after checking
        this.saveUserAchievements();
    }

    // Update login streak
    updateLoginStreak() {
        const now = Date.now();
        const lastLogin = this.userAchievements.lastLogin;
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (!lastLogin) {
            this.userAchievements.loginStreak = 1;
        } else {
            const daysSinceLastLogin = Math.floor((now - lastLogin) / oneDayMs);

            if (daysSinceLastLogin === 1) {
                // Consecutive day
                this.userAchievements.loginStreak += 1;
            } else if (daysSinceLastLogin > 1) {
                // Streak broken
                this.userAchievements.loginStreak = 1;
            }
            // Same day = no change
        }

        this.userAchievements.lastLogin = now;

        // Check for active user achievement
        if (this.userAchievements.loginStreak >= 7 && !this.isUnlocked('active_user')) {
            this.unlockAchievement('active_user');
        }
    }

    // Check if achievement is unlocked
    isUnlocked(achievementId) {
        return this.userAchievements.unlocked.includes(achievementId);
    }

    // Unlock an achievement
    unlockAchievement(achievementId) {
        if (this.isUnlocked(achievementId)) {
            return; // Already unlocked
        }

        const achievement = this.achievements[achievementId];
        if (!achievement) {
            console.error('Achievement not found:', achievementId);
            return;
        }

        // Add to unlocked list
        this.userAchievements.unlocked.push(achievementId);
        this.userAchievements.points += achievement.points;

        // Show achievement notification
        this.showAchievementNotification(achievement);

        // Save
        this.saveUserAchievements();

        console.log(`🏆 Achievement unlocked: ${achievement.title}`);
    }

    // Show achievement notification
    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.title}</div>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
                <div class="achievement-close" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Add entrance animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    // Create achievements UI
    createAchievementsUI() {
        return `
            <div class="achievements-container">
                <div class="achievements-header">
                    <h3 class="achievements-title">🏆 Achievements</h3>
                    <div class="achievements-summary">
                        <span class="achievement-count">${this.userAchievements.unlocked.length}/${Object.keys(this.achievements).length}</span>
                        <span class="achievement-points">${this.userAchievements.points} points</span>
                    </div>
                </div>

                <div class="achievements-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.userAchievements.unlocked.length / Object.keys(this.achievements).length) * 100}%"></div>
                    </div>
                </div>

                <div class="achievements-list" id="achievementsList">
                    ${this.renderAchievementsList()}
                </div>
            </div>
        `;
    }

    // Render achievements list
    renderAchievementsList() {
        const categories = {};

        // Group achievements by category
        Object.values(this.achievements).forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });

        return Object.entries(categories).map(([category, achievements]) => `
            <div class="achievement-category">
                <h4 class="category-title">${category}</h4>
                <div class="category-achievements">
                    ${achievements.map(achievement => this.renderAchievement(achievement)).join('')}
                </div>
            </div>
        `).join('');
    }

    // Render individual achievement
    renderAchievement(achievement) {
        const isUnlocked = this.isUnlocked(achievement.id);

        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}">
                <div class="achievement-icon-container">
                    <span class="achievement-icon">${achievement.icon}</span>
                    ${isUnlocked ? '<div class="achievement-checkmark">✓</div>' : ''}
                </div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-meta">
                        <span class="achievement-points">${achievement.points} points</span>
                        <span class="achievement-rarity">${achievement.rarity}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Public methods for triggering achievements
    onWikiSearch() {
        this.userAchievements.stats.wikiSearches += 1;
        if (!this.isUnlocked('wiki_searcher')) {
            this.unlockAchievement('wiki_searcher');
        }
        this.saveUserAchievements();
    }

    onDashboardView() {
        this.userAchievements.stats.dashboardViews += 1;
        if (!this.isUnlocked('stats_explorer')) {
            this.unlockAchievement('stats_explorer');
        }
        this.saveUserAchievements();
    }

    onCashMilestone(cash) {
        const cashNum = typeof cash === 'string' ? this.parseFormattedNumber(cash) : cash;

        // Check ALL cash milestones from highest to lowest (cascading unlocks)
        if (cashNum >= 1e18 && !this.isUnlocked('coins_1qn')) this.unlockAchievement('coins_1qn');
        if (cashNum >= 1e17 && !this.isUnlocked('coins_100q')) this.unlockAchievement('coins_100q');
        if (cashNum >= 1e16 && !this.isUnlocked('coins_10q')) this.unlockAchievement('coins_10q');
        if (cashNum >= 1e15 && !this.isUnlocked('coins_1q')) this.unlockAchievement('coins_1q');
        if (cashNum >= 1e14 && !this.isUnlocked('coins_100t')) this.unlockAchievement('coins_100t');
        if (cashNum >= 1e13 && !this.isUnlocked('coins_10t')) this.unlockAchievement('coins_10t');
        if (cashNum >= 1e12 && !this.isUnlocked('coins_1t')) this.unlockAchievement('coins_1t');
        if (cashNum >= 1e11 && !this.isUnlocked('coins_100b')) this.unlockAchievement('coins_100b');
        if (cashNum >= 1e10 && !this.isUnlocked('coins_10b')) this.unlockAchievement('coins_10b');
        if (cashNum >= 1e9 && !this.isUnlocked('coins_1b')) this.unlockAchievement('coins_1b');
        if (cashNum >= 1e8 && !this.isUnlocked('coins_100m')) this.unlockAchievement('coins_100m');
        if (cashNum >= 1e7 && !this.isUnlocked('coins_10m')) this.unlockAchievement('coins_10m');
        if (cashNum >= 1e6 && !this.isUnlocked('coins_1m')) this.unlockAchievement('coins_1m');
        if (cashNum >= 1e5 && !this.isUnlocked('coins_100k')) this.unlockAchievement('coins_100k');
        if (cashNum >= 1e4 && !this.isUnlocked('coins_10k')) this.unlockAchievement('coins_10k');
        if (cashNum >= 1e3 && !this.isUnlocked('coins_1k')) this.unlockAchievement('coins_1k');
    }

    onTierComplete(tier) {
        const tierNum = parseInt(tier);

        // Check ALL tier achievements from highest to lowest (cascading unlocks)
        if (tierNum >= 20 && !this.isUnlocked('t20_beat')) this.unlockAchievement('t20_beat');
        if (tierNum >= 19 && !this.isUnlocked('t19_beat')) this.unlockAchievement('t19_beat');
        if (tierNum >= 18 && !this.isUnlocked('t18_beat')) this.unlockAchievement('t18_beat');
        if (tierNum >= 17 && !this.isUnlocked('t17_beat')) this.unlockAchievement('t17_beat');
        if (tierNum >= 16 && !this.isUnlocked('t16_beat')) this.unlockAchievement('t16_beat');
        if (tierNum >= 15 && !this.isUnlocked('t15_beat')) this.unlockAchievement('t15_beat');
        if (tierNum >= 14 && !this.isUnlocked('t14_beat')) this.unlockAchievement('t14_beat');
        if (tierNum >= 13 && !this.isUnlocked('t13_beat')) this.unlockAchievement('t13_beat');
        if (tierNum >= 12 && !this.isUnlocked('t12_beat')) this.unlockAchievement('t12_beat');
        if (tierNum >= 11 && !this.isUnlocked('t11_beat')) this.unlockAchievement('t11_beat');
        if (tierNum >= 10 && !this.isUnlocked('t10_beat')) this.unlockAchievement('t10_beat');
        if (tierNum >= 9 && !this.isUnlocked('t9_beat')) this.unlockAchievement('t9_beat');
        if (tierNum >= 8 && !this.isUnlocked('t8_beat')) this.unlockAchievement('t8_beat');
        if (tierNum >= 7 && !this.isUnlocked('t7_beat')) this.unlockAchievement('t7_beat');
        if (tierNum >= 6 && !this.isUnlocked('t6_beat')) this.unlockAchievement('t6_beat');
        if (tierNum >= 5 && !this.isUnlocked('t5_beat')) this.unlockAchievement('t5_beat');
        if (tierNum >= 4 && !this.isUnlocked('t4_beat')) this.unlockAchievement('t4_beat');
        if (tierNum >= 3 && !this.isUnlocked('t3_beat')) this.unlockAchievement('t3_beat');
        if (tierNum >= 2 && !this.isUnlocked('t2_beat')) this.unlockAchievement('t2_beat');
        if (tierNum >= 1 && !this.isUnlocked('t1_beat')) this.unlockAchievement('t1_beat');
    }

    onWaveReached(wave) {
        const waveNum = parseInt(wave);

        // Check all wave achievements (remove else if to allow multiple unlocks)
        if (waveNum >= 10000 && !this.isUnlocked('wave_10000')) {
            this.unlockAchievement('wave_10000');
        }
        if (waveNum >= 5000 && !this.isUnlocked('wave_5000')) {
            this.unlockAchievement('wave_5000');
        }
        if (waveNum >= 2500 && !this.isUnlocked('wave_2500')) {
            this.unlockAchievement('wave_2500');
        }
        if (waveNum >= 1000 && !this.isUnlocked('wave_1000')) {
            this.unlockAchievement('wave_1000');
        }
        if (waveNum >= 500 && !this.isUnlocked('wave_500')) {
            this.unlockAchievement('wave_500');
        }
        if (waveNum >= 100 && !this.isUnlocked('wave_100')) {
            this.unlockAchievement('wave_100');
        }
    }

    // New tracking methods for Tower-specific achievements
    onDamageDealt(damage) {
        const damageNum = typeof damage === 'string' ? this.parseFormattedNumber(damage) : damage;

        if (damageNum >= 1e30 && !this.isUnlocked('damage_nonillion')) {
            this.unlockAchievement('damage_nonillion');
        } else if (damageNum >= 1e24 && !this.isUnlocked('damage_septillion')) {
            this.unlockAchievement('damage_septillion');
        } else if (damageNum >= 1e18 && !this.isUnlocked('damage_quintillion')) {
            this.unlockAchievement('damage_quintillion');
        }
    }

    onUltimateWeaponUsed(weaponType) {
        this.userAchievements.stats.ultimateWeaponsUsed = this.userAchievements.stats.ultimateWeaponsUsed || {};
        this.userAchievements.stats.ultimateWeaponsUsed[weaponType] = true;

        // Check specific ultimate weapon achievements
        if (weaponType === 'black_hole' && !this.isUnlocked('black_hole_master')) {
            this.unlockAchievement('black_hole_master');
        } else if (weaponType === 'death_wave' && !this.isUnlocked('death_wave_master')) {
            this.unlockAchievement('death_wave_master');
        } else if (weaponType === 'golden_tower' && !this.isUnlocked('golden_tower_master')) {
            this.unlockAchievement('golden_tower_master');
        }

        // Check for arsenal master (all ultimate weapons)
        const knownWeapons = ['black_hole', 'death_wave', 'golden_tower', 'chrono_field', 'smart_missiles'];
        const usedWeapons = Object.keys(this.userAchievements.stats.ultimateWeaponsUsed || {});
        if (usedWeapons.length >= knownWeapons.length && !this.isUnlocked('arsenal_master')) {
            this.unlockAchievement('arsenal_master');
        }

        this.saveUserAchievements();
    }

    onBotUsed() {
        this.userAchievements.stats.botsUsed = (this.userAchievements.stats.botsUsed || 0) + 1;

        if (this.userAchievements.stats.botsUsed >= 100 && !this.isUnlocked('bot_commander')) {
            this.unlockAchievement('bot_commander');
        } else if (this.userAchievements.stats.botsUsed >= 1 && !this.isUnlocked('bot_master')) {
            this.unlockAchievement('bot_master');
        }

        this.saveUserAchievements();
    }

    onEliteCompleted(eliteType) {
        this.userAchievements.stats.elitesCompleted = this.userAchievements.stats.elitesCompleted || {};
        this.userAchievements.stats.elitesCompleted[eliteType] = true;

        const completedElites = Object.keys(this.userAchievements.stats.elitesCompleted).length;

        if (completedElites >= 10 && !this.isUnlocked('elite_conqueror')) {
            this.unlockAchievement('elite_conqueror');
        } else if (completedElites >= 5 && !this.isUnlocked('elite_hunter')) {
            this.unlockAchievement('elite_hunter');
        } else if (completedElites >= 1 && !this.isUnlocked('elite_slayer')) {
            this.unlockAchievement('elite_slayer');
        }

        this.saveUserAchievements();
    }

    onModuleEquipped(moduleCount) {
        if (moduleCount >= 10 && !this.isUnlocked('module_master')) {
            this.unlockAchievement('module_master');
        } else if (moduleCount >= 5 && !this.isUnlocked('module_collector')) {
            this.unlockAchievement('module_collector');
        }
    }

    onLabResearchCompleted(researchCount) {
        if (researchCount >= 20 && !this.isUnlocked('lab_genius')) {
            this.unlockAchievement('lab_genius');
        } else if (researchCount >= 10 && !this.isUnlocked('researcher')) {
            this.unlockAchievement('researcher');
        } else if (researchCount >= 1 && !this.isUnlocked('scientist')) {
            this.unlockAchievement('scientist');
        }
    }

    onTournamentParticipated() {
        this.userAchievements.stats.tournamentsParticipated = (this.userAchievements.stats.tournamentsParticipated || 0) + 1;

        if (this.userAchievements.stats.tournamentsParticipated >= 10 && !this.isUnlocked('tournament_veteran')) {
            this.unlockAchievement('tournament_veteran');
        } else if (this.userAchievements.stats.tournamentsParticipated >= 1 && !this.isUnlocked('tournament_competitor')) {
            this.unlockAchievement('tournament_competitor');
        }

        this.saveUserAchievements();
    }

    onSurvivalTimeReached(minutes) {
        if (minutes >= 180 && !this.isUnlocked('survival_legend')) {
            this.unlockAchievement('survival_legend');
        } else if (minutes >= 60 && !this.isUnlocked('survival_expert')) {
            this.unlockAchievement('survival_expert');
        } else if (minutes >= 30 && !this.isUnlocked('survival_specialist')) {
            this.unlockAchievement('survival_specialist');
        }
    }

    onCardCollected() {
        this.userAchievements.stats.cardsCollected = (this.userAchievements.stats.cardsCollected || 0) + 1;

        if (this.userAchievements.stats.cardsCollected >= 50 && !this.isUnlocked('card_master')) {
            this.unlockAchievement('card_master');
        } else if (this.userAchievements.stats.cardsCollected >= 10 && !this.isUnlocked('card_collector')) {
            this.unlockAchievement('card_collector');
        }

        this.saveUserAchievements();
    }

    onDailyStreak(days) {
        if (days >= 30 && !this.isUnlocked('dedication_legend')) {
            this.unlockAchievement('dedication_legend');
        } else if (days >= 7 && !this.isUnlocked('week_warrior')) {
            this.unlockAchievement('week_warrior');
        }
    }

    // Called when user uploads a run
    onRunUploaded(runData) {
        // Initialize upload dates array if it doesn't exist (backwards compatibility)
        if (!this.userAchievements.uploadDates) {
            this.userAchievements.uploadDates = [];
        }

        // Increment total uploads
        this.userAchievements.totalUploads = (this.userAchievements.totalUploads || 0) + 1;

        // Get today's date (YYYY-MM-DD format)
        const today = new Date().toISOString().split('T')[0];

        // Track upload date for streak calculation
        if (!this.userAchievements.uploadDates.includes(today)) {
            this.userAchievements.uploadDates.push(today);
        }

        // Update upload streak
        this.updateUploadStreak();

        // Check upload count achievements
        const uploads = this.userAchievements.totalUploads;
        if (uploads >= 500 && !this.isUnlocked('upload_500')) this.unlockAchievement('upload_500');
        if (uploads >= 100 && !this.isUnlocked('upload_100')) this.unlockAchievement('upload_100');
        if (uploads >= 50 && !this.isUnlocked('upload_50')) this.unlockAchievement('upload_50');
        if (uploads >= 10 && !this.isUnlocked('upload_10')) this.unlockAchievement('upload_10');
        if (uploads >= 1 && !this.isUnlocked('first_upload')) this.unlockAchievement('first_upload');

        // Check streak achievements
        const streak = this.userAchievements.uploadStreak;
        if (streak >= 100 && !this.isUnlocked('streak_100')) this.unlockAchievement('streak_100');
        if (streak >= 60 && !this.isUnlocked('streak_60')) this.unlockAchievement('streak_60');
        if (streak >= 30 && !this.isUnlocked('streak_30')) this.unlockAchievement('streak_30');
        if (streak >= 14 && !this.isUnlocked('streak_14')) this.unlockAchievement('streak_14');
        if (streak >= 7 && !this.isUnlocked('streak_7')) this.unlockAchievement('streak_7');
        if (streak >= 3 && !this.isUnlocked('streak_3')) this.unlockAchievement('streak_3');

        // Check tier achievement
        if (runData && runData.tier) {
            this.onTierComplete(runData.tier);
        }

        // Check coin achievement
        if (runData && runData.coins) {
            this.onCashMilestone(runData.coins);
        }

        // Check wave achievement
        if (runData && runData.wave) {
            this.onWaveReached(runData.wave);
        }

        this.saveUserAchievements();

        console.log(`📤 Run uploaded! Total: ${uploads}, Streak: ${streak} days 🔥`);
    }

    // Update upload streak based on upload dates
    updateUploadStreak() {
        if (!this.userAchievements.uploadDates || this.userAchievements.uploadDates.length === 0) {
            this.userAchievements.uploadStreak = 0;
            return;
        }

        // Sort dates in descending order (most recent first)
        const sortedDates = this.userAchievements.uploadDates.sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        let streak = 0;
        let checkDate = new Date(today);

        // Count consecutive days backwards from today
        for (let i = 0; i < sortedDates.length; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];

            if (sortedDates.includes(dateStr)) {
                streak++;
                // Move to previous day
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Streak broken
                break;
            }
        }

        this.userAchievements.uploadStreak = streak;
        console.log(`🔥 Upload streak: ${streak} days`);
    }

    // Parse formatted numbers (e.g., "1.5M" -> 1500000)
    parseFormattedNumber(str) {
        if (typeof str !== 'string') return str;

        const multipliers = {
            'K': 1e3,
            'M': 1e6,
            'B': 1e9,
            'T': 1e12,
            'Q': 1e15
        };

        const match = str.match(/([\d.]+)([KMBTQ]?)/);
        if (match) {
            const [, number, suffix] = match;
            return parseFloat(number) * (multipliers[suffix] || 1);
        }

        return parseFloat(str.replace(/,/g, '')) || 0;
    }

    // Inject achievements into a container
    injectIntoContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.createAchievementsUI();
        }
    }

    // Inject small achievements widget into Tower Analytics
    injectAnalyticsWidget() {
        const analyticsSection = document.getElementById('achievementsSection');
        if (analyticsSection && !analyticsSection.innerHTML) {
            const summary = this.getAchievementSummary();
            analyticsSection.innerHTML = `
                <div class="achievement-summary-widget">
                    <div class="widget-title">🏆 Achievements Progress</div>
                    <div class="widget-stats">
                        <div class="stat-item">
                            <span class="stat-value">${summary.unlocked}</span>
                            <span class="stat-label">Unlocked</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${summary.points}</span>
                            <span class="stat-label">Points</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${summary.percentage}%</span>
                            <span class="stat-label">Complete</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">🔥${summary.streak}</span>
                            <span class="stat-label">Streak</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Get achievement summary for display
    getAchievementSummary() {
        return {
            total: Object.keys(this.achievements).length,
            unlocked: this.userAchievements.unlocked.length,
            points: this.userAchievements.points,
            percentage: Math.round((this.userAchievements.unlocked.length / Object.keys(this.achievements).length) * 100),
            streak: this.userAchievements.loginStreak
        };
    }
}

// Initialize achievements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.towerAchievements = new TowerAchievements();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TowerAchievements;
}