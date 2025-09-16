import { AiTuningSuggestion, PrewriteCheckResponse } from '../types';

/**
 * Simulates calling the FastAPI backend for AI tuning suggestions.
 * The logic is a TypeScript port of the provided Python service.
 * @param sensors - The current tuning parameters.
 * @param context - The environmental context.
 * @returns A promise that resolves to an array of AI tuning suggestions.
 */
export const getAiSuggestions = async (
    sensors: { rpmLimit: number, boostTarget: number, afrTarget: number }, 
    context: { ambientC: number, altitudeM: number, fuelOctane: number }
): Promise<AiTuningSuggestion[]> => {
    console.log("Requesting AI suggestions with:", { sensors, context });
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    const sugs: AiTuningSuggestion[] = [];

    if (sensors.boostTarget > 1.3 && context.ambientC > 30) {
      sugs.push({
        title: "Reduce boost in high ambient temps",
        rationale: "To mitigate IAT-induced knock risk, reduce boost slightly or enrich AFR under sustained load.",
        changes: [
          { key: "boostTarget", from: sensors.boostTarget, to: parseFloat((sensors.boostTarget - 0.1).toFixed(2)) },
          { key: "afrTarget", from: sensors.afrTarget, to: parseFloat((sensors.afrTarget - 0.2).toFixed(1)) }
        ],
        risk: "low"
      });
    }

    if (sensors.rpmLimit > 7600) {
      sugs.push({
        title: "RPM limit exceeds recommended durability band",
        rationale: "Prolonged operation above 7600 can accelerate valvetrain wear; consider a modest reduction.",
        changes: [{ key: "rpmLimit", from: sensors.rpmLimit, to: 7400 }],
        risk: "medium"
      });
    }

    if (sugs.length === 0) {
      sugs.push({
        title: "Configuration looks balanced",
        rationale: "No immediate risks detected for given ambient conditions and targets.",
        changes: [],
        risk: "low"
      });
    }

    return sugs;
};

/**
 * Simulates the pre-write check from the AI service.
 * @param tuneParams - The tune parameters to be written.
 * @returns A promise resolving to a PrewriteCheckResponse.
 */
export const prewriteCheck = async (tuneParams: { rpmLimit: number, boostTarget: number, afrTarget: number }): Promise<PrewriteCheckResponse> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    const issues: string[] = [];
    if (tuneParams.boostTarget > 1.6) {
        issues.push("Boost target > 1.6 bar is outside safe envelope.");
    }
    if (tuneParams.afrTarget > 13.0) {
        issues.push("AFR target is lean for high boost; enrich to <= 12.5.");
    }
    
    const ok = issues.length === 0;
    
    const audit_payload = `${tuneParams.rpmLimit}|${tuneParams.boostTarget}|${tuneParams.afrTarget}|${Math.floor(Date.now() / 1000)}`;
    const data = new TextEncoder().encode(audit_payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
        ok,
        reason: ok ? null : issues.join(' '),
        audit: { hash: hashHex, payload: audit_payload },
    };
};

/**
 * Simulates logging the audit hash to Hedera and anchoring on Polygon.
 * @param audit - The audit object from the pre-write check.
 * @returns A promise with mock transaction IDs.
 */
export const logToHederaAndPolygon = async (audit: { hash: string, payload: string }): Promise<{ hederaTopicId: string, polygonTx: string }> => {
    console.log("Logging to DLT:", audit);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay for two transactions
    
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
    console.log("Issuing VC for hash:", serviceHash);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
    
    // This is a simplified, decoded representation of a JWT for simulation purposes.
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
