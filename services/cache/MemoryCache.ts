import { configService } from '../configService';

interface CacheEntry<T> {
    value: T;
    expiry: number;
}

const { maxSize, defaultTTL } = configService.get('cache').memory;

export class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();

    get<T>(key: string): { value: T; isStale: boolean } | null {
        this.cleanup();
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Move to end to mark as recently used
        this.cache.delete(key);
        this.cache.set(key, entry);

        const isStale = Date.now() > entry.expiry;
        return { value: entry.value as T, isStale };
    }

    set<T>(key: string, value: T, expiry?: number): void {
        if (this.cache.size >= maxSize) {
            // Evict the least recently used item (the first item in map iteration)
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
            value,
            expiry: expiry || Date.now() + defaultTTL,
        });
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            // Note: This is a simple cleanup. In a high-traffic scenario,
            // this could be slow. A better approach is periodic background cleanup.
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}
