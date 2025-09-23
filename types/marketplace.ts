
import { ProvenanceEvent } from './dlt';

// Types for Verified Parts Marketplace
export enum PartCategory {
    Engine = 'Engine',
    Suspension = 'Suspension',
    Brakes = 'Brakes',
    Exhaust = 'Exhaust',
    Electronics = 'Electronics',
    ForcedInduction = 'Forced Induction',
}

export enum PartCondition {
    New = 'New',
    UsedLikeNew = 'Used - Like New',
    UsedGood = 'Used - Good',
}

export interface Part {
    id: string;
    manufacturer: string;
    sku: string;
    serial: string;
    category: PartCategory;
    name: string;
    description: string;
    imageUrl?: string;
}

export interface Listing {
    id: string;
    part: Part;
    price: number;
    currency: 'USD';
    condition: PartCondition;
    seller: string;
    isOemVerified: boolean;
}
