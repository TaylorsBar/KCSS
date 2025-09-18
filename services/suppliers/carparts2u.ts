import { ISupplierAdapter, SupplierResult, SearchOptions } from './types';
import { configService } from '../configService';

class CarParts2UAdapter implements ISupplierAdapter {
    readonly supplierId = 'carparts2u';
    private config = configService.get('suppliers').carparts2u;

    async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
        // TODO: Implement API call to CarParts2U search endpoint.
        // const response = await fetch(`${this.config.baseUrl}/search?q=${query}&...`);
        console.log(`[CarParts2UAdapter] Searching for: ${query}`, options);
        await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network delay
        return [];
    }

    async getPartBySKU(sku: string): Promise<SupplierResult | null> {
        // TODO: Implement API call to CarParts2U product endpoint.
        console.log(`[CarParts2UAdapter] Getting SKU: ${sku}`);
        return null;
    }

    // TODO: Implement getAvailability, getPricing, placeOrder methods.
}

export const carparts2uAdapter = new CarParts2UAdapter();
