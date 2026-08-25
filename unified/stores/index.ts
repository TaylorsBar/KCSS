// ============================================================
// Genesis OS — Domain Store Architecture v2.0
// Karapiro Cartel Speed Shop
//
// Replaces the monolithic vehicleStore God Object with
// focused domain stores. Each store re-renders only its
// own subscribers — dashboard doesn't rerender on every
// OBD byte; tuning page doesn't rerender on media updates.
//
// Exports:
//   useTelemetryStore  — live sensor data, EKF state, logging
//   useTuningStore     — map tables, history, RL, MPC, flash
//   useConnectionStore — OBD/CAN state, ECU identity, profiles
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  SensorDataPoint, ObdConnectionState, TuningTier,
  ECUProfile, EcuIdentity, DiagnosticCode, EngineHealthIndex,
  SensorHealth, RLTrainingState, LogSession, MPCState,
  TracePoint, FusionTier, SystemStatus, DiagnosticAlert,
  TuningState, RaceSession, LaunchState, PrivacySettings,
  MediaContext, MediaSource, MediaPlaybackState, MediaConnectionType,
} from '../types';

// ── Initial states ────────────────────────────────────────────
const G = 9.80665;

export const INITIAL_SENSOR_DATA: SensorDataPoint = {
  time: Date.now(), rpm: 0, speed: 0, gear: 0, fuelUsed: 0,
  inletAirTemp: 25, batteryVoltage: 12.6, engineTemp: 85, fuelTemp: 25,
  oilTemp: 90, turboBoost: -0.7, map: 30, fuelPressure: 3.8, oilPressure: 2.0,
  shortTermFuelTrim: 0, longTermFuelTrim: 0, o2SensorVoltage: 0.5,
  engineLoad: 0, distance: 0, gForceX: 0, gForceY: 0,
  latitude: -37.7603, longitude: 175.4137, // Karapiro default
  source: 'sim', reliability: 1.0, maf: 12, timingAdvance: 15,
  throttlePos: 0, fuelLevel: 50, barometricPressure: 101, ambientTemp: 20,
  fuelRailPressure: 300, lambda: 1.0, lambdaFault: false,
  wheelSpeedFL: 0, wheelSpeedFR: 0, wheelSpeedRL: 0, wheelSpeedRR: 0,
  knockSignal: 0.1, knockThreshold: 0.5, knockCount: 0, knockRetard: 0,
  cylinderIgnitionCorrections: [0, 0, 0, 0], crankAngle: 0,
  fusionTier: FusionTier.TIER_4_INITIALIZING,
};

const generateMap = (v: number, size = 16) =>
  Array(size).fill(null).map(() => Array(size).fill(v));

// ── TELEMETRY STORE ───────────────────────────────────────────
interface TelemetryStore {
  // Live state
  latestData: SensorDataPoint;
  data: SensorDataPoint[];
  fusionTier: FusionTier;
  systemStatus: SystemStatus;
  ekfStats: { uncertainty_m: number; gpsActive: boolean };

  // Logging
  isLogging: boolean;
  currentLog: SensorDataPoint[];
  savedLogs: LogSession[];
  isAnalyzingLog: boolean;

  // Playback
  reviewMode: boolean;
  playback: { active: boolean; playing: boolean; progress: number; currentTime: number };

  // Race session
  raceSession: RaceSession;

  // Health
  sensorHealth: SensorHealth[];
  engineHealth: EngineHealthIndex | null;
  healthPrediction: { daysRemaining: number; degrading: boolean; trendSlope: number } | null;
  isAnalyzingHealth: boolean;
  predictiveEvents: any[];

  // Privacy
  privacySettings: PrivacySettings;

  // Actions
  ingestDataPoint: (d: SensorDataPoint) => void;
  startLogging: () => void;
  stopLogging: () => void;
  deleteLog: (id: string) => void;
  analyzeLog: (id: string) => Promise<void>;
  setSensorHealth: (h: SensorHealth[]) => void;
  setEngineHealth: (h: EngineHealthIndex) => void;
  setPrivacySettings: (s: Partial<PrivacySettings>) => void;

  // Race
  setRaceMode: (mode: 'CIRCUIT' | 'DRAG') => void;
  startCircuitSession: () => void;
  stopRaceSession: () => void;
  addAiInsight: (insight: string) => void;
}

