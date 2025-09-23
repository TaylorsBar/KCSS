
import { Listing, PartCategory, PartCondition, ProvenanceEvent, ProvenanceEventType } from '../types/index';

export const MOCK_LISTINGS: Listing[] = [
    {
        id: '1',
        part: { id: 'p1', manufacturer: 'Brembo', sku: 'BRE-GT8-380', serial: 'SN789-001', category: PartCategory.Brakes, name: 'GT8 8-Piston Big Brake Kit', description: 'High-performance braking system for track and street use.' },
        price: 3200, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    },
    {
        id: '2',
        part: { id: 'p2', manufacturer: 'Garrett', sku: 'GAR-GTX3582R', serial: 'SN123-005', category: PartCategory.ForcedInduction, name: 'GTX3582R Gen II Turbocharger', description: 'Competition-grade turbocharger with a 66mm compressor wheel.' },
        price: 2500, currency: 'USD', condition: PartCondition.New, seller: 'Tuner Imports', isOemVerified: true,
    },
    {
        id: '3',
        part: { id: 'p3', manufacturer: 'Ohlins', sku: 'OHL-R&T-SUB-WRX', serial: 'SN456-012', category: PartCategory.Suspension, name: 'Road & Track Coilovers', description: 'Dual Flow Valve (DFV) technology for superior handling.' },
        price: 2850, currency: 'USD', condition: PartCondition.UsedLikeNew, seller: 'Private Seller', isOemVerified: false,
    },
     {
        id: '4',
        part: { id: 'p4', manufacturer: 'AEM', sku: 'AEM-30-0300', serial: 'SN555-101', category: PartCategory.Electronics, name: 'X-Series Wideband UEGO Controller Gauge', description: 'Essential for accurate air/fuel ratio monitoring during tuning.' },
        price: 180, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    },
    {
        id: '5',
        part: { id: 'p5', manufacturer: 'Tomei', sku: 'TOM-EXPREME-Ti', serial: 'SN222-045', category: PartCategory.Exhaust, name: 'Expreme Ti Titanium Catback Exhaust', description: 'Extremely lightweight full titanium exhaust system for maximum performance.' },
        price: 1100, currency: 'USD', condition: PartCondition.UsedGood, seller: 'TrackDayParts', isOemVerified: false,
    },
    {
        id: '6',
        part: { id: 'p6', manufacturer: 'IAG', sku: 'IAG-ENG-2500', serial: 'SN333-098', category: PartCategory.Engine, name: 'Stage 2.5 Closed Deck Short Block', description: 'Built to handle up to 800 BHP for Subaru WRX/STI.' },
        price: 5500, currency: 'USD', condition: PartCondition.New, seller: 'KC Speed Shop', isOemVerified: true,
    }
];

export const MOCK_PROVENANCE: { [key: string]: ProvenanceEvent[] } = {
    'p1': [
        { id: 'prov1-1', type: ProvenanceEventType.Minted, actor: 'Brembo S.p.A.', timestamp: '2024-05-10 09:00 UTC', hederaTxId: '0.0.123@1658498112.123456789' },
        { id: 'prov1-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-20 14:00 UTC', hederaTxId: '0.0.123@1658498112.234567890' },
    ],
    'p2': [
        { id: 'prov2-1', type: ProvenanceEventType.Minted, actor: 'Garrett Motion Inc.', timestamp: '2024-04-01 11:00 UTC', hederaTxId: '0.0.123@1658498112.345678901' },
        { id: 'prov2-2', type: ProvenanceEventType.Listed, actor: 'Tuner Imports', timestamp: '2024-07-18 10:00 UTC', hederaTxId: '0.0.123@1658498112.456789012' },
    ],
    'p3': [
        { id: 'prov3-1', type: ProvenanceEventType.Minted, actor: 'Öhlins Racing AB', timestamp: '2023-11-20 12:00 UTC', hederaTxId: '0.0.123@1658498112.567890123' },
        { id: 'prov3-2', type: ProvenanceEventType.Sold, actor: 'Original Buyer', timestamp: '2024-01-15 18:00 UTC', hederaTxId: '0.0.123@1658498112.678901234' },
        { id: 'prov3-3', type: ProvenanceEventType.Installed, actor: 'KC Speed Shop', timestamp: '2024-01-20 16:00 UTC', hederaTxId: '0.0.123@1658498112.789012345', details: 'Installed on Subaru WRX VIN: ...' },
        { id: 'prov3-4', type: ProvenanceEventType.Listed, actor: 'Private Seller', timestamp: '2024-07-21 09:00 UTC', hederaTxId: '0.0.123@1658498112.890123456' },
    ],
    'p4': [
        { id: 'prov4-1', type: ProvenanceEventType.Minted, actor: 'AEM Performance Electronics', timestamp: '2024-06-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.901234567' },
        { id: 'prov4-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-22 11:00 UTC', hederaTxId: '0.0.123@1658498112.012345678' },
    ],
     'p5': [
        { id: 'prov5-1', type: ProvenanceEventType.Minted, actor: 'Tomei Powered Inc.', timestamp: '2023-09-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.112345678' },
        { id: 'prov5-2', type: ProvenanceEventType.Listed, actor: 'TrackDayParts', timestamp: '2024-07-15 10:00 UTC', hederaTxId: '0.0.123@1658498112.223456789' },
    ],
     'p6': [
        { id: 'prov6-1', type: ProvenanceEventType.Minted, actor: 'IAG Performance', timestamp: '2024-07-01 08:00 UTC', hederaTxId: '0.0.123@1658498112.334567890' },
        { id: 'prov6-2', type: ProvenanceEventType.Listed, actor: 'KC Speed Shop', timestamp: '2024-07-10 12:00 UTC', hederaTxId: '0.0.123@1658498112.445678901' },
    ],
};