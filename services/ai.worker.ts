import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@^1.12.0";
import { MaintenanceRecord, SensorDataPoint, TuningSuggestion, VoiceCommandIntent, DiagnosticAlert, AlertLevel, IntentAction, PredictiveAnalysisResult, GroundedResponse, SavedRaceSession } from '../types';

// Safely access the API key. In a web worker, `process` might not be defined.
// The execution environment is expected to provide this value.
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
    ? process.env.API_KEY
    : undefined;


if (!API_KEY) {
  // This log helps in debugging if the key isn't injected correctly into the worker's scope.
  console.error('AI Worker: API_KEY is not configured. AI services are unavailable.');
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const isOnline = () => self.navigator.onLine;

const getPredictiveAnalysis = async (
  dataHistory: SensorDataPoint[],
  maintenanceHistory: MaintenanceRecord[]
): Promise<PredictiveAnalysisResult> => {
    if (!ai || !isOnline()) {
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate network latency
        return { 
          timelineEvents: [
            { id: 'offline-1', level: AlertLevel.Warning, title: 'Offline: Mock Spark Plug Wear', timeframe: 'Next 3000 miles',
              details: { component: 'Spark Plugs', rootCause: 'Offline mock analysis.', recommendedActions: ['Inspect when online.'], plainEnglishSummary: "Offline mock suggestion.", tsbs: ["TSB data unavailable offline"], } }
          ]
        };
    }

    if (dataHistory.length < 2) {
        return { error: "Not enough data for trend analysis.", details: "At least two data points are required." };
    }

    const firstPoint = dataHistory[0];
    const lastPoint = dataHistory[dataHistory.length - 1];
    const durationSeconds = (lastPoint.time - firstPoint.time) / 1000;

    const dataTrendSummary = `
      - **Duration**: ${durationSeconds.toFixed(1)} seconds.
      - **RPM Range**: ${firstPoint.rpm.toFixed(0)} to ${lastPoint.rpm.toFixed(0)}.
      - **Long Term Fuel Trim Trend**: ${firstPoint.longTermFuelTrim.toFixed(1)}% to ${lastPoint.longTermFuelTrim.toFixed(1)}%.
      - **Oil Pressure Trend**: ${firstPoint.oilPressure.toFixed(1)} to ${lastPoint.oilPressure.toFixed(1)} bar.
    `;
    
    const systemInstructionForAnalysis = `You are 'KC', an expert automotive AI mechanic specializing in predictive maintenance for a 2022 Subaru WRX with 45,000 miles. Your task is to analyze vehicle data trends and maintenance history to identify potential future mechanical issues.
- Analyze trends for anomalies (e.g., rising Long Term Fuel Trim, dropping oil pressure under load).
- Predict risks to specific components.
- Categorize the risk timeframe (e.g., 'Immediate', 'Next 1000 miles', 'Next 3 months').
- Provide a likely root cause based on the provided data.
- Suggest concrete, actionable steps for the user.
- Include a simple, plain-English summary of the problem.
- If possible, suggest relevant Technical Service Bulletin (TSB) numbers.
- You MUST output a single, valid JSON object matching the provided schema.
- If no significant issues are found, return a JSON object with an empty "timelineEvents" array.`;

    const userContent = `
        **Data Trend Summary**: ${dataTrendSummary}
        **Latest Snapshot**: RPM: ${lastPoint.rpm.toFixed(0)}, LTFT: ${lastPoint.longTermFuelTrim.toFixed(1)}%, Oil Pressure: ${lastPoint.oilPressure.toFixed(1)} bar
        **Maintenance History**: ${JSON.stringify(maintenanceHistory)}
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userContent,
      config: {
        systemInstruction: systemInstructionForAnalysis,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timelineEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  level: { type: Type.STRING, enum: Object.values(AlertLevel) },
                  title: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  details: {
                    type: Type.OBJECT,
                    properties: {
                      component: { type: Type.STRING },
                      rootCause: { type: Type.STRING },
                      recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      plainEnglishSummary: { type: Type.STRING },
                      tsbs: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                    },
                    required: ["component", "rootCause", "recommendedActions", "plainEnglishSummary"],
                  }
                },
                 required: ["id", "level", "title", "timeframe", "details"],
              }
            }
          },
           required: ["timelineEvents"],
        }
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error in worker fetching predictive analysis:", error);
    return { error: "Failed to get predictive analysis.", details: error instanceof Error ? error.message : String(error) };
  }
};

const getTuningSuggestion = async (liveData: SensorDataPoint, drivingStyle: string, conditions: string): Promise<TuningSuggestion> => {
    // This function remains a mock as per the user's focus on other features.
    return {
        suggestedParams: { fuelMap: 1.5, ignitionTiming: 0.5, boostPressure: 2.0 },
        analysis: {
            predictedGains: "Approximately 10-15 HP increase.",
            potentialRisks: "Slightly increased engine wear over time."
        }
    };
};

const getVoiceCommandIntent = async (command: string): Promise<VoiceCommandIntent> => {
    if (!ai || !isOnline()) {
        // Fallback to simple regex if offline
        if (/show|display|point out/i.test(command)) {
            const match = command.match(/o2 sensor|map sensor|alternator|turbo|intake|coolant|oil filter/i);
            return { intent: IntentAction.ShowComponent, component: match ? match[0].toLowerCase().replace(/\s/g, '-') : 'turbo', confidence: 0.85 };
        }
        if (/service|maintenance/i.test(command)) { return { intent: IntentAction.QueryService, confidence: 0.9 }; }
        if (/hide|clear|reset/i.test(command)) { return { intent: IntentAction.HideComponent, confidence: 0.9 }; }
        return { intent: IntentAction.Unknown, confidence: 0.3 };
    }

    const systemInstructionForIntent = `You are an intent parser for a vehicle's AR assistant. Analyze the user's command and classify it into one of the following intents: ${Object.values(IntentAction).join(', ')}. If the intent is 'SHOW_COMPONENT', extract the component name. The valid components are: 'o2-sensor', 'map-sensor', 'alternator', 'turbo', 'intake', 'coolant', 'oil-filter'. Respond ONLY with a valid JSON object matching the schema.`;
    const prompt = `User command: "${command}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstructionForIntent,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: { type: Type.STRING, enum: Object.values(IntentAction) },
                        component: { type: Type.STRING, nullable: true },
                        confidence: { type: Type.NUMBER }
                    },
                    required: ['intent', 'confidence']
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error parsing voice command intent:", error);
        return { intent: IntentAction.Unknown, confidence: 0.0 };
    }
};