export const useTelemetryStore = create<TelemetryStore>()(
  subscribeWithSelector((set, get) => ({
    latestData: INITIAL_SENSOR_DATA,
    data: [],
    fusionTier: FusionTier.TIER_4_INITIALIZING,
    systemStatus: SystemStatus.INIT,
    ekfStats: { uncertainty_m: 100, gpsActive: false },

    isLogging: false,
    currentLog: [],
    savedLogs: [],
    isAnalyzingLog: false,

    reviewMode: false,
    playback: { active: false, playing: false, progress: 0, currentTime: 0 },

    raceSession: {
      mode: 'CIRCUIT', isActive: false, launchState: LaunchState.Idle,
      startTime: null, elapsedTime: 0, data: [], lapTimes: [], dragStats: {
        reactionTime: null, sixtyFootTime: null, zeroToSixtyTime: null,
        zeroToHundredTime: null, eighthMileTime: null, eighthMileSpeed: null,
        quarterMileTime: null, quarterMileSpeed: null,
      },
      aiInsights: [], startLineCoords: null, currentLapNumber: 0,
      currentLapDelta: 0, bestLap: null,
    },

    sensorHealth: [],
    engineHealth: null,
    healthPrediction: null,
    isAnalyzingHealth: false,
    predictiveEvents: [],

    privacySettings: { optInTelemetry: false, anonymizeData: true },

    ingestDataPoint: (d) => set((s) => ({
      latestData: d,
      data: s.data.length > 5000 ? [...s.data.slice(-4999), d] : [...s.data, d],
      currentLog: s.isLogging ? [...s.currentLog, d] : s.currentLog,
      fusionTier: d.fusionTier ?? s.fusionTier,
      ekfStats: {
        uncertainty_m: d.ekf_uncertainty_m ?? s.ekfStats.uncertainty_m,
        gpsActive: d.latitude !== 0 && d.source !== 'sim',
      },
    })),

    startLogging: () => set({ isLogging: true, currentLog: [] }),

    stopLogging: () => {
      const { currentLog, savedLogs } = get();
      if (currentLog.length < 10) { set({ isLogging: false }); return; }
      const session: LogSession = {
        id: Date.now().toString(),
        name: new Date().toLocaleString(),
        startTime: currentLog[0].time,
        duration: currentLog[currentLog.length - 1].time - currentLog[0].time,
        dataPoints: currentLog,
        stats: {
          maxRpm:   Math.max(...currentLog.map(d => d.rpm)),
          maxBoost: Math.max(...currentLog.map(d => d.turboBoost)),
          maxSpeed: Math.max(...currentLog.map(d => d.speed)),
          avgAfr:   currentLog.reduce((sum, d) => sum + (d.lambdaFault ? 0 : d.lambda * 14.7), 0)
                    / currentLog.filter(d => !d.lambdaFault).length,
        },
      };
      set({ isLogging: false, currentLog: [], savedLogs: [...savedLogs, session] });
    },

    deleteLog: (id) => set(s => ({ savedLogs: s.savedLogs.filter(l => l.id !== id) })),

    analyzeLog: async (id) => {
      set({ isAnalyzingLog: true });
      // Calls geminiService.analyzeLogSession — imported by consumer
      set({ isAnalyzingLog: false });
    },

    setSensorHealth: (h) => set({ sensorHealth: h }),
    setEngineHealth: (h) => set({ engineHealth: h }),
    setPrivacySettings: (s) => set(prev => ({ privacySettings: { ...prev.privacySettings, ...s } })),

    setRaceMode: (mode) => set(s => ({ raceSession: { ...s.raceSession, mode } })),
    startCircuitSession: () => set(s => ({
      raceSession: { ...s.raceSession, isActive: true, startTime: Date.now(), data: [], lapTimes: [] },
    })),
    stopRaceSession: () => set(s => ({
      raceSession: { ...s.raceSession, isActive: false },
    })),
    addAiInsight: (insight) => set(s => ({
      raceSession: {
        ...s.raceSession,
        aiInsights: [insight, ...s.raceSession.aiInsights].slice(0, 10),
      },
    })),
  }))
);

// ── TUNING STORE ──────────────────────────────────────────────
const MAP_SIZE = 16;

