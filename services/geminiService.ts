
import { GoogleGenAI, Type } from "@google/genai";
import { MaintenanceRecord, SensorDataPoint, TuningSuggestion, VoiceCommandIntent, DiagnosticAlert, AlertLevel, IntentAction } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this project, we assume the key is present in the environment.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const SYSTEM_INSTRUCTION = `You are an expert automotive mechanic and performance tuner named 'KC'. You are the AI assistant for the 'Karapiro Cartel Speed Shop' app. Your answers should be clear, concise, and helpful to both novice drivers and experienced technicians. When appropriate, provide step-by-step instructions or bullet points. Do not mention that you are an AI model. Format your responses using markdown for better readability.`;

const isOnline = () => navigator.onLine;

export const getDiagnosticAnswer = async (query: string): Promise<string> => {
  if (!isOnline()) {
    console.log("Offline mode: Returning mock diagnostic answer.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate thinking
    return `I am currently in offline mode. For your query about **"${query}"**, I would typically provide a detailed diagnostic. 
    
A common cause for many issues is related to sensors or fuel delivery. Please consider the following general advice:
- Check for any loose connections around the engine bay.
- Ensure your battery terminals are clean and tight.
- Review your maintenance log for any overdue services.

Please try your query again when you are back online for a full analysis.`;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching diagnostic answer from Gemini:", error);
    return "I'm sorry, I'm having trouble connecting to my diagnostic systems right now. Please try again in a moment.";
  }
};

export const getPredictiveAnalysis = async (
  liveData: SensorDataPoint,
  maintenanceHistory: MaintenanceRecord[]
) => {
    if (!isOnline()) {
        console.log("Offline mode: Returning mock predictive analysis.");
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate analysis
        return { 
          timelineEvents: [
            {
              id: 'offline-1',
              level: AlertLevel.Warning,
              title: 'Offline: Mock Spark Plug Wear',
              timeframe: 'Next 3000 miles',
              details: {
                component: 'Spark Plugs',
                rootCause: 'This is an offline mock analysis. Based on typical mileage, spark plugs may be nearing their service interval, which can lead to reduced efficiency.',
                recommendedActions: ['Visually inspect spark plugs for wear when online.', 'Schedule replacement if necessary.'],
                plainEnglishSummary: "It might be time to check your spark plugs soon. Worn plugs can affect performance and fuel economy. This is a mock suggestion as you are offline.",
                tsbs: ["TSB data unavailable offline"],
              }
            },
            {
              id: 'offline-2',
              level: AlertLevel.Info,
              title: 'Offline: Mock Air Filter Check',
              timeframe: 'Next Service',
              details: {
                component: 'Engine Air Filter',
                rootCause: 'This is an offline mock analysis. A clean air filter is crucial for engine performance.',
                recommendedActions: ['Visually inspect air filter.', 'Replace if dirty.'],
                plainEnglishSummary: "Remember to check your engine's air filter at your next service. This is a mock suggestion as you are offline.",
              }
            }
          ]
        };
    }

  const prompt = `
    Analyze the following vehicle data for potential issues.

    **Vehicle**: 2022 Subaru WRX (Simulated)
    **Mileage**: 45,000 miles
    
    **Live Data Snapshot**:
    - RPM: ${liveData.rpm.toFixed(0)}
    - Engine Load: ${liveData.engineLoad.toFixed(1)}%
    - Short Term Fuel Trim: ${liveData.shortTermFuelTrim.toFixed(1)}%
    - Long Term Fuel Trim: ${liveData.longTermFuelTrim.toFixed(1)}%
    - O2 Sensor Voltage: ${liveData.o2SensorVoltage.toFixed(2)}V
    - Engine Temp: ${liveData.engineTemp.toFixed(1)}°C

    **Maintenance History**: ${JSON.stringify(maintenanceHistory, null, 2)}

    **Your Task**:
    As the 'KC' AI mechanic, perform a deep analysis.
    1.  **Identify Anomalies**: Look for any unusual patterns or values in the live data, considering the vehicle's maintenance history.
    2.  **Root Cause Analysis**: If an anomaly is found, what are the 3 most likely root causes?
    3.  **Predictive Timeline**: Based on the data, what components are at immediate, near-term, or long-term risk of failure? Formulate a dynamic 'Risk Timeline'.
    4.  **Recommended Actions**: Provide a prioritized, step-by-step diagnostic and repair plan for the most urgent issue.
    5.  **Plain-English Summary**: Explain the core problem to the owner as if you were their trusted mechanic.
    6.  **Official Data**: Use your search tool to find any relevant Technical Service Bulletins (TSBs) or recalls for this issue on a 2022 Subaru WRX.
    7.  **JSON Output**: Structure your entire response as a single, valid JSON object. Do not wrap it in markdown code blocks.
        {
          "timelineEvents": [
            {
              "id": "event-1",
              "level": "Critical" | "Warning" | "Info",
              "title": "Component at Risk",
              "timeframe": "e.g., Immediate, Next 1000 miles",
              "details": {
                "component": "Component Name",
                "rootCause": "Detailed explanation of the likely root cause.",
                "recommendedActions": ["Action 1", "Action 2"],
                "plainEnglishSummary": "A simple explanation for the user.",
                "tsbs": ["TSB-123: Description", "Recall-456: Description"]
              }
            }
          ]
        }
        If no issues are found, return a JSON object with an empty "timelineEvents" array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Error fetching predictive analysis from Gemini:", error);
    return { 
      error: "Failed to get predictive analysis.",
      details: error instanceof Error ? error.message : String(error)
    };
  }
};


const tuningSchema = {
  type: Type.OBJECT,
  properties: {
    suggestedParams: {
      type: Type.OBJECT,
      properties: {
        fuelMap: {
          type: Type.NUMBER,
          description: "Fuel Map Enrichment percentage change. Integer. Range: -10 to 10."
        },
        ignitionTiming: {
          type: Type.NUMBER,
          description: "Ignition Timing Advance in degrees. Integer. Range: -5 to 5."
        },
        boostPressure: {
          type: Type.NUMBER,
          description: "Boost Pressure increase in PSI. Float. Range: 0 to 8."
        },
      },
      required: ["fuelMap", "ignitionTiming", "boostPressure"],
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        predictedGains: {
          type: Type.STRING,
          description: "A summary of the expected performance improvements."
        },
        potentialRisks: {
          type: Type.STRING,
          description: "A summary of potential risks, trade-offs, or requirements for this tune."
        }
      },
      required: ["predictedGains", "potentialRisks"],
    }
  },
  required: ["suggestedParams", "analysis"],
};


export const getTuningSuggestion = async (
  liveData: SensorDataPoint,
  drivingStyle: string,
  conditions: string
): Promise<TuningSuggestion> => {
    if (!isOnline()) {
        console.log("Offline mode: Returning mock tuning suggestion.");
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate generation
        return {
            suggestedParams: {
                fuelMap: 2,
                ignitionTiming: 1,
                boostPressure: 0.5,
            },
            analysis: {
                predictedGains: "Offline Mock: A safe, mild improvement in throttle response and mid-range torque.",
                potentialRisks: "Offline Mock: This is a conservative base map. A full online analysis is required for an optimized and safe tune for your specific conditions."
            }
        };
    }

  const prompt = `
    You are 'KC', an expert automotive performance tuner for the 'Karapiro Cartel Speed Shop'. Your task is to provide a personalized engine tune recommendation.

    **Vehicle**: 2022 Subaru WRX (Simulated)
    **Mileage**: 45,000 miles

    **User's Goal**:
    - Driving Style: ${drivingStyle}
    - Environmental Conditions: ${conditions}

    **Live Data Snapshot**:
    - RPM: ${liveData.rpm.toFixed(0)}
    - Engine Load: ${liveData.engineLoad.toFixed(1)}%
    - Inlet Air Temp: ${liveData.inletAirTemp.toFixed(1)}°C
    - Turbo Boost: ${liveData.turboBoost.toFixed(1)} BAR

    **Your Task**:
    Based on the user's goal and the live data, provide a safe but effective engine tune.
    1.  **Suggest Parameters**: Recommend specific adjustments for the following parameters. The values should be relative changes from the baseline (0).
        - \`fuelMap\`: Fuel Map Enrichment (%). A value between -10 and 10.
        - \`ignitionTiming\`: Ignition Timing Advance (°). A value between -5 and 5.
        - \`boostPressure\`: Boost Pressure increase (PSI). A value between 0 and 8.
    2.  **Analyze the Tune**: Briefly explain the performance gains and any potential risks or trade-offs associated with your recommendation. Keep it concise and clear for the user.

    **JSON Output**:
    Structure your entire response as a single, valid JSON object following the provided schema. Do not add any extra text or markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tuningSchema,
      },
    });

    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as TuningSuggestion;
  } catch (error) {
    console.error("Error fetching tuning suggestion from Gemini:", error);
    throw new Error("Failed to get tuning suggestion.");
  }
};

const voiceCommandSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "The user's primary goal. Must be one of: 'SHOW_COMPONENT', 'QUERY_SERVICE', 'HIDE_COMPONENT', 'UNKNOWN'.",
    },
    component: {
      type: Type.STRING,
      description: "If intent is 'SHOW_COMPONENT', the normalized component ID. Must be one of: 'o2-sensor', 'map-sensor', 'alternator', 'turbo', 'intake', 'coolant', 'oil-filter'. Otherwise, null.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "A score from 0.0 to 1.0 indicating how confident you are in this interpretation."
    }
  },
  required: ["intent", "confidence"],
};

export const getVoiceCommandIntent = async (command: string): Promise<VoiceCommandIntent> => {
    if (!isOnline()) {
        console.log("Offline mode: Parsing voice command locally.");
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate local processing
        const lowerCommand = command.toLowerCase();
        
        const components = ['o2-sensor', 'map-sensor', 'alternator', 'turbo', 'intake', 'coolant', 'oil-filter'];
        for (const component of components) {
            if (lowerCommand.includes(component.replace('-', ' '))) {
                return { intent: IntentAction.ShowComponent, component, confidence: 0.9 };
            }
        }

        if (lowerCommand.includes('service') || lowerCommand.includes('maintenance')) {
            return { intent: IntentAction.QueryService, confidence: 0.9 };
        }
        if (lowerCommand.includes('clear') || lowerCommand.includes('hide')) {
            return { intent: IntentAction.HideComponent, confidence: 0.9 };
        }
        if (lowerCommand.includes('show') || lowerCommand.includes('highlight')) {
             return { intent: IntentAction.ShowComponent, component: 'turbo', confidence: 0.8 }; 
        }

        return { intent: IntentAction.Unknown, confidence: 1.0 };
    }

  const prompt = `
    You are the Natural Language Understanding (NLU) engine for 'KC', an AR automotive assistant. Your task is to interpret the user's voice command and translate it into a structured JSON format.

    **User Command**: "${command}"

    **Available Component IDs**: 'o2-sensor', 'map-sensor', 'alternator', 'turbo', 'intake', 'coolant', 'oil-filter'.
    
    **Available Intents**:
    - \`SHOW_COMPONENT\`: User wants to visually identify or get information about a specific part.
    - \`QUERY_SERVICE\`: User is asking about maintenance, service history, or when the next service is due.
    - \`HIDE_COMPONENT\`: User wants to clear or hide the visual highlights.
    - \`UNKNOWN\`: The command is unclear or unrelated to the available actions.

    **Your Task**:
    1. Determine the user's \`intent\`.
    2. If the intent is \`SHOW_COMPONENT\`, identify the requested \`component\` and map it to one of the available component IDs. The component should be null for other intents.
    3. Provide a \`confidence\` score for your interpretation.

    **Examples**:
    - "Show me the oxygen sensor" -> { "intent": "SHOW_COMPONENT", "component": "o2-sensor", "confidence": 0.95 }
    - "What is my next required service?" -> { "intent": "QUERY_SERVICE", "confidence": 0.98 }
    - "Highlight the turbo" -> { "intent": "SHOW_COMPONENT", "component": "turbo", "confidence": 0.9 }
    - "Clear the screen" -> { "intent": "HIDE_COMPONENT", "confidence": 0.92 }
    - "What's the weather like?" -> { "intent": "UNKNOWN", "confidence": 1.0 }

    Output your response as a single, valid JSON object following the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: voiceCommandSchema,
      },
    });

    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Ensure the intent string from the API maps to our enum
    const parsed = JSON.parse(cleanedText);
    parsed.intent = Object.values(IntentAction).includes(parsed.intent) ? parsed.intent : IntentAction.Unknown;
    return parsed as VoiceCommandIntent;
  } catch (error) {
    console.error("Error fetching voice command intent from Gemini:", error);
    return {
      intent: IntentAction.Unknown,
      confidence: 1.0,
      error: 'Failed to process command.',
    } as any;
  }
};

export const generateComponentImage = async (componentName: string): Promise<string> => {
    if (!isOnline()) {
        console.log("Offline mode: Returning placeholder image.");
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1A202C"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="32" fill="#A0AEC0">${componentName}</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" fill="#718096">(Diagram is unavailable offline)</text></svg>`;
        return `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
    }
  try {
    const prompt = `A high-resolution, photorealistic image of a single automotive '${componentName}' for a 2022 Subaru WRX, isolated on a clean white background. Studio lighting.`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error("No image was generated.");
    }
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
    await new Promise(resolve => setTimeout(resolve, 600));
    return `**Offline Analysis for ${componentName}**
    
    This is a mock analysis as you are currently offline. A full analysis would consider real-time data to provide specific tuning advice.
    
    *   **General Role**: The ${componentName} is a critical part of the engine system.
    *   **Tuning Impact**: Adjusting parameters related to this component can significantly affect performance and engine health. For example, for a turbocharger, adjusting boost pressure is key.
    
    Please reconnect to receive a detailed, data-driven tuning analysis from KC.`;
  }

  const prompt = `
    You are 'KC', an expert automotive performance tuner for the 'Karapiro Cartel Speed Shop'. Your task is to provide a concise tuning analysis for a specific engine component.

    **Vehicle**: 2022 Subaru WRX (Simulated)

    **Component to Inspect**: ${componentName}

    **Live Data Snapshot**:
    - RPM: ${liveData.rpm.toFixed(0)}
    - Turbo Boost: ${liveData.turboBoost.toFixed(2)} BAR
    - Engine Load: ${liveData.engineLoad.toFixed(1)}%

    **Your Task**:
    1.  Briefly explain the role of the '${componentName}' in relation to engine performance.
    2.  Analyze how its current state might be inferred from the live data (if applicable).
    3.  Explain which tuning parameters (e.g., Fuel Map Enrichment, Ignition Timing Advance, Boost Pressure) are most directly affected by or can affect this component.
    4.  Provide one key tuning tip related to this component.

    **Output**:
    - Format your response using clear, concise markdown.
    - Do not exceed 150 words.
    - Be direct and actionable for a tuner.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error(`Error fetching tuning analysis for ${componentName}:`, error);
    return "I'm sorry, I'm having trouble analyzing that component right now. Please try again in a moment.";
  }
};


