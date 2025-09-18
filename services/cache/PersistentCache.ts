import localforage from 'https://esm.sh/localforage@1.10.0';
import { configService } from '../configService';

interface PersistentCacheEntry<T> {
    value: T;
    expiry: number;
}

const { dbName, storeName, defaultTTL } = configService.get('cache').persistent;

export class PersistentCache {
    private store: LocalForage;

    constructor() {
        this.store = localforage.createInstance({
            name: dbName,
            storeName: storeName,
        });
    }

    async get<T>(key: string): Promise<{ value: T; isStale: boolean; expiry: number } | null> {
        try {
            const entry = await this.store.getItem<PersistentCacheEntry<T>>(key);
            if (!entry) return null;
            
            const isStale = Date.now() > entry.expiry;
            if (isStale) {
                // Return stale data but remove it in the background
                this.store.removeItem(key).catch(() => {});
            }

            return { value: entry.value, isStale, expiry: entry.expiry };
        } catch (error) {
            return null;
        }
    }

    async set<T>(key: string, value: T, ttl: number = defaultTTL): Promise<void> {
        const entry: PersistentCacheEntry<T> = {
            value,
            expiry: Date.now() + ttl,
        };
        try {
            await this.store.setItem(key, entry);
        } catch (error) {
            // Handle storage errors (e.g., quota exceeded)
        }
    }
}

// TODO: Integrate localForage or a direct IndexedDB wrapper for full functionality.
