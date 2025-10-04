// Constants Configuration File for Tower Analytics
// Centralizes all hardcoded values for better maintainability

// ========== API CONFIGURATION ==========
export const API_CONFIG = {
    BASE_URL: 'http://localhost:6078/api/tower',
    VIDEOS_URL: 'http://localhost:6078/api/videos',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3
};

// ========== CHART COLORS ==========
export const CHART_COLORS = {
    TIER: {
        border: '#FB49C0',
        background: 'rgba(251, 73, 192, 0.1)'
    },
    WAVE: {
        border: '#31AFD6',
        background: 'rgba(49, 175, 214, 0.1)'
    },
    ENEMIES: {
        border: '#F5A623',
        background: 'rgba(245, 166, 35, 0.1)'
    },
    DAMAGE: {
        border: '#FF6B6B',
        background: 'rgba(255, 107, 107, 0.1)'
    },
    COINS: {
        border: '#26E2B3',
        background: 'rgba(38, 226, 179, 0.1)'
    }
};

// ========== GLASSMORPHISM THEME ==========
export const THEME_COLORS = {
    BACKGROUND_PRIMARY: '#232323',
    BACKGROUND_SECONDARY: '#161616',
    BACKGROUND_TERTIARY: '#1B1B1B',
    ACCENT_COLOR: '#26E2B3',
    ACCENT_SECONDARY: '#01A1F5',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#8A8B8C',
    BORDER_COLOR: 'rgba(255, 255, 255, 0.2)',
    BORDER_LIGHT: 'rgba(255, 255, 255, 0.1)'
};

// ========== ANIMATION DURATIONS ==========
export const ANIMATIONS = {
    FAST: 300,
    NORMAL: 500,
    SLOW: 800,
    CHART_ANIMATION: 750
};

// ========== MODULES CONFIGURATION ==========
export const MODULES_CONFIG = {
    MAX_ACTIVE_PER_CATEGORY: 1,
    STORAGE_KEY: 'uniqueModules:active',
    CATEGORIES: ['cannons', 'armor', 'generators', 'cores'],
    CATEGORY_COLORS: {
        cannons: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
        armor: 'linear-gradient(135deg, #5f6fee, #3742fa)',
        generators: 'linear-gradient(135deg, #26de81, #20bf6b)',
        cores: 'linear-gradient(135deg, #fed330, #f7b731)'
    }
};

// ========== CARDS CONFIGURATION ==========
export const CARDS_CONFIG = {
    STORAGE_KEY: 'activeCards',
    MAX_CARDS: 21,
    GRID_MIN_WIDTH: 180,
    PRESETS: {
        FARM: {
            name: '🌾 Farm Setup',
            cards: ['Cash Card', 'Coins Card', 'Critical Coin Card', 'Free Upgrades Card', 'Attack Speed Card', 'Damage Card', 'Range Card']
        },
        TOURNAMENT: {
            name: '🏆 Tournament Setup',
            cards: ['Damage Card', 'Critical Chance Card', 'Attack Speed Card', 'Death Ray Card', 'Plasma Cannon Card', 'Super Tower Card', 'Ultimate Crit Card', 'Berserker Card']
        },
        PUSH: {
            name: '📈 Push Setup',
            cards: ['Damage Card', 'Health Card', 'Health Regen Card', 'Extra Defense Card', 'Death Ray Card', 'Energy Shield Card', 'Recovery Package Card', 'Second Wind Card']
        },
        DEFENSE: {
            name: '🛡️ Defense Setup',
            cards: ['Health Card', 'Health Regen Card', 'Extra Defense Card', 'Fortress Card', 'Energy Shield Card', 'Slow Aura Card', 'Land Mine Stun Card', 'Recovery Package Card']
        }
    }
};

// ========== CHART CONFIGURATION ==========
export const CHART_CONFIG = {
    DEFAULT_ANIMATION_DURATION: 750,
    RESPONSIVE: true,
    MAINTAIN_ASPECT_RATIO: false,
    SCALES: {
        Y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#8A8B8C'
            }
        },
        X: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#8A8B8C'
            }
        }
    },
    PLUGINS: {
        legend: {
            labels: {
                color: '#FFFFFF'
            }
        }
    }
};

// ========== NOTIFICATION SETTINGS ==========
export const NOTIFICATIONS = {
    DURATION: {
        SUCCESS: 3000,
        ERROR: 5000,
        WARNING: 4000,
        INFO: 2000
    },
    POSITION: 'top-right'
};

// ========== LOCAL STORAGE KEYS ==========
export const STORAGE_KEYS = {
    ACTIVE_MODULES: 'uniqueModules:active',
    ACTIVE_CARDS: 'activeCards',
    CHART_PREFERENCES: 'chartPreferences',
    THEME_SETTINGS: 'themeSettings',
    FILTER_SETTINGS: 'filterSettings'
};

// ========== REGEX PATTERNS ==========
export const PATTERNS = {
    NUMERIC_WITH_SUFFIX: /^([\d,\.]+)([KMGTPEZ]?)$/,
    TIME_FORMAT: /^(\d{1,2}):(\d{2})$/,
    PERCENTAGE: /^(\d+(?:\.\d+)?)%$/
};

// ========== ERROR MESSAGES ==========
export const ERROR_MESSAGES = {
    API_CONNECTION: 'Failed to connect to Tower Analytics API',
    INVALID_DATA: 'Invalid data format received',
    STORAGE_FAILED: 'Failed to save data to local storage',
    MODULE_LOAD_FAILED: 'Failed to load module configuration',
    CHART_RENDER_FAILED: 'Failed to render chart'
};

// ========== SUCCESS MESSAGES ==========
export const SUCCESS_MESSAGES = {
    DATA_SAVED: 'Data saved successfully',
    MODULE_ACTIVATED: 'Module activated',
    PRESET_LOADED: 'Preset loaded successfully',
    SETTINGS_UPDATED: 'Settings updated'
};