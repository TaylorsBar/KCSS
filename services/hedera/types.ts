import type { TransactionReceipt } from '@hashgraph/sdk';

export type HederaTransactionReceipt = TransactionReceipt;

export interface WriteOptions {
    priority: 'high' | 'normal' | 'low';
    dryRun?: boolean;
}
