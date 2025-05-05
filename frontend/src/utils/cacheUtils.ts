/**
 * Utility functions for client-side caching
 */

/**
 * Get data from cache if it exists and is not expired
 * @param key The cache key
 * @param maxAge Maximum age in milliseconds
 * @returns The cached data or null if not found or expired
 */
export function getFromCache<T>(key: string, maxAge: number): T | null {
    try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;

        const { data, timestamp } = JSON.parse(cachedItem);
        const age = Date.now() - timestamp;

        // Return data if it's not expired
        if (age < maxAge) {
            return data as T;
        }
        
        return null;
    } catch (error) {
        console.error(`Error retrieving ${key} from cache:`, error);
        return null;
    }
}

/**
 * Save data to cache with current timestamp
 * @param key The cache key
 * @param data The data to cache
 */
export function saveToCache<T>(key: string, data: T): void {
    try {
        const cacheItem = {
            data,
            timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.error(`Error saving ${key} to cache:`, error);
    }
}

/**
 * Clear a specific cache item
 * @param key The cache key to clear
 */
export function clearCacheItem(key: string): void {
    localStorage.removeItem(key);
}

/**
 * Clear all cache items with a specific prefix
 * @param prefix The prefix of cache keys to clear
 */
export function clearCacheByPrefix(prefix: string): void {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    }
}

/**
 * Default cache durations
 */
export const CACHE_DURATIONS = {
    SHORT: 2 * 60 * 1000, // 2 minutes
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 15 * 60 * 1000, // 15 minutes
    VERY_LONG: 60 * 60 * 1000 // 1 hour
};
