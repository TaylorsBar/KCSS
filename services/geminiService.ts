import { MaintenanceRecord, SensorDataPoint, TuningSuggestion, VoiceCommandIntent, DiagnosticAlert, GroundedResponse, SavedRaceSession } from '../types';

// Using a module-level variable to ensure a single worker instance.
let worker: Worker | undefined;
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
let requestIdCounter = 0;

function getWorker(): Worker {
    if (!worker) {
        // The path to the worker must be absolute from the root of the domain (e.g., /services/ai.worker.ts)
        // to avoid cross-origin issues when the app is hosted in a sandboxed environment.
        // Using a relative path like './services/ai.worker.ts' can be resolved incorrectly by the browser.
        worker = new Worker('/services/ai.worker.ts', {
            type: 'module'
        });

        worker.onmessage = (e: MessageEvent) => {
            const { type, result, error, requestId } = e.data;
            const request = pendingRequests.get(requestId);

            if (request) {
                if (type === 'success') {
                    request.resolve(result);
                } else {
                    request.reject(new Error(error));
                }
                pendingRequests.delete(requestId);
            }
        };

        worker.onerror = (e: ErrorEvent) => {
            console.error("Error in AI Worker:", e.message);
            // Reject all pending requests on a catastrophic worker failure
            pendingRequests.forEach(request => {
                request.reject(new Error("AI Worker encountered an unrecoverable error."));
            });
            pendingRequests.clear();
        };
    }
    return worker;
}

// A generic function to post a command to the worker and await a response.
function callWorker<T>(type: string, payload: any): Promise<T> {
    const workerInstance = getWorker();
    return new Promise((resolve, reject) => {
        const requestId = `${type}-${requestIdCounter++}`;
        
        // Add a timeout to prevent requests from hanging indefinitely
        const timeoutId = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error(`AI request '${type}' timed out after 30 seconds.`));
            }
        }, 30000);

        // Augment the promise handlers to clear the timeout
        const enhancedResolve = (value: any) => {
            clearTimeout(timeoutId);
            resolve(value);
        };
        const enhancedReject = (reason?: any) => {
            clearTimeout(timeoutId);
            reject(reason);
        }

        pendingRequests.set(requestId, { resolve: enhancedResolve, reject: enhancedReject });
        
        workerInstance.postMessage({ type, payload, requestId });
    });
}

export const getPredictiveAnalysis = (
    dataHistory: SensorDataPoint[],
    maintenanceHistory: MaintenanceRecord[]
) => {
    // Note: The data arrays will be structurally cloned for the worker, which is efficient.
    return callWorker('getPredictiveAnalysis', { dataHistory, maintenanceHistory });
};

export const getTuningSuggestion = (
    liveData: SensorDataPoint,
    drivingStyle: string,
    conditions: string
): Promise<TuningSuggestion> => {
    return callWorker('getTuningSuggestion', { liveData, drivingStyle, conditions });
};

export const getVoiceCommandIntent = (command: string): Promise<VoiceCommandIntent> => {
    return callWorker('getVoiceCommandIntent', { command });
};

export const generateComponentImage = (componentName: string): Promise<string> => {
    return callWorker('generateComponentImage', { componentName });
};

export const getComponentTuningAnalysis = (
    componentName: string,
    liveData: SensorDataPoint
): Promise<string> => {
    return callWorker('getComponentTuningAnalysis', { componentName, liveData });
};

export const getCoPilotResponse = (
    command: string,
    vehicleData: SensorDataPoint,
    activeAlerts: DiagnosticAlert[]
): Promise<string> => {
    return callWorker('getCoPilotResponse', { command, vehicleData, activeAlerts });
};

export const getCrewChiefResponse = (query: string): Promise<GroundedResponse> => {
    return callWorker('getCrewChiefResponse', { query });
};

export const getRouteScoutResponse = (
    query: string,
    location: { latitude: number; longitude: number }
): Promise<GroundedResponse> => {
    return callWorker('getRouteScoutResponse', { query, location });
};

export const getRaceAnalysis = (session: SavedRaceSession): Promise<string> => {
    return callWorker('getRaceAnalysis', { session });
};