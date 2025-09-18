import { ISupplierAdapter, SupplierResult, SearchOptions } from './types';
import { configService } from '../configService';

class RockAutoAdapter implements ISupplierAdapter {
    readonly supplierId = 'rockauto';
    private config = configService.get('suppliers').rockauto;

    async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
        // TODO: Implement API call to RockAuto search endpoint.
        // const response = await fetch(`${this.config.baseUrl}/search?q=${query}&...`);
        console.log(`[RockAutoAdapter] Searching for: ${query}`, options);
        await new Promise(resolve => setTimeout(resolve, 350)); // Simulate network delay
        return [];
    }

    async getPartBySKU(sku: string): Promise<SupplierResult | null> {
        // TODO: Implement API call to RockAuto product endpoint.
        console.log(`[RockAutoAdapter] Getting SKU: ${sku}`);
        return null;
    }

    // TODO: Implement getAvailability, getPricing, placeOrder methods.
}

export const rockautoAdapter = new RockAutoAdapter();
