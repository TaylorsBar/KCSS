# Enterprise Integration Roadmap Documentation

This document outlines the architecture and usage of the enterprise integration services for the CartelWorxEvo2 application.

## 1. Secure API Gateway (Backend-for-Frontend)

To ensure enterprise-grade security and protect sensitive credentials like API keys, the application employs a Backend-for-Frontend (BFF) pattern using serverless functions located in the `/api` directory.

**ALL** external service calls that require a secret API key (e.g., Google Gemini) **MUST** be routed through this BFF layer. The frontend client should **NEVER** handle secret keys directly.

### Usage

The frontend `services/geminiService.ts` makes `fetch` requests to its corresponding serverless function (e.g., `/api/gemini`), which then securely communicates with the external API using the key stored in an environment variable.

## 2. Supplier Gateway

### Adapter Contract (`ISupplierAdapter`)

To integrate a new parts supplier, create an adapter that implements the `ISupplierAdapter` interface found in `services/suppliers/types.ts`.

**Interface:**
```typescript
import { SupplierId, SupplierResult, SearchOptions } from './types';

export interface ISupplierAdapter {
  supplierId: SupplierId;
  searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]>;
  getPartBySKU(sku: string): Promise<SupplierResult | null>;
  // ... other methods like getAvailability, getPricing, placeOrder
}
```

### Usage

The `SupplierGateway` abstracts all supplier interactions. It handles aggregation, caching, rate limiting, and failover.

```typescript
import { supplierGateway } from '../services';

const results = await supplierGateway.search('brake pads 2022 WRX', { region: 'NZ' });
```

### Extending

1.  Create a new file under `services/suppliers/`.
2.  Implement the `ISupplierAdapter` interface.
3.  Register the new adapter instance in `services/suppliers/registry.ts`.
4.  Add configuration to `services/configService.ts`.

## 3. Hedera DLT Gateway

The `HederaGateway` provides a reliable, queued, and batched interface for interacting with the Hedera network. Like other sensitive services, interactions requiring private keys are handled by a secure backend (`/api/audit.ts`).

### Usage

Use the gateway for all DLT interactions to ensure proper handling of network congestion and transaction costs. Critical transactions are executed immediately with retries, while non-critical events are batched.

```typescript
import { hederaGateway } from '../services';

const payload = { event: 'AI_TUNE_SIMULATION', ... }; // Your service record
const receipt = await hederaGateway.writeImmutableRecord(payload, { priority: 'high' });
```

### Extension Points

-   Add new adapter methods in `HederaAdapter.ts` for new smart contract interactions.
-   Expose new high-level methods in `HederaGateway.ts` that use the adapter.

## 4. Caching Strategy

The system uses a two-tier hybrid cache:
1.  **L1 In-Memory Cache:** LRU with a short TTL for frequently accessed, non-critical data during a session.
2.  **L2 Persistent Cache:** IndexedDB for longer-term caching of supplier data across sessions.

### Key Namespaces
-   `supplier:search:{query}`
-   `supplier:part:{sku}`
-   `supplier:availability:{sku}:{region}`

The `CacheManager` uses a stale-while-revalidate strategy for background data freshness.

## 5. Error Handling

-   **Supplier Gateway:** Uses a circuit breaker pattern. After 3 consecutive failures, a supplier is temporarily disabled for 60 seconds.
-   **Hedera Gateway:** Uses exponential backoff for retries. Failed critical transactions are moved to a dead-letter queue for manual review.
-   **Logging:** All errors are logged via `loggingService` with structured context.
