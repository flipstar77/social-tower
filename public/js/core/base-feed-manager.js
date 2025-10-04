/**
 * Base Feed Manager
 * Abstract base class for RSS/feed management (YouTube, Reddit, etc.)
 */

class BaseFeedManager {
    constructor(config = {}) {
        this.items = [];
        this.filteredItems = [];
        this.lastUpdated = null;
        this.updateInterval = config.updateInterval || 300000;
        this.maxItems = config.maxItems || 50;
        this.selectedFilters = new Set();
        this.currentSort = config.defaultSort || 'newest';

        // Services
        this.apiClient = new ApiClient();
        this.cache = window.cacheService || new CacheService();

        // Config
        this.config = config;

        // State
        this.isInitialized = false;
    }

    /**
     * Initialize the feed manager
     */
    async init() {
        if (this.isInitialized) return;

        console.log(`🔧 Initializing ${this.constructor.name}...`);

        this.loadCachedData();
        this.setupPeriodicUpdate();
        this.setupFilterEvents();

        await this.loadData();

        this.isInitialized = true;
        console.log(`✅ ${this.constructor.name} initialized`);
    }

    /**
     * Load data - override in subclass
     */
    async loadData(forceRefresh = false) {
        throw new Error('loadData() must be implemented by subclass');
    }

    /**
     * Parse individual item - override in subclass
     */
    parseItem(rawData) {
        throw new Error('parseItem() must be implemented by subclass');
    }

    /**
     * Create tile element - override in subclass
     */
    createTile(item) {
        throw new Error('createTile() must be implemented by subclass');
    }

    /**
     * Get grid selector - override in subclass
     */
    getGridSelector() {
        throw new Error('getGridSelector() must be implemented by subclass');
    }

    /**
     * Load cached data from localStorage
     */
    loadCachedData() {
        try {
            const cacheKey = this.config.cacheKey;
            if (!cacheKey) return;

            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.items = cached.items || [];
                this.lastUpdated = cached.lastUpdated ? new Date(cached.lastUpdated) : null;
                console.log(`📦 Loaded ${this.items.length} items from cache`);
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    }

    /**
     * Save data to cache
     */
    saveToCache() {
        try {
            const cacheKey = this.config.cacheKey;
            if (!cacheKey) return;

            const data = {
                items: this.items,
                lastUpdated: this.lastUpdated
            };

            this.cache.set(cacheKey, data, this.config.cacheMaxAge);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    /**
     * Setup periodic data updates
     */
    setupPeriodicUpdate() {
        setInterval(() => {
            console.log(`🔄 Periodic update for ${this.constructor.name}`);
            this.loadData();
        }, this.updateInterval);
    }

    /**
     * Setup filter event listeners - common logic
     */
    setupFilterEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bindFilterEvents();
        });

        if (document.readyState !== 'loading') {
            this.bindFilterEvents();
        }
    }

    /**
     * Bind filter UI events - override for custom filters
     */
    bindFilterEvents() {
        // Override in subclass for specific filter implementations
    }

    /**
     * Apply filters to items
     */
    applyFilters() {
        let filtered = [...this.items];

        // Apply custom filters (override in subclass)
        filtered = this.applyCustomFilters(filtered);

        // Apply sorting
        filtered = this.applySorting(filtered);

        this.filteredItems = filtered;
    }

    /**
     * Apply custom filters - override in subclass
     */
    applyCustomFilters(items) {
        return items;
    }

    /**
     * Apply sorting
     */
    applySorting(items) {
        switch (this.currentSort) {
            case 'newest':
                return items.sort((a, b) => b.publishDate - a.publishDate);
            case 'oldest':
                return items.sort((a, b) => a.publishDate - b.publishDate);
            default:
                return items;
        }
    }

    /**
     * Update the carousel/grid display
     */
    updateCarousel() {
        const grid = document.querySelector(this.getGridSelector());
        if (!grid) {
            console.warn(`Grid not found: ${this.getGridSelector()}`);
            return;
        }

        // Apply filters
        this.applyFilters();
        this.populateFilterUI();

        // Clear existing content
        grid.innerHTML = '';

        // Create tiles container
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';

        // Duplicate items for seamless carousel
        const itemsForCarousel = [...this.filteredItems, ...this.filteredItems];

        // Create tiles
        itemsForCarousel.forEach((item, index) => {
            const tile = this.createTile(item);
            tile.style.animationDelay = `${(index % this.filteredItems.length) * 0.1}s`;
            tilesContainer.appendChild(tile);
        });

        grid.appendChild(tilesContainer);
    }

    /**
     * Populate filter UI - override in subclass
     */
    populateFilterUI() {
        // Override in subclass
    }

    /**
     * Manual refresh triggered by user
     */
    async manualRefresh() {
        const refreshBtn = this.config.refreshButtonId ?
            document.getElementById(this.config.refreshButtonId) : null;

        if (refreshBtn) {
            refreshBtn.classList.add('refreshing');
        }

        try {
            await this.loadData(true);
            this.showNotification('Feed updated successfully!');
        } catch (error) {
            console.error('Error refreshing:', error);
            this.showNotification('Error updating feed', 'error');
        }

        if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `feed-notification notification-${type}`;
        notification.textContent = message;

        const color = type === 'error' ? '#F44336' : this.config.notificationColor || '#4CAF50';

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, ${color}, ${color}CC);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Open item in new tab
     */
    openItem(item) {
        if (item.url) {
            window.open(item.url, '_blank');
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.BaseFeedManager = BaseFeedManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseFeedManager;
}
