import { cacheManager } from '../cache/CacheManager';
import { configService } from '../configService';
import { loggingService } from '../loggingService';
import { SupplierId, SupplierResult, SearchOptions } from './types';
import { getAdapter } from './registry';

// This enterprise-grade gateway manages all supplier interactions.
// It includes features like a circuit breaker, retries with exponential backoff,
// caching, and result aggregation.

class SupplierGateway {
  private cache = cacheManager;
  private circuit: Partial<Record<SupplierId, { open: boolean; failures: number; lastOpen: number }>> = {};

  constructor(private now = () => Date.now()) {}

  private isOpen(id: SupplierId): boolean {
    const state = this.circuit[id];
    if (!state) return false;

    const coolDownMs = 30_000; // 30 seconds
    if (state.open && this.now() - state.lastOpen > coolDownMs) {
      // Attempt to half-open the circuit
      state.open = false;
      state.failures = 0;
      loggingService.info(`Supplier circuit for ${id} is now half-open.`);
    }
    return state.open;
  }

  private recordFailure(id: SupplierId): void {
    const state = this.circuit[id] || { open: false, failures: 0, lastOpen: 0 };
    this.circuit[id] = state;
    
    state.failures += 1;
    if (state.failures >= 3) {
      state.open = true;
      state.lastOpen = this.now();
      loggingService.warn(`Supplier circuit for ${id} has been opened due to repeated failures.`);
    }
  }
  
  private recordSuccess(id: SupplierId): void {
     const state = this.circuit[id];
     if (state) {
         state.failures = 0;
     }
  }

  async search(query: string, options: SearchOptions): Promise<SupplierResult[]> {
    const cacheKey = `supplier:search:${options.region}:${query}`;
    const cached = await this.cache.get<SupplierResult[]>(cacheKey);
    if (cached?.value && !cached.isStale) {
        loggingService.info(`Cache hit for supplier search: ${query}`);
        return cached.value;
    }

    const { enabled, retryMax } = configService.get('suppliers');
    const supplierIds = enabled as SupplierId[];
    
    const promises = supplierIds.map(async (id) => {
      if (this.isOpen(id)) {
        loggingService.warn(`Skipping supplier ${id} because its circuit is open.`);
        return [];
      }
      
      const adapter = getAdapter(id);
      try {
        const res = await this.withRetry(id, () => adapter.searchParts(query, options), retryMax);
        this.recordSuccess(id);
        return res;
      } catch (e: any) {
        this.recordFailure(id);
        loggingService.error(`Supplier search failed for ${id}`, { query, error: String(e?.message || e) });
        return [];
      }
    });

    const results = (await Promise.all(promises)).flat();
    const merged = this.mergeResults(results);
    
    const ttl = 60_000; // 1 minute default TTL for searches
    await this.cache.set(cacheKey, merged, ttl);
    return merged;
  }

  private async withRetry<T>(id: SupplierId, fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (i < maxRetries - 1) {
            const backoff = Math.min(2000, 200 * 2 ** i) + Math.floor(Math.random() * 100);
            loggingService.warn(`Retrying for supplier ${id} in ${backoff}ms...`);
            await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw lastErr;
  }

  private mergeResults(results: SupplierResult[]): SupplierResult[] {
    const map = new Map<string, SupplierResult>();
    for (const r of results) {
      const key = r.part.sku || `${r.part.manufacturer}|${r.part.name}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, r);
      } else {
        // Simple merge logic: prefer lower price
        const better = (existing.price.amount > r.price.amount ? r : existing);
        map.set(key, better);
      }
    }
    return Array.from(map.values());
  }
}

export const supplierGateway = new SupplierGateway();
