
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const TUNING_SYSTEM_INSTRUCTION = `You are 'KC', an elite performance tuner AI. Your expertise is in ECU calibration for high-performance vehicles. Analyze the provided sensor data and environmental context to generate actionable, safe tuning suggestions. Structure your response precisely according to the requested JSON schema.`;

// A simple routing mechanism based on the 'type' field in the request body.
export default async function handler(req: Request) {
  try {
    const body = await req.json();

    switch (body.type) {
      case 'GET_SUGGESTIONS':
        return handleGetAiSuggestions(body);
      case 'PREWRITE_CHECK':
        return handlePrewriteCheck(body);
      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400 });
    }
  } catch (error) {
    console.error("Error in Tuning BFF handler:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

async function handleGetAiSuggestions(body: any) {
  const { sensors, context } = body;
  const prompt = `
    Analyze the following tuning parameters and environmental context for a modified Subaru WRX.
    Current Tune:
    - RPM Limit: ${sensors.rpmLimit}
    - Boost Target: ${sensors.boostTarget} bar
    - AFR Target (under boost): ${sensors.afrTarget}

    Environmental Context:
    - Ambient Temperature: ${context.ambientC}°C
    - Altitude: ${context.altitudeM}m
    - Fuel Octane: ${context.fuelOctane}

    Provide tuning suggestions based on this data.
  `;
  
  const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    changes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                from: { type: Type.NUMBER },
                                to: { type: Type.NUMBER },
                            }
                        }
                    },
                    risk: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                }
            }
        }
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: TUNING_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: suggestionsSchema,
    },
  });

  return new Response(response.text, { headers: { 'Content-Type': 'application/json' } });
}

async function handlePrewriteCheck(body: any) {
    const { tuneParams } = body;
    const prompt = `
        Perform a final safety pre-write check on these ECU parameters for a modified Subaru WRX.
        - RPM Limit: ${tuneParams.rpmLimit}
        - Boost Target: ${tuneParams.boostTarget} bar
        - AFR Target: ${tuneParams.afrTarget}

        Is this tune safe? If not, provide a brief reason.
    `;

    const checkSchema = {
        type: Type.OBJECT,
        properties: {
            ok: { type: Type.BOOLEAN, description: "True if the tune is safe, false otherwise." },
            reason: { type: Type.STRING, description: "If not ok, a brief explanation of the primary risk. Null if ok." },
        }
    };
    
    const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: TUNING_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: checkSchema,
        },
    });

    const aiResult = JSON.parse(aiResponse.text);

    // Calculate audit hash on the server
    const audit_payload = `${tuneParams.rpmLimit}|${tuneParams.boostTarget}|${tuneParams.afrTarget}|${Math.floor(Date.now() / 1000)}`;
    const data = new TextEncoder().encode(audit_payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const finalResponse = {
        ...aiResult,
        audit: { hash: hashHex, payload: audit_payload },
    };

    return new Response(JSON.stringify(finalResponse), { headers: { 'Content-Type': 'application/json' } });
}
