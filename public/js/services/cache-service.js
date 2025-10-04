/**
 * Cache Service
 * Centralized localStorage management with expiration
 */

class CacheService {
    constructor() {
        this.storage = window.localStorage;
    }

    /**
     * Set cache item with optional expiration
     */
    set(key, value, maxAge = null) {
        try {
            const cacheItem = {
                data: value,
                timestamp: Date.now(),
                maxAge: maxAge
            };

            this.storage.setItem(key, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.error(`Cache set error for key "${key}":`, error);
            return false;
        }
    }

    /**
     * Get cache item (returns null if expired or not found)
     */
    get(key) {
        try {
            const item = this.storage.getItem(key);
            if (!item) return null;

            const cacheItem = JSON.parse(item);

            // Check if expired
            if (cacheItem.maxAge) {
                const age = Date.now() - cacheItem.timestamp;
                if (age > cacheItem.maxAge) {
                    this.remove(key);
                    return null;
                }
            }

            return cacheItem.data;
        } catch (error) {
            console.error(`Cache get error for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Check if cache item exists and is valid
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Remove cache item
     */
    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Cache remove error for key "${key}":`, error);
            return false;
        }
    }

    /**
     * Clear all cache items
     */
    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    /**
     * Get cache age in milliseconds
     */
    getAge(key) {
        try {
            const item = this.storage.getItem(key);
            if (!item) return null;

            const cacheItem = JSON.parse(item);
            return Date.now() - cacheItem.timestamp;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if cache is stale (older than maxAge)
     */
    isStale(key) {
        try {
            const item = this.storage.getItem(key);
            if (!item) return true;

            const cacheItem = JSON.parse(item);
            if (!cacheItem.maxAge) return false;

            const age = Date.now() - cacheItem.timestamp;
            return age > cacheItem.maxAge;
        } catch (error) {
            return true;
        }
    }

    /**
     * Get or fetch: return cached value or fetch fresh data
     */
    async getOrFetch(key, fetchFn, maxAge = null) {
        const cached = this.get(key);
        if (cached !== null) {
            console.log(`📦 Cache hit for "${key}"`);
            return cached;
        }

        console.log(`🔄 Cache miss for "${key}", fetching fresh data...`);
        const freshData = await fetchFn();
        this.set(key, freshData, maxAge);
        return freshData;
    }
}

// Export singleton instance
const cacheService = new CacheService();

if (typeof window !== 'undefined') {
    window.CacheService = CacheService;
    window.cacheService = cacheService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CacheService, cacheService };
}
