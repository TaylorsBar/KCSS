import { ISupplierAdapter, SupplierResult, SearchOptions } from './types';
import { configService } from '../configService';

class CarIdAdapter implements ISupplierAdapter {
    readonly supplierId = 'carid';
    private config = configService.get('suppliers').carid;

    async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
        // TODO: Implement API call to CarID search endpoint.
        // const response = await fetch(`${this.config.baseUrl}/search?q=${query}&...`);
        console.log(`[CarIdAdapter] Searching for: ${query}`, options);
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        return [];
    }

    async getPartBySKU(sku: string): Promise<SupplierResult | null> {
        // TODO: Implement API call to CarID product endpoint.
        console.log(`[CarIdAdapter] Getting SKU: ${sku}`);
        return null;
    }

    // TODO: Implement getAvailability, getPricing, placeOrder methods.
}

export const caridAdapter = new CarIdAdapter();
