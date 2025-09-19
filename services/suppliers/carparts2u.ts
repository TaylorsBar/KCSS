import { ISupplierAdapter, SupplierResult, SearchOptions, Availability, Price, OrderRequest, OrderResponse, Region } from './types';
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

    // FIX: Implement missing methods to satisfy ISupplierAdapter interface
    async getAvailability(sku: string, region: Region): Promise<Availability | null> {
        console.log(`[CarParts2UAdapter] Getting availability for SKU: ${sku} in region: ${region}`);
        return null;
    }

    async getPricing(sku: string, region: Region): Promise<Price | null> {
        console.log(`[CarParts2UAdapter] Getting pricing for SKU: ${sku} in region: ${region}`);
        return null;
    }

    async placeOrder(payload: OrderRequest): Promise<OrderResponse> {
        console.log(`[CarParts2UAdapter] Placing order with payload:`, payload);
        return { orderId: 'mock-cp2u-order', status: 'PENDING' };
    }
}

export const carparts2uAdapter = new CarParts2UAdapter();