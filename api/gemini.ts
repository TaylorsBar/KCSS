
// This is a serverless function that acts as a secure backend-for-frontend (BFF).
// It receives requests from our client, adds the secret API key, and forwards them to the Gemini API.
// This prevents the API_KEY from ever being exposed in the browser.

import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert automotive mechanic and performance tuner named 'KC', with unparalleled expertise in ECU tuning and engine diagnostics. You are the integrated AI assistant for the 'Karapiro Cartel Speed Shop' app. Your answers should be clear, concise, and helpful to both novice drivers and experienced technicians. When providing solutions, you should reference and guide the user to use the app's built-in features (like the Diagnostic scanner, Tuning maps, AR Assistant, etc.) whenever possible. For example, instead of saying 'scan for codes', say 'use the Diagnostics tool to scan for fault codes'. Do not mention that you are an AI model. Format your responses using markdown for better readability.`;
const COPILOT_INSTRUCTION = `You are 'KC', a hands-free, voice-activated AI Co-Pilot for a high-performance vehicle, with deep diagnostic knowledge. Your purpose is to assist the driver with real-time information and diagnostics. Be conversational, concise, and direct. Your responses will be read aloud, so avoid long paragraphs, complex markdown, or lists. Focus on providing immediate, actionable information. The user is likely driving.`;

// A simple routing mechanism based on the 'type' field in the request body.
export default async function handler(req: Request) {
  try {
    const body = await req.json();

    switch (body.type) {
      case 'DIAGNOSTIC_ANSWER':
        return handleDiagnosticAnswer(body);
      case 'PREDICTIVE_ANALYSIS':
        return handlePredictiveAnalysis(body);
      case 'VOICE_INTENT':
        return handleVoiceIntent(body);
      case 'GENERATE_IMAGE':
        return handleGenerateImage(body);
      case 'TUNING_ANALYSIS':
        return handleTuningAnalysis(body);
      case 'COPILOT_RESPONSE':
        return handleCopilotResponse(body);
      case 'GENERATE_VIDEO':
        return handleGenerateVideo(body);
      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400 });
    }
  } catch (error) {
    console.error("Error in BFF handler:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

async function handleDiagnosticAnswer(body: any) {
  const { query } = body;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return new Response(JSON.stringify({ text: response.text }));
}

async function handlePredictiveAnalysis(body: any) {
    const { liveData, maintenanceHistory } = body;
    const prompt = `Analyze the following vehicle data for potential issues.

    **Vehicle**: 2022 Subaru WRX (Simulated)
    **Mileage**: 45,000 miles
    
    **Live Data Snapshot**:
    - RPM: ${liveData.rpm.toFixed(0)}
    - Engine Load: ${liveData.engineLoad.toFixed(1)}%
    - Long Term Fuel Trim: ${liveData.longTermFuelTrim.toFixed(1)}%
    - O2 Sensor Voltage: ${liveData.o2SensorVoltage.toFixed(2)}V
    - Engine Temp: ${liveData.engineTemp.toFixed(1)}°C

    **Maintenance History**: ${JSON.stringify(maintenanceHistory, null, 2)}

    **Your Task**:
    As the 'KC' AI mechanic, perform a deep analysis.
    1.  **Identify Anomalies**: Look for any unusual patterns or values.
    2.  **Predictive Timeline**: What components are at risk? Formulate a dynamic 'Risk Timeline'.
    3.  **Recommended Actions**: Provide a prioritized, step-by-step diagnostic and repair plan.
    4.  **Plain-English Summary**: Explain the core problem to the owner.
    5.  **Official Data**: Find any relevant Technical Service Bulletins (TSBs) for this issue on a 2022 Subaru WRX.
    6.  **JSON Output**: Structure your entire response as a single, valid JSON object.
        {
          "timelineEvents": [
            {
              "id": "event-1", "level": "Critical" | "Warning" | "Info", "title": "Component at Risk", "timeframe": "e.g., Immediate",
              "details": { "component": "Component Name", "rootCause": "...", "recommendedActions": ["..."], "plainEnglishSummary": "...", "tsbs": ["..."] }
            }
          ]
        }
        If no issues are found, return a JSON object with an empty "timelineEvents" array.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return new Response(cleanedText, { headers: { 'Content-Type': 'application/json' } });
}

async function handleVoiceIntent(body: any) {
    const { command } = body;
    const voiceCommandSchema = {
      type: Type.OBJECT,
      properties: {
        intent: { type: Type.STRING, description: "Must be one of: 'SHOW_COMPONENT', 'QUERY_SERVICE', 'HIDE_COMPONENT', 'UNKNOWN'." },
        component: { type: Type.STRING, description: "Normalized component ID if intent is SHOW_COMPONENT. Must be one of: 'o2-sensor', 'map-sensor', 'alternator', 'turbo', 'intake', 'coolant', 'oil-filter'. Otherwise, null." },
        confidence: { type: Type.NUMBER, description: "A score from 0.0 to 1.0." }
      },
      required: ["intent", "confidence"],
    };
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Interpret the user's voice command and translate it into the structured JSON format. User Command: "${command}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: voiceCommandSchema,
        },
    });
    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return new Response(cleanedText, { headers: { 'Content-Type': 'application/json' } });
}

async function handleGenerateImage(body: any) {
    const { componentName } = body;
    const prompt = `A high-resolution, photorealistic image of a single automotive '${componentName}' for a 2022 Subaru WRX, isolated on a clean white background. Studio lighting.`;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    return new Response(JSON.stringify({ imageUrl }));
}

async function handleTuningAnalysis(body: any) {
    const { componentName, liveData } = body;
    const prompt = `You are 'KC', an expert automotive performance tuner. Provide a concise tuning analysis for the '${componentName}'.
        **Vehicle**: 2022 Subaru WRX (Simulated)
        **Live Data**: RPM: ${liveData.rpm.toFixed(0)}, Boost: ${liveData.turboBoost.toFixed(2)} BAR
        **Task**: 1. Explain the role of the component. 2. Explain which tuning parameters affect this component. 3. Provide one key tuning tip.
        **Output**: Format as clear, concise markdown. Max 150 words.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return new Response(JSON.stringify({ text: response.text }));
}

async function handleCopilotResponse(body: any) {
    const { command, vehicleData, activeAlerts } = body;
    const prompt = `Driver's Command: "${command}"
        Real-Time Data: RPM: ${vehicleData.rpm.toFixed(0)}, Speed: ${vehicleData.speed.toFixed(0)} km/h, Boost: ${vehicleData.turboBoost.toFixed(2)} bar
        Active Alerts: ${activeAlerts.length > 0 ? JSON.stringify(activeAlerts) : "None"}
        Task: Respond to the driver's command concisely. If there are alerts, prioritize the most critical one.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: COPILOT_INSTRUCTION }
    });
    return new Response(JSON.stringify({ text: response.text }));
}

async function handleGenerateVideo(body: any) {
    const { prompt, image } = body;
    const request: any = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 },
    };
    if (image) { request.image = image; }

    let operation = await ai.models.generateVideos(request);
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to provide a download link.");
    }
    const videoUrl = `${downloadLink}&key=${API_KEY}`;
    return new Response(JSON.stringify({ videoUrl }));
}