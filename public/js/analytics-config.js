// Tower Analytics Configuration
export const ANALYTICS_CONFIG = {
    API_BASE: 'http://localhost:6078/api/tower',

    CHART_TYPES: {
        POLAR_AREA: 'polarArea',
        BAR: 'bar',
        DOUGHNUT: 'doughnut',
        RADAR: 'radar'
    },

    DEFAULT_CHART_OPTIONS: {
        enemyChartType: 'bar',
        damageChartType: 'bar'
    },

    ENEMY_TYPES: [
        'Basic', 'Fast', 'Tank', 'Ranged', 'Boss', 'Protector',
        'Vampires', 'Rays', 'Scatters', 'Saboteurs', 'Commanders', 'Overcharges'
    ],

    DAMAGE_TYPES: [
        'Projectiles', 'Orb Damage', 'Thorn Damage', 'Land Mine',
        'Chain Lightning', 'Black Hole', 'Smart Missile', 'Death Ray',
        'Inner Land Mine', 'Death Wave', 'Swamp'
    ],

    COLORS: {
        DAMAGE_SOURCES: [
            '#FFD700', '#FF1744', '#00E676', '#2196F3', '#FF9800',
            '#9C27B0', '#F44336', '#4CAF50', '#673AB7', '#795548', '#607D8B'
        ],

        ENEMY_TYPES: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA'
        ],

        TIER_BADGES: {
            '1-5': 'linear-gradient(135deg, #4CAF50, #45a049)',
            '6-10': 'linear-gradient(135deg, #FF9800, #F57C00)',
            '11-15': 'linear-gradient(135deg, #F44336, #D32F2F)',
            '16-20': 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
            '21+': 'linear-gradient(135deg, #FFD700, #FFA000)'
        }
    },

    CHART_OPTIONS: {
        RESPONSIVE: true,
        MAINTAIN_ASPECT_RATIO: false,
        INTERACTION: {
            intersect: false,
            mode: 'nearest'
        },
        HOVER: {
            mode: 'nearest',
            intersect: false
        }
    },

    TIME_RANGES: {
        ALL: 'all',
        LAST_7_DAYS: '7d',
        LAST_30_DAYS: '30d',
        LAST_90_DAYS: '90d'
    },

    METRICS: {
        TIER: 'tier',
        WAVE: 'wave',
        COINS: 'coins',
        DAMAGE: 'damage'
    },

    NOTIFICATION_DURATION: 3000
};