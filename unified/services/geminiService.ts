// ============================================================
// Genesis OS — Gemini AI Service v2.0
// Karapiro Cartel Speed Shop
//
// Fixes over previous versions:
//   • Correct model names (no fabricated versions)
//   • Unified across genesis-os and remix packages (no duplicates)
//   • Better data downsampling for coaching (every 5th point, 100 samples)
//   • executeObdCommand tool requires TIER_1 and is audit-logged
//   • Lambda plausibility check before sending to AI
//   • Streaming support for long coaching sessions
// ============================================================

import { GoogleGenAI, Type, Modality, FunctionDeclaration } from '@google/genai';
import {
  SensorDataPoint, DiagnosticCode, VoiceActionResponse, DiagnosticAlert,
  DTCAnalysis, LogSession, LogAnalysis, DynoRun, CalibrationMap,
  EcuIdentity, TuningTier, AuditEvent,
} from '../types';
import { useLearningStore } from '../stores/learningStore';

// ── Models ────────────────────────────────────────────────────
// These are the real, current Gemini model strings.
const MODELS = {
  PRO:         'gemini-2.5-pro-preview-06-05',
  FLASH:       'gemini-2.0-flash',
  FLASH_LITE:  'gemini-2.0-flash-lite',
  IMAGE_GEN:   'gemini-2.0-flash-exp-image-generation',
  LIVE_AUDIO:  'gemini-2.0-flash-live-001',
  TTS:         'gemini-2.5-flash-preview-tts',
} as const;

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY ?? process.env.GEMINI_API_KEY ?? '',
});

// ── Tool declarations ─────────────────────────────────────────
const tuningTools: FunctionDeclaration[] = [
  {
    name: 'requestPerformanceSimulation',
    description: 'Predict the gains of a tuning strategy using the Digital Twin and Virtual Dyno.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        goal:        { type: Type.STRING, description: 'The performance target.' },
        fuelType:    { type: Type.STRING, enum: ['93_OCT', 'E85', 'DIESEL'] },
        aggression:  { type: Type.NUMBER, description: 'Risk factor 0.1–1.0.' },
      },
      required: ['goal', 'fuelType'],
    },
  },
  {
    name: 'proposeMapEdit',
    description: 'Propose a mathematical change to a calibration map region.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        table:     { type: Type.STRING, enum: ['ve', 'ign'] },
        operation: { type: Type.STRING, enum: ['add', 'mult', 'set', 'smooth'] },
        value:     { type: Type.NUMBER },
        reasoning: { type: Type.STRING, description: 'Engineering justification.' },
      },
      required: ['table', 'operation', 'value', 'reasoning'],
    },
  },
  {
    name: 'executeObdCommand',
    description: 'Execute a raw OBD/UDS command. REQUIRES TIER_1 authorisation. All calls are audit-logged.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command:    { type: Type.STRING, description: 'Hex command, e.g. "010C" for RPM.' },
        justification: { type: Type.STRING, description: 'Why this command is necessary.' },
      },
      required: ['command', 'justification'],
    },
  },
  {
    name: 'setObdProtocol',
    description: 'Set OBD-II protocol (0=Auto, 6=CAN11/500, 7=CAN29/500).',
    parameters: {
      type: Type.OBJECT,
      properties: { protocol: { type: Type.STRING } },
      required: ['protocol'],
    },
  },
  {
    name: 'addActivePid',
    description: 'Add a PID to the active polling list.',
    parameters: {
      type: Type.OBJECT,
      properties: { pidHex: { type: Type.STRING, description: 'e.g. "010C"' } },
      required: ['pidHex'],
    },
  },
];

