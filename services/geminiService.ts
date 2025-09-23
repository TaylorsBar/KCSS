

import { MaintenanceRecord, SensorDataPoint, VoiceCommandIntent, DiagnosticAlert, AlertLevel, IntentAction, TimelineEvent } from '../types/index';

const isOnline = () => navigator.onLine;

// Helper function to call our secure BFF API
const fetchFromApi = async (body: object) => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }
    return response.json();
};


export const getDiagnosticAnswer = async (query: string): Promise<string> => {
  if (!isOnline()) {
    return `I am currently in offline mode. For your query about **"${query}"**, I would typically provide a detailed diagnostic. Please try your query again when you are back online for a full analysis.`;
  }
  try {
    const data = await fetchFromApi({ type: 'DIAGNOSTIC_ANSWER', query });
    return data.text;
  } catch (error) {
    console.error("Error fetching diagnostic answer from BFF:", error);
    return "I'm sorry, I'm having trouble connecting to my diagnostic systems right now. Please try again in a moment.";
  }
};

export const getPredictiveAnalysis = async (
  liveData: SensorDataPoint,
  maintenanceHistory: MaintenanceRecord[]
): Promise<{ timelineEvents: TimelineEvent[], error?: string }> => {
    if (!isOnline()) {
        return { 
          timelineEvents: [
            { id: 'offline-1', level: AlertLevel.Warning, title: 'Offline: Mock Spark Plug Wear', timeframe: 'Next 3000 miles', details: { component: 'Spark Plugs', rootCause: 'Offline mock data.', recommendedActions: ['Inspect when online.'], plainEnglishSummary: "It might be time to check your spark plugs soon. This is a mock suggestion as you are offline." } }
          ]
        };
    }

  try {
    const data = await fetchFromApi({ type: 'PREDICTIVE_ANALYSIS', liveData, maintenanceHistory });
    return data;
  } catch (error) {
    console.error("Error fetching predictive analysis from BFF:", error);
    return { 
        timelineEvents: [],
        error: "Failed to get predictive analysis."
    };
  }
};


export const getVoiceCommandIntent = async (command: string): Promise<VoiceCommandIntent> => {
    if (!isOnline()) {
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes('show') || lowerCommand.includes('highlight')) {
             return { intent: IntentAction.ShowComponent, component: 'turbo', confidence: 0.8 }; 
        }
        return { intent: IntentAction.Unknown, confidence: 1.0 };
    }

  try {
    const data = await fetchFromApi({ type: 'VOICE_INTENT', command });
    return data as VoiceCommandIntent;
  } catch (error) {
    console.error("Error fetching voice command intent from BFF:", error);
    return {
      intent: IntentAction.Unknown,
      confidence: 1.0,
      // @ts-ignore
      error: 'Failed to process command.',
    };
  }
};

export const generateComponentImage = async (componentName: string): Promise<string> => {
    if (!isOnline()) {
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1A202C"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="32" fill="#A0AEC0">${componentName}</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" fill="#718096">(Diagram is unavailable offline)</text></svg>`;
        return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
    }
  try {
    const data = await fetchFromApi({ type: 'GENERATE_IMAGE', componentName });
    return data.imageUrl;
  } catch (error) {
    console.error(`Error generating component image for ${componentName}:`, error);
    throw new Error("Failed to generate component diagram.");
  }
};

export const getComponentTuningAnalysis = async (
  componentName: string,
  liveData: SensorDataPoint
): Promise<string> => {
  if (!isOnline()) {
    return `**Offline Analysis for ${componentName}**\n\nThis is a mock analysis as you are currently offline. Please reconnect to receive a detailed, data-driven tuning analysis from KC.`;
  }

  try {
    const data = await fetchFromApi({ type: 'TUNING_ANALYSIS', componentName, liveData });
    return data.text;
  } catch (error) {
    console.error(`Error fetching tuning analysis for ${componentName}:`, error);
    return "I'm sorry, I'm having trouble analyzing that component right now. Please try again in a moment.";
  }
};


export const getCoPilotResponse = async (
  command: string,
  vehicleData: SensorDataPoint,
  activeAlerts: DiagnosticAlert[]
): Promise<string> => {
    if (!isOnline()) {
        return "I couldn't process that command while offline. Please try asking about a specific system, like 'what's my oil pressure?'.";
    }

  try {
    const data = await fetchFromApi({ type: 'COPILOT_RESPONSE', command, vehicleData, activeAlerts });
    return data.text;
  } catch (error) {
    console.error("Error fetching Co-Pilot response from BFF:", error);
    return "I'm sorry, I'm having trouble communicating right now. Please try again in a moment.";
  }
};

export const generateDreamCorsaVideo = async (
    prompt: string,
    image?: { imageBytes: string; mimeType: string }
): Promise<string> => {
    if (!isOnline()) {
        throw new Error("Video generation requires an internet connection.");
    }

    try {
        const data = await fetchFromApi({ type: 'GENERATE_VIDEO', prompt, image });
        const videoResponse = await fetch(data.videoUrl); // The URL is pre-signed or proxied
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate video: ${error.message}`);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
};