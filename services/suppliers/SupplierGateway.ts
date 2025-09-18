// SupplierGateway.ts - scaffold implementation
import { CacheManager } from '../cache/CacheManager';
import { getConfig } from '../configService';
import { log } from '../loggingService';
import { SupplierId, SupplierResult, SearchOptions } from './types';
import { getAdapter } from './registry';

export class SupplierGateway {
  private cache = CacheManager.getInstance();
  private circuit: Record<SupplierId, { open: boolean; failures: number; lastOpen: number }> = {} as any;

  constructor(private now = () => Date.now()) {}

  private isOpen(id: SupplierId) {
    const state = this.circuit[id];
    if (!state) return false;
    const coolDownMs = 30_000;
    if (state.open && this.now() - state.lastOpen > coolDownMs) {
      state.open = false;
      state.failures = 0;
    }
    return state.open;
  }

  private recordFailure(id: SupplierId) {
    const state = (this.circuit[id] ||= { open: false, failures: 0, lastOpen: 0 });
    state.failures += 1;
    if (state.failures >= 3) {
      state.open = true;
      state.lastOpen = this.now();
      log('WARN', 'supplier.circuit.open', { id });
    }
  }

  async search(query: string, options: SearchOptions): Promise<SupplierResult[]> {
    const cfg = getConfig();
    const cacheKey = `supplier:search:${options.region}:${query}`;
    const cached = await this.cache.get(cacheKey);
    if (cached?.value && !cached.isStale) return cached.value as SupplierResult[];

    const supplierIds = cfg.suppliers.enabled as SupplierId[];
    const promises = supplierIds.map(async (id) => {
      if (this.isOpen(id)) return [] as SupplierResult[];
      const adapter = getAdapter(id);
      try {
        const res = await this.withRetry(id, () => adapter.searchParts(query, options));
        return res;
      } catch (e: any) {
        this.recordFailure(id);
        log('ERROR', 'supplier.search.failed', { id, query, error: String(e?.message || e) });
        return [] as SupplierResult[];
      }
    });

    const results = (await Promise.all(promises)).flat();
    const merged = this.mergeResults(results);
    const ttl = 60_000; // 1 minute default
    await this.cache.set(cacheKey, merged, ttl);
    return merged;
  }

  private async withRetry<T>(id: SupplierId, fn: () => Promise<T>): Promise<T> {
    const { suppliers } = getConfig();
    const max = suppliers.retryMax ?? 3;
    let lastErr: any;
    for (let i = 0; i < max; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const backoff = Math.min(2000, 200 * 2 ** i) + Math.floor(Math.random() * 100);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    throw lastErr;
  }

  private mergeResults(results: SupplierResult[]): SupplierResult[] {
    const map = new Map<string, SupplierResult>();
    for (const r of results) {
      const key = r.part.sku || `${r.part.brand}|${r.part.mpn}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, r);
      } else {
        // prefer lower price and better availability, merge provenance
        const better = (existing.price.total > r.price.total ? r : existing);
        better.provenance = Array.from(new Set([...(existing.provenance||[]), ...(r.provenance||[])]));
        map.set(key, better);
      }
    }
    return Array.from(map.values());
  }
}

export const supplierGateway = new SupplierGateway();