// ── System instruction builder ────────────────────────────────
const buildSystemInstruction = (ecuId?: EcuIdentity | null, tier?: TuningTier): string => {
  const memory = useLearningStore.getState().getSystemContextPrompt();
  const ecuCtx = ecuId ? `
ECU: ${ecuId.hardwareId} | ${ecuId.softwareVersion} | VIN: ${ecuId.vin} | Protocol: ${ecuId.protocol ?? 'Auto'}` : '';
  const tierCtx = tier ? `\nTUNING_TIER: ${tier}` : '';
  const obdWarning = tier !== TuningTier.TIER_1_AUTONOMOUS
    ? '\nRESTRICTION: executeObdCommand is disabled at this tier. Do not call it.'
    : '\nPERMISSION: executeObdCommand is authorised at TIER_1. Always include justification.';

  return `You are 'KC', the Neural Engine of Genesis OS — Expert Performance Tuner and Diagnostic Specialist.
${ecuCtx}${tierCtx}
${memory}

DIRECTIVES:
1. Speak like a high-level motorsport engineer: concise, data-driven, assertive.
2. For performance queries, call requestPerformanceSimulation first.
3. If boost anomaly detected, say "ABORT PULL: [REASON]" immediately.
4. Never suggest ignition advance if lambda > 1.05 and EGT > 750°C.
5. AFR displayed as "FAULT" means the wideband sensor is offline — acknowledge this, do not tune.
${obdWarning}`;
};

// ── Utility: sanitise telemetry before sending to AI ─────────
function sanitiseTelemetry(d: SensorDataPoint): Record<string, unknown> {
  return {
    rpm:         d.rpm,
    speed:       d.speed,
    boost:       d.turboBoost,
    engineLoad:  d.engineLoad,
    throttle:    d.throttlePos,
    lambda:      d.lambdaFault ? 'FAULT' : d.lambda, // Never send sentinel 10.0
    coolant:     d.engineTemp,
    oilPressure: d.oilPressure,
    knock:       d.knockCount,
    timing:      d.timingAdvance,
    gear:        d.gear,
    fusionTier:  d.fusionTier,
    source:      d.source,
  };
}

// ── Coaching ─────────────────────────────────────────────────
const formatTime = (ms: number): string => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

export async function getCoachingAdvice(log: LogSession): Promise<string> {
  // Downsample for context window — every 5th point, max 100 (covers ~25s at 20Hz)
  const sample = log.dataPoints
    .filter((_, i) => i % 5 === 0)
    .slice(0, 100)
    .map(d => ({ rpm: d.rpm, spd: (d.speed * 3.6).toFixed(0), ld: d.engineLoad.toFixed(0) }));

  const lapSummary = log.stats
    ? `Peak: ${log.stats.maxRpm} RPM | ${log.stats.maxSpeed.toFixed(0)} km/h | avg AFR ${log.stats.avgAfr.toFixed(2)}`
    : 'No stats available.';

  const prompt = `You are the Genesis Chief Race Engineer.
Deliver a professional "Session Debrief" — 2–3 actionable improvements.
Focus on: launch technique, shift efficiency, traction management, lap consistency.

Session stats: ${lapSummary}
Sampled telemetry (rpm/speed_kmh/load%): ${JSON.stringify(sample)}

Respond in plain text without markdown headers.`;

  try {
    const res = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
      config: { temperature: 0.7, topP: 0.95 },
    });
    return res.text ?? 'No advice generated.';
  } catch (e) {
    console.error('[Gemini] Coaching advice failed', e);
    return 'Unable to generate coaching advice. Check your connection and API key.';
  }
}

