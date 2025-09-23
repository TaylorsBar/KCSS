
import { AuditLogEntry, AuditEvent } from '../types/index';

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    { id: '1', timestamp: '2024-07-22 14:35:12 UTC', event: AuditEvent.AiAnalysis, description: 'Predictive analysis run on live OBD-II data stream.', ipAddress: '192.168.1.1 (Local)', status: 'Success' },
    { id: '2', timestamp: '2024-07-22 14:30:05 UTC', event: AuditEvent.Login, description: 'User authenticated successfully via biometrics.', ipAddress: '203.0.113.25', status: 'Success' },
    { id: '3', timestamp: '2024-07-22 11:15:45 UTC', event: AuditEvent.TuningChange, description: "AI tuning suggestion 'Track Day' applied to sandbox.", ipAddress: '192.168.1.1 (Local)', status: 'Success' },
    { id: '4', timestamp: '2024-07-22 11:14:20 UTC', event: AuditEvent.DiagnosticQuery, description: "User asked: 'Why is my idle rough?'", ipAddress: '192.168.1.1 (Local)', status: 'Success' },
    { id: '5', timestamp: '2024-07-22 08:00:01 UTC', event: AuditEvent.DataSync, description: 'Encrypted vehicle health report synced to cloud backup.', ipAddress: 'System', status: 'Success' },
    { id: '6', timestamp: '2024-07-21 18:05:11 UTC', event: AuditEvent.Login, description: 'User authenticated successfully.', ipAddress: '203.0.113.25', status: 'Success' },
];