interface TuningStore {
  veTable:  number[][];
  ignTable: number[][];
  vvtTable: number[][];

  mapHistory: {
    ve: number[][][]; ign: number[][][]; vvt: number[][][];
    vePtr: number; ignPtr: number; vvtPtr: number;
  };
  comparisonTable: number[][] | null;

  activeTier: TuningTier;
  tuning: TuningState;
  boostDuty: number;
  mpcState: MPCState;
  rlTraining: RLTrainingState | null;
  traceHistory: TracePoint[];
  isPriming: boolean;
  primeProgress: number;
  isPrimingSuccess: boolean;

  // Actions
  updateMapCell: (table: 've' | 'ign' | 'vvt', r: number, c: number, v: number) => void;
  updateMapCells: (table: 've' | 'ign' | 'vvt', cells: { r: number; c: number; v: number }[]) => void;
  applyLtklRetard: (rpmBin: number, loadBin: number, adjustment: number) => void;
  undoMapEdit: (table?: string) => void;
  redoMapEdit: (table?: string) => void;
  setComparisonTable: (t: number[][] | null) => void;
  setTuningTier: (t: TuningTier) => void;
  setBoostTarget: (v: number) => void;
  setRevLimit: (v: number) => void;
  setValetMode: (enabled: boolean, maxRpm: number, maxSpeed: number) => void;
  setMpcState: (s: MPCState) => void;
  setRlTraining: (s: RLTrainingState) => void;
  primeFuelSystem: () => void;
}

export const useTuningStore = create<TuningStore>()(
  subscribeWithSelector((set, get) => ({
    veTable:  generateMap(65),
    ignTable: generateMap(14),
    vvtTable: generateMap(0),

    mapHistory: {
      ve: [], ign: [], vvt: [],
      vePtr: -1, ignPtr: -1, vvtPtr: -1,
    },
    comparisonTable: null,
    activeTier: TuningTier.TIER_3_PASSIVE,
    tuning: {
      boostTarget: 1.4, boostWarning: 1.8,
      pidGains: { kp: 0.5, ki: 0.01, kd: 0.0 },
      twoStep: { enabled: false, limitRpm: 3500, activationThreshold: 90 },
      hardCut: { enabled: false, rpm: 7000, type: 'hard' },
      revLimit: 7200, speedLimit: 250,
      valetMode: { enabled: false, maxRpm: 3000, maxSpeed: 50 },
    },
    boostDuty: 0,
    mpcState: { optimalDuty: 0, isLearning: false, learnedParams: { a: 0.9, b: 0.05, c: 0 }, cost: 0, prediction: [], anomalyDetected: false },
    rlTraining: null,
    traceHistory: [],
    isPriming: false,
    primeProgress: 0,
    isPrimingSuccess: false,

    updateMapCell: (table, r, c, v) => set(s => {
      const tableKey = `${table}Table` as 'veTable' | 'ignTable' | 'vvtTable';
      const current = s[tableKey];
      const next = current.map((row, ri) => ri === r ? row.map((val, ci) => ci === c ? v : val) : row);
      return { [tableKey]: next };
    }),

    updateMapCells: (table, cells) => set(s => {
      const tableKey = `${table}Table` as 'veTable' | 'ignTable' | 'vvtTable';
      const next = s[tableKey].map(row => [...row]);
      for (const { r, c, v } of cells) next[r][c] = v;
      return { [tableKey]: next };
    }),

    applyLtklRetard: (rpmBin, loadBin, adjustment) => {
      const colIdx = Math.min(MAP_SIZE - 1, Math.floor(rpmBin / 500));
      const rowIdx = Math.min(MAP_SIZE - 1, Math.floor(loadBin / 6.25));
      const { ignTable } = get();
      const current = ignTable[rowIdx]?.[colIdx] ?? 15;
      get().updateMapCell('ign', rowIdx, colIdx, current + adjustment);
    },

    undoMapEdit: () => { /* TODO: implement pointer-based undo */ },
    redoMapEdit: () => { /* TODO: implement pointer-based redo */ },
    setComparisonTable: (t) => set({ comparisonTable: t }),
    setTuningTier: (t) => set({ activeTier: t }),
    setBoostTarget: (v) => set(s => ({ tuning: { ...s.tuning, boostTarget: v } })),
    setRevLimit: (v) => set(s => ({ tuning: { ...s.tuning, revLimit: v } })),
    setValetMode: (enabled, maxRpm, maxSpeed) =>
      set(s => ({ tuning: { ...s.tuning, valetMode: { enabled, maxRpm, maxSpeed } } })),
    setMpcState: (s) => set({ mpcState: s }),
    setRlTraining: (s) => set({ rlTraining: s }),
    primeFuelSystem: () => {
      set({ isPriming: true, primeProgress: 0 });
      const interval = setInterval(() => {
        const { primeProgress } = get();
        if (primeProgress >= 100) {
          clearInterval(interval);
          set({ isPriming: false, isPrimingSuccess: true });
          setTimeout(() => set({ isPrimingSuccess: false }), 3000);
        } else {
          set({ primeProgress: primeProgress + 2 });
        }
      }, 60);
    },
  }))
);