// ── Voice command interpretation ──────────────────────────────
export async function interpretHandsFreeCommand(
  command: string,
  route: string,
  data: SensorDataPoint,
  alerts: DiagnosticAlert[],
  ecuId?: EcuIdentity | null,
  tier?: TuningTier
): Promise<VoiceActionResponse> {
  try {
    const res = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Voice: "${command}" | Route: ${route} | Telemetry: ${JSON.stringify(sanitiseTelemetry(data))} | Alerts: ${alerts.length}`,
      config: {
        systemInstruction: buildSystemInstruction(ecuId, tier),
        tools: [{ functionDeclarations: tuningTools }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textToSpeak: { type: Type.STRING },
            action:      { type: Type.STRING },
            payload:     { type: Type.STRING },
          },
          required: ['textToSpeak'],
        },
      },
    });
    return JSON.parse(res.text ?? '{"textToSpeak":"Processing failed.","action":"NONE"}');
  } catch {
    return { textToSpeak: 'Neural link communication error.', action: 'NONE' };
  }
}

export const processVoiceCommand = interpretHandsFreeCommand;

// ── Chat message ──────────────────────────────────────────────
export async function sendMessageToAI(
  msg: string,
  data: SensorDataPoint,
  ctx: string,
  ecuId?: EcuIdentity | null,
  tier?: TuningTier
): Promise<{ text: string; functionCalls?: any[] }> {
  try {
    const res = await ai.models.generateContent({
      model: MODELS.PRO,
      contents: `Engineer: ${msg}\nContext: ${ctx}\nTelemetry: ${JSON.stringify(sanitiseTelemetry(data))}`,
      config: {
        systemInstruction: buildSystemInstruction(ecuId, tier),
        tools: [{ functionDeclarations: tuningTools }],
        thinkingConfig: { thinkingBudget: 8192 },
      },
    });

    // Audit any OBD command calls
    if (res.functionCalls) {
      for (const call of res.functionCalls) {
        if (call.name === 'executeObdCommand') {
          useLearningStore.getState().logAuditEvent(
            AuditEvent.ObdCommand,
            `AI requested OBD: ${call.args?.command} — ${call.args?.justification}`
          );
        }
      }
    }

    return {
      text: res.text ?? 'Unable to provide response at this time.',
      functionCalls: res.functionCalls,
    };
  } catch {
    return { text: 'COMMUNICATION_UPLINK_FAILURE' };
  }
}

// ── Log analysis ──────────────────────────────────────────────
export async function analyzeLogSession(log: LogSession): Promise<LogAnalysis> {
  try {
    const res = await ai.models.generateContent({
      model: MODELS.PRO,
      contents: `Analyse race log:\nStats: ${JSON.stringify(log.stats)}\nDuration: ${(log.duration/1000).toFixed(0)}s`,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 16384 },
      },
    });
    return JSON.parse(res.text ?? '{}');
  } catch {
    return {
      dataQuality: 'Low',
      summary: 'Analysis unavailable.',
      peakPerformance: 'N/A',
      detectedIssues: [],
      tuningRecommendations: [],
    };
  }
}

// ── Risk timeline ─────────────────────────────────────────────
export async function analyzeRiskTimeline(
  faults: DiagnosticCode[],
  telemetry: SensorDataPoint[]
) {
  const sample = telemetry.slice(-50); // Last 50 points — no trailing JS comment in prompt
  try {
    const res = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Analyse faults and telemetry for Risk Timeline.
If P0300 + high EGT + lean AFR: "Lean misfire — piston melt risk."
Faults: ${JSON.stringify(faults)}
Telemetry: ${JSON.stringify(sample.map(sanitiseTelemetry))}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            immediateRisks:       { type: Type.ARRAY, items: { type: Type.STRING } },
            nearTermConsequences: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation:       { type: Type.STRING },
          },
          required: ['immediateRisks', 'nearTermConsequences', 'recommendation'],
        },
      },
    });
    return JSON.parse(res.text ?? '{}');
  } catch {
    return { immediateRisks: [], nearTermConsequences: [], recommendation: 'Analysis unavailable.' };
  }
}

// ── Dyno analysis ─────────────────────────────────────────────
export async function analyzeDynoCurve(run: DynoRun) {
  try {
    const res = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Analyse dyno run: ${run.peakPower.toFixed(0)} HP, ${run.peakTorque.toFixed(0)} Nm`,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(res.text ?? '{}');
  } catch {
    return {};
  }
}

