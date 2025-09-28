


import { AiTuningSuggestion, PrewriteCheckResponse } from '../types/index';

// Helper function to call our new secure tuning BFF API
const fetchFromTuningApi = async (body: object) => {
    const response = await fetch('/api/tuning', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tuning API Error: ${response.statusText} - ${errorText}`);
    }
    return response.json();
};


/**
 * Calls the backend to get AI tuning suggestions.
 * @param sensors - The current tuning parameters.
 * @param context - The environmental context.
 * @returns A promise that resolves to an array of AI tuning suggestions.
 */
export const getAiSuggestions = async (
    sensors: { rpmLimit: number, boostTarget: number, afrTarget: number }, 
    context: { ambientC: number, altitudeM: number, fuelOctane: number }
): Promise<AiTuningSuggestion[]> => {
    try {
        const data = await fetchFromTuningApi({ type: 'GET_SUGGESTIONS', sensors, context });
        return data.suggestions;
    } catch (error) {
        console.error("Error fetching AI suggestions from BFF:", error);
        return [{
            title: "Error Connecting to AI",
            rationale: "Could not fetch suggestions from the AI engine. Please check your connection or try again later.",
            changes: [],
            risk: "high"
        }];
    }
};

/**
 * Calls the backend to perform a pre-write check.
 * @param tuneParams - The tune parameters to be written.
 * @returns A promise resolving to a PrewriteCheckResponse.
 */
export const prewriteCheck = async (tuneParams: { rpmLimit: number, boostTarget: number, afrTarget: number }): Promise<PrewriteCheckResponse> => {
    try {
        return await fetchFromTuningApi({ type: 'PREWRITE_CHECK', tuneParams });
    } catch (error) {
        console.error("Error fetching pre-write check from BFF:", error);
        return {
            ok: false,
            reason: "Failed to connect to the AI validation service.",
            audit: { hash: '', payload: '' },
        };
    }
};


// --- Enterprise Service Stubs ---
// TODO: The following functions are placeholders. In a full implementation,
// they would call secure, dedicated backend services (e.g., /api/dlt, /api/vc).

/**
 * Simulates logging the audit hash to Hedera and anchoring on Polygon.
 * @param audit - The audit object from the pre-write check.
 * @returns A promise with mock transaction IDs.
 */
export const logToHederaAndPolygon = async (audit: { hash: string, payload: string }): Promise<{ hederaTopicId: string, polygonTx: string }> => {
    console.log("LOGGING TO DLT (MOCKED):", audit);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    return {
        hederaTopicId: `0.0.12345`,
        polygonTx: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
};

/**
 * Simulates issuing a Verifiable Credential for the service event.
 * @param serviceHash - The hash of the service event.
 * @returns A promise with a mock JWT VC.
 */
export const issueServiceVC = async (serviceHash: string): Promise<{ vcJwt: string }> => {
    console.log("ISSUING VC (MOCKED) for hash:", serviceHash);
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const mockJwt = `eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
        iss: 'did:web:cartelworx.example',
        sub: 'did:vehicle:JN1AZ00Z9ZT000123',
        vc: {
            type: ['VerifiableCredential', 'ServiceEventCredential'],
            credentialSubject: { serviceHash }
        }
    }))}.MOCKED_SIGNATURE`;

    return { vcJwt: mockJwt };
};