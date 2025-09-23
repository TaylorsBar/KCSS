
// Types for Hedera DLT Integration
export enum HederaEventType {
    Maintenance = 'Maintenance',
    Tuning = 'AI Tuning',
    Diagnostic = 'Diagnostic Alert',
}

export interface HederaRecord {
    id: string;
    timestamp: string;
    eventType: HederaEventType;
    vin: string;
    summary: string;
    hederaTxId: string;
    dataHash: string; // The hash of the off-chain data
}

// For Verified Parts Marketplace Provenance
export enum ProvenanceEventType {
    Minted = 'Minted',
    Listed = 'Listed',
    Sold = 'Sold',
    Installed = 'Installed',
    Serviced = 'Serviced',
}

export interface ProvenanceEvent {
    id: string;
    type: ProvenanceEventType;
    actor: string; // e.g., 'Manufacturer', 'KC Speed Shop'
    timestamp: string;
    hederaTxId: string;
    details?: string;
}