// ── CONNECTION STORE ──────────────────────────────────────────
interface ConnectionStore {
  obdState: ObdConnectionState;
  isOBDConnected: boolean;
  activeProfile: ECUProfile | null;
  ecuIdentity: EcuIdentity | null;
  dtcs: DiagnosticCode[];
  isScanning: boolean;
  diagnosticAlerts: DiagnosticAlert[];
  hasActiveFault: boolean;
  gpsAccuracy: number;
  shiftLightRpm: number;
  config: { maxRpm: number };

  // Media
  media: MediaContext;

  setObdState: (s: ObdConnectionState) => void;
  setOBDConnected: (v: boolean) => void;
  setActiveProfile: (p: ECUProfile | null) => void;
  setEcuIdentity: (id: Partial<EcuIdentity>) => void;
  setDtcs: (d: DiagnosticCode[]) => void;
  clearFaults: () => void;
  addAlert: (a: DiagnosticAlert) => void;
  setGpsAccuracy: (v: number) => void;
  setShiftLightRpm: (v: number) => void;
  mediaControl: (action: string, payload?: number | string) => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  subscribeWithSelector((set, get) => ({
    obdState: ObdConnectionState.Disconnected,
    isOBDConnected: false,
    activeProfile: null,
    ecuIdentity: {
      vin: 'GENESIS-DEFAULT',
      hardwareId: 'UNKNOWN',
      softwareVersion: 'v0.0.0',
      protocolType: 'AUTO',
      ecuFingerprint: 0,
      supportedTiers: [TuningTier.TIER_3_PASSIVE],
    },
    dtcs: [],
    isScanning: false,
    diagnosticAlerts: [],
    hasActiveFault: false,
    gpsAccuracy: 10.0,
    shiftLightRpm: 7200,
    config: { maxRpm: 9000 },
    media: {
      source: MediaSource.RADIO,
      playbackState: MediaPlaybackState.PLAYING,
      connectionType: MediaConnectionType.USB,
      track: { title: 'Genesis Broadcast', artist: 'System Default' },
      volume: 0.6,
    },

    setObdState: (s) => set({ obdState: s }),
    setOBDConnected: (v) => set({ isOBDConnected: v }),
    setActiveProfile: (p) => set({ activeProfile: p }),
    setEcuIdentity: (id) => set(s => ({ ecuIdentity: { ...s.ecuIdentity!, ...id } })),
    setDtcs: (d) => set({ dtcs: d, hasActiveFault: d.some(c => c.status === 'active') }),
    clearFaults: () => set({ dtcs: [], hasActiveFault: false }),
    addAlert: (a) => set(s => ({
      diagnosticAlerts: [a, ...s.diagnosticAlerts].slice(0, 50),
    })),
    setGpsAccuracy: (v) => set({ gpsAccuracy: v }),
    setShiftLightRpm: (v) => set({ shiftLightRpm: v }),
    mediaControl: (action) => {
      const { media } = get();
      if (action === 'PLAY')  set({ media: { ...media, playbackState: MediaPlaybackState.PLAYING } });
      if (action === 'PAUSE') set({ media: { ...media, playbackState: MediaPlaybackState.PAUSED } });
      if (action === 'STOP')  set({ media: { ...media, playbackState: MediaPlaybackState.STOPPED } });
    },
  }))
);
