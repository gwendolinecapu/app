/**
 * Cache Service Global avec AsyncStorage
 *
 * Fournit un cache persistant pour les données Firestore (alters, systems, etc.)
 * avec support TTL et invalidation automatique.
 *
 * ✅ OPTIMISATION: Évite requêtes répétées Firestore
 * ✅ PERFORMANCE: Cache en mémoire + persistance AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// TTL par défaut: 10 minutes
const DEFAULT_TTL = 10 * 60 * 1000;

// Cache en mémoire pour accès rapide (évite AsyncStorage reads)
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Génère une clé de cache unique
 */
const getCacheKey = (collection: string, id: string): string => {
    return `cache:${collection}:${id}`;
};

/**
 * Récupère une entrée du cache
 * Vérifie d'abord le cache mémoire, puis AsyncStorage
 */
export const getFromCache = async <T>(
    collection: string,
    id: string,
    ttl: number = DEFAULT_TTL
): Promise<T | null> => {
    const key = getCacheKey(collection, id);

    // 1. Check memory cache first (fastest)
    const memEntry = memoryCache.get(key);
    if (memEntry) {
        // Check if expired
        if (Date.now() - memEntry.timestamp > ttl) {
            memoryCache.delete(key);
        } else {
            return memEntry.data as T;
        }
    }

    // 2. Check AsyncStorage (persistent)
    try {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) return null;

        const entry: CacheEntry<T> = JSON.parse(stored);

        // Check if expired
        if (Date.now() - entry.timestamp > ttl) {
            await AsyncStorage.removeItem(key);
            return null;
        }

        // Restore to memory cache
        memoryCache.set(key, entry);

        return entry.data;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};

/**
 * Stocke une entrée dans le cache
 * Écrit dans le cache mémoire ET AsyncStorage
 */
export const setInCache = async <T>(
    collection: string,
    id: string,
    data: T
): Promise<void> => {
    const key = getCacheKey(collection, id);
    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
    };

    // 1. Set in memory (sync, fast)
    memoryCache.set(key, entry);

    // 2. Persist to AsyncStorage (async, slower)
    try {
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        console.warn('Cache write error:', error);
        // Memory cache still works even if AsyncStorage fails
    }
};

/**
 * Récupère plusieurs entrées du cache
 * ✅ OPTIMISÉ: Batch read avec AsyncStorage.multiGet
 */
export const getBatchFromCache = async <T>(
    collection: string,
    ids: string[],
    ttl: number = DEFAULT_TTL
): Promise<Map<string, T>> => {
    const result = new Map<string, T>();
    const uncachedKeys: string[] = [];

    // 1. Check memory cache first
    for (const id of ids) {
        const key = getCacheKey(collection, id);
        const memEntry = memoryCache.get(key);

        if (memEntry && (Date.now() - memEntry.timestamp <= ttl)) {
            result.set(id, memEntry.data as T);
        } else {
            uncachedKeys.push(key);
        }
    }

    // 2. Fetch uncached from AsyncStorage (batch)
    if (uncachedKeys.length > 0) {
        try {
            const stored = await AsyncStorage.multiGet(uncachedKeys);

            for (const [key, value] of stored) {
                if (!value) continue;

                try {
                    const entry: CacheEntry<T> = JSON.parse(value);

                    // Check if expired
                    if (Date.now() - entry.timestamp > ttl) {
                        await AsyncStorage.removeItem(key);
                        continue;
                    }

                    // Extract ID from key (cache:collection:id)
                    const id = key.split(':')[2];
                    result.set(id, entry.data);

                    // Restore to memory cache
                    memoryCache.set(key, entry);
                } catch (parseError) {
                    console.warn('Cache parse error:', parseError);
                }
            }
        } catch (error) {
            console.warn('Cache batch read error:', error);
        }
    }

    return result;
};

/**
 * Stocke plusieurs entrées dans le cache (batch)
 * ✅ OPTIMISÉ: Batch write avec AsyncStorage.multiSet
 */
export const setBatchInCache = async <T>(
    collection: string,
    items: Map<string, T>
): Promise<void> => {
    const timestamp = Date.now();
    const pairs: [string, string][] = [];

    // Prepare batch data
    items.forEach((data, id) => {
        const key = getCacheKey(collection, id);
        const entry: CacheEntry<T> = { data, timestamp };

        // Set in memory
        memoryCache.set(key, entry);

        // Prepare for AsyncStorage batch
        pairs.push([key, JSON.stringify(entry)]);
    });

    // Batch write to AsyncStorage
    try {
        await AsyncStorage.multiSet(pairs);
    } catch (error) {
        console.warn('Cache batch write error:', error);
    }
};

/**
 * Invalide une entrée du cache
 */
export const invalidateCache = async (collection: string, id: string): Promise<void> => {
    const key = getCacheKey(collection, id);

    // Remove from memory
    memoryCache.delete(key);

    // Remove from AsyncStorage
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.warn('Cache invalidation error:', error);
    }
};

/**
 * Invalide toute une collection du cache
 */
export const invalidateCollection = async (collection: string): Promise<void> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const prefix = `cache:${collection}:`;
        const keysToRemove = allKeys.filter(key => key.startsWith(prefix));

        // Remove from memory
        keysToRemove.forEach(key => memoryCache.delete(key));

        // Remove from AsyncStorage
        if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
        }
    } catch (error) {
        console.warn('Collection invalidation error:', error);
    }
};

/**
 * Vide tout le cache
 */
export const clearAllCache = async (): Promise<void> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith('cache:'));

        // Clear memory
        memoryCache.clear();

        // Clear AsyncStorage
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
    } catch (error) {
        console.warn('Clear cache error:', error);
    }
};

// ============================================
// HELPER: Fetch with Cache
// ============================================

/**
 * Pattern: Fetch from cache, or fetch from Firestore and cache
 *
 * Usage:
 * ```typescript
 * const alter = await fetchWithCache('alters', alterId, async () => {
 *     const doc = await getDoc(doc(db, 'alters', alterId));
 *     return doc.data();
 * });
 * ```
 */
export const fetchWithCache = async <T>(
    collection: string,
    id: string,
    fetchFn: () => Promise<T | null>,
    ttl?: number
): Promise<T | null> => {
    // 1. Try cache first
    const cached = await getFromCache<T>(collection, id, ttl);
    if (cached !== null) {
        return cached;
    }

    // 2. Fetch from source
    const data = await fetchFn();
    if (data === null) {
        return null;
    }

    // 3. Cache result
    await setInCache(collection, id, data);

    return data;
};
