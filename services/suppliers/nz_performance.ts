import { ISupplierAdapter, SupplierResult, SearchOptions } from './types';
import { configService } from '../configService';

class NZPerformanceAdapter implements ISupplierAdapter {
    readonly supplierId = 'nz_performance';
    private config = configService.get('suppliers').nz_performance;

    async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
        // TODO: Implement API call to NZ Performance search endpoint.
        // const response = await fetch(`${this.config.baseUrl}/search?q=${query}&...`);
        console.log(`[NZPerformanceAdapter] Searching for: ${query}`, options);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
        return [];
    }

    async getPartBySKU(sku: string): Promise<SupplierResult | null> {
        // TODO: Implement API call to NZ Performance product endpoint.
        console.log(`[NZPerformanceAdapter] Getting SKU: ${sku}`);
        return null;
    }

    // TODO: Implement getAvailability, getPricing, placeOrder methods.
}

export const nzPerformanceAdapter = new NZPerformanceAdapter();