const COPILOT_INSTRUCTION = `You are 'KC', a hands-free, voice-activated AI Co-Pilot for a high-performance vehicle. Your purpose is to assist the driver with real-time information and diagnostics. Be conversational, concise, and direct. Your responses will be read aloud, so avoid long paragraphs, complex markdown, or lists. Focus on providing immediate, actionable information. The user is likely driving.`;

export const getCoPilotResponse = async (
  command: string,
  vehicleData: SensorDataPoint,
  activeAlerts: DiagnosticAlert[]
): Promise<string> => {
    if (!isOnline()) {
        console.log("Offline mode: Generating Co-Pilot response locally.");
        await new Promise(resolve => setTimeout(resolve, 200));
        const lowerCommand = command.toLowerCase();

        if (activeAlerts.length > 0 && (lowerCommand.includes('status') || lowerCommand.includes('what\'s up') || lowerCommand.includes('everything ok'))) {
            const criticalAlert = activeAlerts.find(a => a.level === AlertLevel.Critical) || activeAlerts[0];
            return `I have an active alert for the ${criticalAlert.component}. The system reports: ${criticalAlert.message}. I recommend you look into this.`;
        }
        if (lowerCommand.includes('oil pressure')) {
            return `Your oil pressure is currently ${vehicleData.oilPressure.toFixed(1)} bar.`;
        }
        if (lowerCommand.includes('boost')) {
            return `You're currently at ${vehicleData.turboBoost.toFixed(2)} bar of boost.`;
        }
        if (lowerCommand.includes('engine temp') || lowerCommand.includes('temperature')) {
            return `Engine temperature is ${vehicleData.engineTemp.toFixed(1)} degrees Celsius.`;
        }
        if (lowerCommand.includes('status') || lowerCommand.includes('everything ok')) {
            return "Yes, all systems are nominal. Everything looks good.";
        }

        return "I couldn't process that command while offline. Please try asking about a specific system, like 'what's my oil pressure?'.";
    }

  const prompt = `
    The driver just gave you a voice command. Use the provided real-time context to give the best possible response.

    **Driver's Command**: "${command}"

    **Real-Time Vehicle Data**:
    - RPM: ${vehicleData.rpm.toFixed(0)}
    - Speed: ${vehicleData.speed.toFixed(0)} km/h
    - Gear: ${vehicleData.gear}
    - Engine Temp: ${vehicleData.engineTemp.toFixed(1)}°C
    - Turbo Boost: ${vehicleData.turboBoost.toFixed(2)} bar
    - Oil Pressure: ${vehicleData.oilPressure.toFixed(1)} bar

    **Active Diagnostic Alerts**:
    ${activeAlerts.length > 0 ? JSON.stringify(activeAlerts, null, 2) : "None. All systems are normal."}

    **Your Task**:
    1.  **Acknowledge Alerts**: If the command is general (e.g., "What's my status?", "Is everything okay?") and there are active alerts, prioritize explaining the most critical alert in simple terms.
    2.  **Answer Directly**: If the command is a specific question (e.g., "What's my oil pressure?"), answer it using the real-time data.
    3.  **Be Proactive**: If you notice something in the data that's relevant to the command, mention it. For example, if asked for engine temp and it's high, say so.
    4.  **Keep it Brief**: Remember, your response will be spoken aloud. Aim for one or two short sentences.

    **Example Responses**:
    - *User Command: "Hey KC, what's going on?" with a MAP sensor alert active.* -> "I've detected a critical fault with the MAP sensor. Readings are erratic, which could cause a stall. I recommend pulling over to inspect it."
    - *User Command: "What's my current boost?"* -> "You're currently at ${vehicleData.turboBoost.toFixed(2)} bar of boost."
    - *User Command: "Is everything okay?" with no alerts.* -> "Yes, all systems are nominal. Everything looks good."
    - *User Command: "Tell me about my engine."* -> "Your engine is running at ${vehicleData.rpm.toFixed(0)} RPM, with a coolant temperature of ${vehicleData.engineTemp.toFixed(1)} degrees Celsius. Oil pressure is stable."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: COPILOT_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching Co-Pilot response from Gemini:", error);
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
        const request: any = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
            },
        };

        if (image) {
            request.image = image;
        }

        let operation = await ai.models.generateVideos(request);

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation succeeded, but no download link was provided.");
        }

        // Fetch the video data using the API key
        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
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
