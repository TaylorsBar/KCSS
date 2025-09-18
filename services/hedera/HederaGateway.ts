import { HederaAdapter } from './HederaAdapter';
import { HederaTransactionReceipt, WriteOptions } from './types';
import { loggingService } from '../loggingService';
import { configService } from '../configService';

class HederaGateway {
    private adapter: HederaAdapter;
    private criticalQueue: any[] = [];
    private batchQueue: any[] = [];

    constructor() {
        this.adapter = new HederaAdapter();
        // TODO: Implement a timer to process the batchQueue periodically.
    }

    /**
     * Writes an immutable record to the DLT. Handles queuing and retries.
     * @param payload The JSON payload to be stored.
     * @param options Configuration for the write operation.
     * @returns A promise resolving to the transaction receipt.
     */
    async writeImmutableRecord(payload: object, options: WriteOptions): Promise<HederaTransactionReceipt> {
        const message = JSON.stringify(payload);
        const topicId = configService.get('hedera').batchTopicId;

        if (!topicId) {
            loggingService.error('Hedera batch topic ID is not configured.');
            throw new Error('Hedera topic not configured.');
        }

        if (options.dryRun) {
            loggingService.info('[DRY RUN] Would write to Hedera:', message);
            return {} as HederaTransactionReceipt;
        }

        // TODO: Implement priority queue logic. For now, all are critical.
        this.criticalQueue.push({ topicId, message });
        
        return this.processCriticalQueue();
    }
    
    // TODO: Add methods for batching non-critical events.
    
    private async processCriticalQueue(): Promise<HederaTransactionReceipt> {
        const item = this.criticalQueue.shift();
        if (!item) return {} as HederaTransactionReceipt;

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                return await this.adapter.writeImmutableRecord(item.topicId, item.message);
            } catch (error) {
                attempts++;
                loggingService.warn(`Hedera write attempt ${attempts} failed.`, error);
                if (attempts >= maxAttempts) {
                    loggingService.error('Hedera write failed after max attempts.', item);
                    // TODO: Move to a dead-letter queue for manual intervention.
                    throw error;
                }
                // Exponential backoff with jitter
                const delay = (2 ** attempts) * 1000 + Math.random() * 1000;
                await new Promise(res => setTimeout(res, delay));
            }
        }
        throw new Error('Hedera gateway failed to process queue item.');
    }
}

export const hederaGateway = new HederaGateway();
