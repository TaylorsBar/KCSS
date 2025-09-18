import { MemoryCache } from './MemoryCache';
import { PersistentCache } from './PersistentCache';
import { loggingService } from '../loggingService';

class CacheManager {
    private memoryCache: MemoryCache;
    private persistentCache: PersistentCache;

    constructor() {
        this.memoryCache = new MemoryCache();
        this.persistentCache = new PersistentCache();
        loggingService.info('CacheManager initialized.');
    }

    async get<T>(key: string): Promise<{ value: T | null; isStale: boolean }> {
        // 1. Try memory cache first
        const memHit = this.memoryCache.get<T>(key);
        if (memHit) {
            return { value: memHit.value, isStale: memHit.isStale };
        }

        // 2. Try persistent cache
        const persHit = await this.persistentCache.get<T>(key);
        if (persHit) {
            // Promote to memory cache for faster access next time
            this.memoryCache.set(key, persHit.value, persHit.expiry);
            return { value: persHit.value, isStale: persHit.isStale };
        }

        return { value: null, isStale: false };
    }

    async set<T>(key: string, value: T, ttl: number): Promise<void> {
        this.memoryCache.set(key, value, Date.now() + ttl);
        await this.persistentCache.set(key, value, ttl);
    }
    
    // TODO: Implement smart invalidation methods
    async invalidateNamespace(namespace: string): Promise<void> {
        loggingService.info(`Invalidating cache namespace: ${namespace}`);
        // This would require key iteration, which is slow.
        // In a real implementation, we'd use a more sophisticated key management system.
    }
}

export const cacheManager = new CacheManager();
