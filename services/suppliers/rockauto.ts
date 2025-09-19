import { ISupplierAdapter, SupplierResult, SearchOptions, Availability, Price, OrderRequest, OrderResponse, Region } from './types';
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

    // FIX: Implement missing methods to satisfy ISupplierAdapter interface
    async getAvailability(sku: string, region: Region): Promise<Availability | null> {
        console.log(`[RockAutoAdapter] Getting availability for SKU: ${sku} in region: ${region}`);
        return null;
    }

    async getPricing(sku: string, region: Region): Promise<Price | null> {
        console.log(`[RockAutoAdapter] Getting pricing for SKU: ${sku} in region: ${region}`);
        return null;
    }

    async placeOrder(payload: OrderRequest): Promise<OrderResponse> {
        console.log(`[RockAutoAdapter] Placing order with payload:`, payload);
        return { orderId: 'mock-rockauto-order', status: 'PENDING' };
    }
}

export const rockautoAdapter = new RockAutoAdapter();