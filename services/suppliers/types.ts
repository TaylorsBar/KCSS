export type SupplierId = 'carparts2u' | 'rockauto' | 'carid' | 'repco' | 'nz_performance' | 'cooldrive';
export type Region = 'NZ' | 'AU' | 'US' | 'global';
export type Currency = 'NZD' | 'AUD' | 'USD';

export interface Part {
    sku: string;
    oemSku?: string;
    manufacturer: string;
    name: string;
    description: string;
    category: string; // Consider making this an enum later
    imageUrl?: string;
    weightKg?: number;
    dimensionsCm?: { l: number; w: number; h: number };
    provenance?: object; // Placeholder for DLT provenance data
}

export interface Price {
    amount: number;
    currency: Currency;
}

export interface Availability {
    inStock: boolean;
    quantity: number | null;
    warehouseLocation: string;
    estimatedDeliveryDays: number | null;
}

export interface SupplierResult {
    supplierId: SupplierId;
    part: Part;
    price: Price;
    availability: Availability;
    supplierSpecificUrl: string;
}

export interface SearchOptions {
    region: Region;
    oemOnly?: boolean;
    aftermarketOnly?: boolean;
    currency?: Currency;
}

export interface OrderRequest {
    // TODO: Define order request payload
}

export interface OrderResponse {
    orderId: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface ISupplierAdapter {
    supplierId: SupplierId;
    searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]>;
    getPartBySKU(sku: string): Promise<SupplierResult | null>;
    getAvailability(sku: string, region: Region): Promise<Availability | null>;
    getPricing(sku: string, region: Region): Promise<Price | null>;
    placeOrder(payload: OrderRequest): Promise<OrderResponse>;
}