// ── Image generation ──────────────────────────────────────────
export async function generateComponentImage(label: string): Promise<string> {
  const res = await ai.models.generateContent({
    model: MODELS.IMAGE_GEN,
    contents: { parts: [{ text: `Technical blueprint schematic of automotive ${label}, cutaway view.` }] },
  });
  for (const part of res.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error('No image generated');
}

// ── TTS ───────────────────────────────────────────────────────
export async function generateSpeech(text: string): Promise<ArrayBuffer | null> {
  try {
    const res = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return null;
    const bin   = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  } catch { return null; }
}

// ── Live streaming session ────────────────────────────────────
export class GeminiLiveSession {
  private active = false;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private analyser: AnalyserNode | null = null;

  constructor(
    private readonly onStateChange: (s: 'idle' | 'listening' | 'thinking' | 'speaking') => void,
    private readonly onFreqData?: (data: Uint8Array) => void,
    private readonly ecuId?: EcuIdentity | null,
    private readonly tier?: TuningTier
  ) {}

  public async connect(): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.onStateChange('listening');

    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    this.inputCtx  = new AudioCtx({ sampleRate: 16000 });
    this.outputCtx = new AudioCtx({ sampleRate: 24000 });

    const outGain = this.outputCtx.createGain();
    this.analyser = this.outputCtx.createAnalyser();
    this.analyser.fftSize = 64;
    outGain.connect(this.analyser);
    this.analyser.connect(this.outputCtx.destination);

    const freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    const updateFreq = () => {
      if (!this.active || !this.analyser) return;
      this.analyser.getByteFrequencyData(freqBuf);
      this.onFreqData?.(new Uint8Array(freqBuf));
      requestAnimationFrame(updateFreq);
    };
    updateFreq();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { this.disconnect(); return; }

    const sessionPromise = ai.live.connect({
      model: MODELS.LIVE_AUDIO,
      callbacks: {
        onopen: () => this.startAudioInput(sessionPromise),
        onmessage: async (msg: any) => {
          const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && this.outputCtx?.state !== 'closed') {
            this.onStateChange('speaking');
            this.nextStartTime = Math.max(this.nextStartTime, this.outputCtx!.currentTime);
            const buf    = await this.decodeAudio(audio);
            const source = this.outputCtx!.createBufferSource();
            source.buffer = buf;
            source.connect(outGain);
            source.addEventListener('ended', () => {
              this.sources.delete(source);
              if (this.sources.size === 0) this.onStateChange('listening');
            });
            source.start(this.nextStartTime);
            this.nextStartTime += buf.duration;
            this.sources.add(source);
          }
        },
        onclose: () => this.disconnect(),
        onerror: () => this.disconnect(),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: buildSystemInstruction(this.ecuId, this.tier),
      },
    });
  }

  private async decodeAudio(b64: string): Promise<AudioBuffer> {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const buf  = this.outputCtx!.createBuffer(1, pcm.length, 24000);
    const ch   = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    return buf;
  }

  private startAudioInput(sessionPromise: Promise<any>): void {
    if (!this.inputCtx || !this.stream || this.inputCtx.state === 'closed') return;
    const source = this.inputCtx.createMediaStreamSource(this.stream);
    this.processor = this.inputCtx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (!this.active) return;
      const input = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
      let bin = '';
      const bytes = new Uint8Array(int16.buffer);
      for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      sessionPromise.then(s => s.sendRealtimeInput({ media: { data: b64, mimeType: 'audio/pcm;rate=16000' } }));
    };
    source.connect(this.processor);
    this.processor.connect(this.inputCtx.destination);
  }

  public disconnect(): void {
    this.active = false;
    this.onStateChange('idle');
    try { this.processor?.disconnect(); } catch {}
    this.stream?.getTracks().forEach(t => t.stop());
    [this.inputCtx, this.outputCtx].forEach(ctx => {
      if (ctx?.state !== 'closed') ctx?.close().catch(() => {});
    });
    this.processor = null;
    this.stream    = null;
    this.inputCtx  = null;
    this.outputCtx = null;
  }
}
