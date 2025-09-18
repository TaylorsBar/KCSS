import { ISupplierAdapter, SupplierResult, SearchOptions } from './types';
import { configService } from '../configService';

class RepcoAdapter implements ISupplierAdapter {
    readonly supplierId = 'repco';
    private config = configService.get('suppliers').repco;

    async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
        // TODO: Implement API call to Repco search endpoint.
        // const response = await fetch(`${this.config.baseUrl}/search?q=${query}&...`);
        console.log(`[RepcoAdapter] Searching for: ${query}`, options);
        await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
        return [];
    }

    async getPartBySKU(sku: string): Promise<SupplierResult | null> {
        // TODO: Implement API call to Repco product endpoint.
        console.log(`[RepcoAdapter] Getting SKU: ${sku}`);
        return null;
    }

    // TODO: Implement getAvailability, getPricing, placeOrder methods.
}

export const repcoAdapter = new RepcoAdapter();