const generateComponentImage = async (componentName: string): Promise<string> => {
  if (!ai || !isOnline()) {
     const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="100%" height="100%" fill="#333642"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#ffc658">Offline</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#fff">Diagram for ${componentName}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A simplified, clear, technical line drawing diagram of a car's ${componentName}. White background, black lines, minimalist style, like an engineering service manual. No text or labels.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated by the API.");
    }
  } catch (error) {
    console.error(`Error generating image for ${componentName}:`, error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="100%" height="100%" fill="#333642"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#ff4d4d">Error</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#fff">Could not generate diagram</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
};

const getComponentTuningAnalysis = async (componentName: string, liveData: SensorDataPoint): Promise<string> => {
  if (!ai || !isOnline()) {
    return `**Offline Mode**: Cannot analyze ${componentName}.`;
  }
  const systemInstructionForTuning = `You are KC, an expert automotive performance tuner. Analyze the provided component and its live data. Provide a concise analysis (2-3 sentences) of its current state and potential tuning improvements or issues. Focus on what the live data indicates. Be direct and use markdown for formatting.`;
  const prompt = `Component: ${componentName}. Live Data Snapshot: ${JSON.stringify(liveData)}. Provide your analysis.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { systemInstruction: systemInstructionForTuning }
    });
    return response.text;
  } catch (error) {
    console.error(`Error generating analysis for ${componentName}:`, error);
    return `**Error**: Could not retrieve analysis for ${componentName}. Please try again.`;
  }
};

const getCoPilotResponse = async (command: string, vehicleData: SensorDataPoint, activeAlerts: DiagnosticAlert[]): Promise<string> => {
    if (!ai || !isOnline()) {
        if (/alert|warning|status/i.test(command)) {
            return "Cannot check alerts while offline.";
        }
        return "Co-pilot is offline. Please try again later.";
    }

    const systemInstructionForCopilot = `You are KC, a hands-free AI co-pilot in a vehicle. You are talking to the driver. Keep responses very short and conversational (1-2 sentences max). Use the provided vehicle data and alerts to answer the driver's questions directly. Do not offer to do things you cannot, like 'pulling over'.`;
    
    const context = `
      **Current Vehicle Data:**
      - Speed: ${vehicleData.speed.toFixed(0)} km/h
      - RPM: ${vehicleData.rpm.toFixed(0)} RPM
      - Engine Temp: ${vehicleData.engineTemp.toFixed(0)}°C

      **Active Alerts:**
      ${activeAlerts.length > 0 ? JSON.stringify(activeAlerts) : "None"}
    `;
    
    const prompt = `Context:\n${context}\n\nDriver asks: "${command}"\n\nYour spoken response:`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: systemInstructionForCopilot }
      });
      return response.text;
    } catch (error) {
      console.error("Error fetching CoPilot response:", error);
      return "I'm having a little trouble right now. Can you ask me again?";
    }
};

