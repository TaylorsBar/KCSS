
import { HederaRecord, HederaEventType } from '../types/index';

export const MOCK_INITIAL_RECORDS: HederaRecord[] = [
    { id: '1', timestamp: '2024-07-22 14:35:12', eventType: HederaEventType.Diagnostic, vin: 'JN1AZ00Z9ZT000123', summary: 'Critical alert: ABS Modulator Failure Predicted.', hederaTxId: '0.0.12345@1658498112.123456789', dataHash: 'a1b2c3d4...' },
    { id: '2', timestamp: '2024-07-22 11:15:45', eventType: HederaEventType.Tuning, vin: 'JN1AZ00Z9ZT000123', summary: "AI tune 'Track Day' simulated.", hederaTxId: '0.0.12345@1658486145.987654321', dataHash: 'e5f6g7h8...' },
    { id: '3', timestamp: '2024-07-15 09:00:00', eventType: HederaEventType.Maintenance, vin: 'JN1AZ00Z9ZT000123', summary: 'Oil & Filter Change (Verified)', hederaTxId: '0.0.12345@1657875600.555555555', dataHash: 'i9j0k1l2...' },
];