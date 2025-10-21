/**
 * Cache Service
 * Centralized localStorage management with expiration
 */

class CacheService {
    constructor() {
        this.storage = window.localStorage;
        this.userIdPrefix = null;
    }

    /**
     * Set the current user ID for cache isolation
     * CRITICAL: This must be called on login to prevent data leakage
     */
    setUserId(userId) {
        console.log(`🔐 CacheService: Setting user ID for cache isolation: ${userId}`);
        this.userIdPrefix = userId ? `user_${userId}_` : null;
    }

    /**
     * Get the prefixed cache key for user isolation
     */
    _getPrefixedKey(key) {
        return this.userIdPrefix ? `${this.userIdPrefix}${key}` : key;
    }

    /**
     * Clear all cache for current user
     */
    clearUserCache() {
        if (!this.userIdPrefix) {
            console.warn('⚠️ No user ID set, clearing all cache');
            this.clear();
            return;
        }

        console.log(`🧹 Clearing cache for user: ${this.userIdPrefix}`);
        const keysToDelete = [];

        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(this.userIdPrefix)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.storage.removeItem(key));
        console.log(`✅ Cleared ${keysToDelete.length} cache items`);
    }

    /**
     * Set cache item with optional expiration
     */
    set(key, value, maxAge = null) {
        try {
            const prefixedKey = this._getPrefixedKey(key);
            const cacheItem = {
                data: value,
                timestamp: Date.now(),
                maxAge: maxAge,
                userId: this.userIdPrefix // Store user ID for verification
            };

            this.storage.setItem(prefixedKey, JSON.stringify(cacheItem));
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
            const prefixedKey = this._getPrefixedKey(key);
            const item = this.storage.getItem(prefixedKey);
            if (!item) return null;

            const cacheItem = JSON.parse(item);

            // SECURITY: Verify cache belongs to current user
            if (this.userIdPrefix && cacheItem.userId !== this.userIdPrefix) {
                console.warn(`⚠️ Cache mismatch: Expected ${this.userIdPrefix}, got ${cacheItem.userId}`);
                this.remove(key);
                return null;
            }

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
            const prefixedKey = this._getPrefixedKey(key);
            this.storage.removeItem(prefixedKey);
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
            const prefixedKey = this._getPrefixedKey(key);
            const item = this.storage.getItem(prefixedKey);
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
            const prefixedKey = this._getPrefixedKey(key);
            const item = this.storage.getItem(prefixedKey);
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