const getCrewChiefResponse = async (query: string): Promise<GroundedResponse> => {
    if (!ai || !isOnline()) {
        return { text: "Crew Chief is offline. Please check your connection to search for parts.", chunks: [] };
    }
    const systemInstructionForCrewChief = `You are 'KC', a helpful Crew Chief AI. Your job is to help users find automotive parts. Use your search tool to find suppliers or information about the requested part. Provide a summary and always include the source links.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                systemInstruction: systemInstructionForCrewChief,
                tools: [{googleSearch: {}}],
            },
        });
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, chunks: groundingChunks };
    } catch (error) {
        console.error("Error fetching Crew Chief response:", error);
        return { text: "Sorry, I ran into an issue searching for that part. Please try again.", chunks: [] };
    }
};

const getRouteScoutResponse = async (query: string, location: { latitude: number, longitude: number }): Promise<GroundedResponse> => {
    if (!ai || !isOnline()) {
        return { text: "Route Scout is offline. Please check your connection for route suggestions.", chunks: [] };
    }
    const systemInstructionForRouteScout = `You are 'KC', an expert route scout for performance driving enthusiasts. Based on my current location and your access to real-time map data, suggest an interesting route. The user is asking about: "${query}". Frame your suggestions for things like spirited drives, potential street circuits, scenic club convoys, or suitable private spots for 1/4 mile runs. Provide a conversational, helpful response and use markdown for formatting.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemInstructionForRouteScout,
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: {
                    retrievalConfig: {
                        latLng: location
                    }
                }
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, chunks: groundingChunks };
    } catch (error) {
        console.error("Error fetching Route Scout response:", error);
        return { text: "Sorry, I couldn't scout any routes right now. Please try again.", chunks: [] };
    }
};

const getRaceAnalysis = async (session: SavedRaceSession): Promise<string> => {
    if (!ai) return "AI Race Coach is unavailable.";
    
    const systemInstructionForRaceCoach = `You are 'KC', a world-class AI race engineer and driver coach. Analyze the provided race session data for a skilled enthusiast driver. Your analysis should be insightful, actionable, and encouraging.
- Start with a positive, high-level summary of the session.
- Identify the best lap and explain what made it fast (e.g., "Your best lap was Lap 3. You carried excellent speed through the chicane.").
- Pinpoint 1-2 key areas for improvement. Be specific and use data (e.g., "On your slower laps, it looks like you were braking a little too early for Turn 5, costing you a few tenths. Try using the 100m board as your braking marker.").
- Analyze performance benchmarks (0-60, 1/4 mile etc.) and comment on them.
- Conclude with an encouraging remark and a suggestion for the next session.
- Format your response using markdown for clear readability with headings and bullet points.`;
    
    // Sanitize and summarize data to send to the model
    const sessionSummary = {
        totalTime: session.totalTime,
        maxSpeed: session.maxSpeed,
        lapTimes: session.lapTimes,
        benchmarks: {
            "0-100km/h": session.zeroToHundredKmhTime,
            "0-60mph": session.zeroToSixtyMphTime,
            "1/4 Mile Time": session.quarterMileTime,
            "1/4 Mile Speed": session.quarterMileSpeed,
        }
    };

    const userContent = `Please analyze this race session data and provide coaching feedback:\n${JSON.stringify(sessionSummary, null, 2)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: userContent,
            config: { systemInstruction: systemInstructionForRaceCoach }
        });
        return response.text;
    } catch (error) {
        console.error("Error in worker fetching race analysis:", error);
        return "I'm sorry, I encountered an error while analyzing your session data.";
    }
};


self.onmessage = async (e: MessageEvent) => {
    const { type, payload, requestId } = e.data;
    if (!API_KEY || !ai) {
        self.postMessage({ type: 'error', command: type, error: 'AI worker is not initialized. API_KEY might be missing.', requestId });
        return;
    }
    try {
        let result;
        switch (type) {
            case 'getPredictiveAnalysis':
                result = await getPredictiveAnalysis(payload.dataHistory, payload.maintenanceHistory);
                break;
            case 'getTuningSuggestion':
                result = await getTuningSuggestion(payload.liveData, payload.drivingStyle, payload.conditions);
                break;
            case 'getVoiceCommandIntent':
                result = await getVoiceCommandIntent(payload.command);
                break;
            case 'generateComponentImage':
                result = await generateComponentImage(payload.componentName);
                break;
            case 'getComponentTuningAnalysis':
                result = await getComponentTuningAnalysis(payload.componentName, payload.liveData);
                break;
            case 'getCoPilotResponse':
                result = await getCoPilotResponse(payload.command, payload.vehicleData, payload.activeAlerts);
                break;
            case 'getCrewChiefResponse':
                result = await getCrewChiefResponse(payload.query);
                break;
            case 'getRouteScoutResponse':
                result = await getRouteScoutResponse(payload.query, payload.location);
                break;
            case 'getRaceAnalysis':
                result = await getRaceAnalysis(payload.session);
                break;
            default:
                throw new Error(`Unknown worker command: ${type}`);
        }
        self.postMessage({ type: 'success', command: type, result, requestId });
    } catch (error) {
        self.postMessage({ type: 'error', command: type, error: error instanceof Error ? error.message : String(error), requestId });
    }
};