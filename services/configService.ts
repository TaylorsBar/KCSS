// TODO: Load these from a secure environment-specific source (e.g., .env file, cloud secret manager)
const config = {
    suppliers: {
        carparts2u: {
            apiKey: process.env.CARPARTS2U_API_KEY || 'cp2u-secret-key',
            baseUrl: 'https://api.carparts2u.com/v1',
            rateLimit: { requests: 10, perSeconds: 1 },
        },
        rockauto: {
            apiKey: process.env.ROCKAUTO_API_KEY || 'rockauto-secret-key',
            baseUrl: 'https://api.rockauto.com/v1',
            rateLimit: { requests: 5, perSeconds: 1 },
        },
        carid: {
            apiKey: process.env.CARID_API_KEY || 'carid-secret-key',
            baseUrl: 'https://api.carid.com/v1',
            rateLimit: { requests: 15, perSeconds: 60 },
        },
        repco: {
            apiKey: process.env.REPCO_API_KEY || 'repco-secret-key',
            baseUrl: 'https://api.repco.co.nz/v1',
            rateLimit: { requests: 100, perSeconds: 3600 },
        },
        nz_performance: {
            apiKey: process.env.NZPERFORMANCE_API_KEY || 'nz-perf-secret-key',
            baseUrl: 'https://api.nzperformance.co.nz/v1',
            rateLimit: { requests: 20, perSeconds: 60 },
        },
    },
    hedera: {
        network: (process.env.HEDERA_NETWORK || 'mainnet') as 'mainnet' | 'testnet',
        operatorId: process.env.HEDERA_OPERATOR_ID || '0.0.12345', // Placeholder
        operatorKey: process.env.HEDERA_OPERATOR_KEY || '302e020100300506032b657004220420...', // Placeholder
        // Topic for non-critical batched events
        batchTopicId: process.env.HEDERA_BATCH_TOPIC_ID || null,
    },
    cache: {
        memory: {
            maxSize: 1000, // Number of items
            defaultTTL: 5 * 60 * 1000, // 5 minutes
        },
        persistent: {
            dbName: 'CartelWorxCache',
            storeName: 'KeyValueStore',
            defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
        }
    },
    observability: {
        endpoint: process.env.OBSERVABILITY_ENDPOINT || '',
    }
};

export const configService = {
    get: <T extends keyof typeof config>(key: T) => config[key],
};
