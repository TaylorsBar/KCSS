// ============================================================
// Genesis OS — Unified Type System v1.0
// Karapiro Cartel Speed Shop
// Fixes: Unicode typo in FusionTier, Lambda fault state,
//        expanded sensor health, unified across all packages.
// ============================================================

// ── SENSOR FUSION ────────────────────────────────────────────
export enum FusionTier {
  TIER_1_FULL_FIDELITY   = 'TIER_1_FULL_FIDELITY',  // GPS + IMU + Vision + OBD
  TIER_2_VISION_DEGRADED = 'TIER_2_VISION_DEGRADED', // GPS + IMU
  TIER_3_DEAD_RECKONING  = 'TIER_3_DEAD_RECKONING',  // IMU + OBD only
  TIER_4_INITIALIZING    = 'TIER_4_INITIALIZING',    // Cold start / sensors unavailable
}

export enum SystemStatus {
  INIT       = 'INIT',
  NOMINAL    = 'NOMINAL',
  DEGRADED   = 'DEGRADED',
  UNRELIABLE = 'UNRELIABLE',
  FAULT      = 'FAULT',
}

// ── TUNING TIER ──────────────────────────────────────────────
export enum TuningTier {
  TIER_1_AUTONOMOUS = 'TIER_1', // Full AI control (write + flash)
  TIER_2_GUIDED     = 'TIER_2', // Propose + human confirm
  TIER_3_PASSIVE    = 'TIER_3', // Read-only monitoring
}

// ── OBD / CONNECTION ─────────────────────────────────────────
export enum ObdConnectionState {
  Disconnected = 'Disconnected',
  Connecting   = 'Connecting',
  Initializing = 'Initializing',
  Discovering  = 'Discovering',
  Connected    = 'Connected',
  Error        = 'Error',
}

// ── SENSOR DATA ──────────────────────────────────────────────
/** Plausibility rules applied in DataIngestionPipeline */
export const SENSOR_PLAUSIBILITY = {
  lambda: { min: 0.60, max: 1.80, faultSentinel: 10.0 }, // >1.8 → display FAULT
  rpm:    { min: 0,    max: 15000 },
  speed:  { min: 0,    max: 450 },
} as const;

export interface SensorDataPoint {
  time: number;
  rpm: number;
  speed: number;
  gear: number;
  fuelUsed: number;
  inletAirTemp: number;
  batteryVoltage: number;
  engineTemp: number;
  fuelTemp: number;
  oilTemp: number;
  transmissionTemp?: number;
  cylinderHeadTemp?: number;
  turboBoost: number;
  map: number;
  fuelPressure: number;
  oilPressure: number;
  shortTermFuelTrim: number;
  longTermFuelTrim: number;
  o2SensorVoltage: number;
  engineLoad: number;
  distance: number;
  gForceX: number;
  gForceY: number;
  gForceZ?: number;
  rawAccelX?: number;
  rawAccelY?: number;
  rawAccelZ?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  slope?: number;
  source: 'sim' | 'live_obd' | 'gps_fallback' | 'fused_ekf';
  reliability: number;
  maf: number;
  timingAdvance: number;
  vvtAngle?: number;
  throttlePos: number;
  fuelLevel: number;
  barometricPressure: number;
  ambientTemp: number;
  fuelRailPressure: number;
  fuelRate?: number;
  /** Wideband lambda. Use this — NOT o2SensorVoltage — for AFR calculations.
   *  Plausibility: values > 1.8 should be displayed as FAULT, not numeric. */
  lambda: number;
  lambdaFault?: boolean; // set true by DataIngestionPipeline when lambda > SENSOR_PLAUSIBILITY.lambda.max
  wheelSpeedFL: number;
  wheelSpeedFR: number;
  wheelSpeedRL: number;
  wheelSpeedRR: number;
  knockSignal: number;
  knockThreshold: number;
  knockCount: number;
  knockRetard: number;
  cylinderIgnitionCorrections: [number, number, number, number];
  crankAngle: number;
  turboVgtDuty?: number;
  torqueActual?: number;
  torqueDemand?: number;
  dpfLoad?: number;
  egrDuty?: number;
  launchReady?: boolean;
  overrunActive?: boolean;
  boostKpa?: number;
  kinematicRpm?: number;
  media?: MediaContext;
  status?: Record<string, 'valid' | 'invalid' | 'stale'>;
  customPids?: Record<string, number>;
  // EKF-derived fields (populated by SensorFusion service)
  ekf_uncertainty_m?: number;
  ekf_biases?: { x: number; y: number; z: number };
  ekf_gyro_biases?: { x: number; y: number; z: number };
  fusionTier?: FusionTier;
}

// ── CALIBRATION MAPS ─────────────────────────────────────────
export interface CalibrationMap {
  name: string;
  mapName?: string;
  mapDescription?: string;
  address: number;
  rows: number;
  cols: number;
  values: number[];
  xAxis: number[];
  yAxis: number[];
  activeCell?: { r: number; c: number };
  tier1Control?: boolean;
}

// ── ECU IDENTITY & PROFILES ──────────────────────────────────
export interface EcuIdentity {
  vin: string;
  hardwareId: string;
  softwareVersion: string;
  protocolType: string;
  protocol?: string;
  ecuFingerprint: number;
  supportedTiers: TuningTier[];
}

export type VehicleIdentity = EcuIdentity;

export interface TransmissionProfile {
  type: 'manual' | 'automatic' | 'dct' | 'cvt';
  gears: number[];
  finalDrive: number;
  tireDiameterMm: number;
}

export interface PIDDefinition {
  id: string;
  mode: string;
  pid: string;
  description: string;
  formula: string;
  units: string;
  min: number;
  max: number;
  priority: 'fast' | 'medium' | 'slow';
  targetField?: keyof SensorDataPoint;
  offset?: number;
}

export interface ECUProfile {
  name: string;
  ecu_family: string;
  protocol: string;
  pids: PIDDefinition[];
  isDynamic?: boolean;
  maxTier: TuningTier;
  transmission?: TransmissionProfile;
}

// ── ALERTS & DIAGNOSTICS ─────────────────────────────────────
export enum AlertLevel {
  Info     = 'Info',
  Warning  = 'Warning',
  Critical = 'Critical',
}

export interface DiagnosticAlert {
  id: string;
  level: AlertLevel;
  component: string;
  message: string;
  timestamp: string;
  isFaultRelated?: boolean;
}

export interface DiagnosticCode {
  code: string;
  description: string;
  status: string;
  timestamp: string;
}

export interface Mode06Result {
  mid: string;
  tid: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  status: 'PASS' | 'FAIL';
}

export interface FreezeFramePoint {
  pid: string;
  label: string;
  value: string;
  unit: string;
}

// ── TUNING STATE ─────────────────────────────────────────────
export interface TuningState {
  boostTarget: number;
  boostWarning: number;
  pidGains: { kp: number; ki: number; kd: number };
  twoStep: { enabled: boolean; limitRpm: number; activationThreshold: number };
  hardCut: { enabled: boolean; rpm: number; type: 'soft' | 'hard' | 'popcorn' };
  revLimit: number;
  speedLimit: number;
  valetMode: { enabled: boolean; maxRpm: number; maxSpeed: number };
}

export interface TuneRequest {
  prompt: string;
  stockMaps: CalibrationMap[];
}

export interface TuneResponse {
  success: boolean;
  aiConfidence: number;
  explanation: string;
  modifiedMaps: CalibrationMap[];
  warnings: { severity: string; message: string; affectedMap: string }[];
}

export type FlashStep = 'IDLE' | 'PRECHECK' | 'IDENTIFY' | 'READ' | 'EDIT' | 'WRITE' | 'FINISH';

export interface FlashJob {
  step: FlashStep;
  progress: number;
  logs: string[];
  batteryVoltage: number;
  ecuId?: EcuIdentity;
}

// ── REINFORCEMENT LEARNING ────────────────────────────────────
export interface RLTrainingState {
  episode: number;
  epsilon: number;
  currentReward: number;
  cumulativeReward: number;
  bestReward: number;
  lastAction: string;
  qTableSize: number;
  ltklEntries: number; // Number of states with permanent retard applied
}

// ── MPC ──────────────────────────────────────────────────────
export interface MPCState {
  optimalDuty: number;
  isLearning: boolean;
  learnedParams: { a: number; b: number; c: number };
  cost: number;
  prediction: number[];
  anomalyDetected: boolean;
}

// ── HEALTH & PREDICTION ───────────────────────────────────────
export type SensorName = 'MAF' | 'MAP' | 'O2' | 'RPM' | 'TPS' | 'IAT' | 'LAMBDA' | 'KNOCK';

export interface FaultProbabilities {
  normal: number;
  spike: number;
  noise: number;
  drift: number;
  bias: number;
  stuck: number;
}

export interface SensorHealth {
  sensor: SensorName;
  probabilities?: FaultProbabilities;
  status: 'OK' | 'CHECK' | 'FAULT' | 'STALE';
}

export interface EngineHealthIndex {
  overallScore: number;
  combustionScore: number;
  thermalScore: number;
  efficiencyScore: number;
  sensorIntegrityScore: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  timeframe: string;
  level: AlertLevel;
  details: {
    component: string;
    failureProbability: number;
    severityScore: number;
    rootCause: string;
    recommendedActions: string[];
    estimatedRepairCost?: string;
    systemInterdependency?: string;
  };
}

// ── LOGGING ──────────────────────────────────────────────────
export interface TracePoint {
  time: number;
  value: number;
  rpm?: number;
  load?: number;
}

export interface LogAnalysis {
  dataQuality: 'High' | 'Medium' | 'Low' | 'Corrupted';
  summary: string;
  peakPerformance: string;
  detectedIssues: string[];
  tuningRecommendations: string[];
}

export interface LogSession {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  dataPoints: SensorDataPoint[];
  stats: { maxRpm: number; maxBoost: number; maxSpeed: number; avgAfr: number };
  analysis?: LogAnalysis;
  activeTuneState?: { veTable: number[][]; ignTable: number[][]; boostTarget: number };
}

export interface DynoPoint { rpm: number; torque: number; power: number; afr: number; boost: number }
export interface DynoRun {
  id: string;
  timestamp: number;
  name: string;
  data: DynoPoint[];
  peakPower: number;
  peakTorque: number;
  color: string;
  isVisible: boolean;
}

// ── RACE / LAP ────────────────────────────────────────────────
export interface LapTime {
  lap: number;
  time: number;
  splits?: number[];
  maxSpeed?: number;
  valid: boolean;
}

export interface LapSummary {
  lapNumber: number;
  time: number;
}

export interface LapData {
  lap: number;
  currentLapTime: number;
  lastLapTime: number | null;
  bestLapTime: number | null;
}

export enum LaunchState {
  Idle       = 'Idle',
  Staged     = 'Staged',
  Ready      = 'Ready',
  Go         = 'Go',
  RunActive  = 'RunActive',
  Finished   = 'Finished',
  FalseStart = 'FalseStart',
}

export interface DragStats {
  reactionTime: number | null;
  sixtyFootTime: number | null;
  zeroToSixtyTime: number | null;
  zeroToHundredTime: number | null;
  eighthMileTime: number | null;
  eighthMileSpeed: number | null;
  quarterMileTime: number | null;
  quarterMileSpeed: number | null;
}

export interface RaceSession {
  mode: 'CIRCUIT' | 'DRAG';
  isActive: boolean;
  launchState: LaunchState;
  startTime: number | null;
  elapsedTime: number;
  data: SensorDataPoint[];
  lapTimes: LapTime[];
  dragStats: DragStats;
  aiInsights: string[];
  startLineCoords: { lat: number; lon: number } | null;
  currentLapNumber: number;
  currentLapDelta: number;
  bestLap: LapTime | null;
  activeTuneState?: { veTable: number[][]; ignTable: number[][]; boostTarget: number };
}

// ── MEDIA ─────────────────────────────────────────────────────
export enum MediaSource {
  NONE          = 'NONE',
  SPOTIFY       = 'SPOTIFY',
  SYSTEM_PLAYER = 'SYSTEM_PLAYER',
  RADIO         = 'RADIO',
  BLUETOOTH     = 'BLUETOOTH',
  USB           = 'USB',
}

export enum MediaPlaybackState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  PAUSED  = 'PAUSED',
}

export enum MediaConnectionType {
  UNKNOWN   = 'UNKNOWN',
  BLUETOOTH = 'BLUETOOTH',
  USB       = 'USB',
}

export interface MediaTrack {
  title: string;
  artist?: string;
  album?: string;
  durationMs?: number;
  positionMs?: number;
  artworkUrl?: string;
  source?: MediaSource;
}

export interface MediaContext {
  source: MediaSource;
  playbackState: MediaPlaybackState;
  connectionType: MediaConnectionType;
  track: MediaTrack | null;
  volume?: number;
}

// ── AUDIT / LEDGER ────────────────────────────────────────────
export enum AuditEvent {
  AiAnalysis      = 'AI Analysis',
  Login           = 'Login',
  TuningChange    = 'Tuning Change',
  DiagnosticQuery = 'Diagnostic Query',
  DataSync        = 'Data Sync',
  FlashWrite      = 'Flash Write',
  FlashRead       = 'Flash Read',
  ObdCommand      = 'OBD Command', // Tracks raw CAN/UDS commands from AI
  LtklRetard      = 'LTKL Retard', // Permanent knock retard applied
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: AuditEvent;
  description: string;
  ipAddress: string;
  status: string;
}

export enum HederaEventType {
  Maintenance = 'Maintenance',
  Tuning      = 'Tuning',
  Diagnostic  = 'Diagnostic',
}

export interface HederaRecord {
  id: string;
  timestamp: string;
  eventType: HederaEventType;
  vin: string;
  summary: string;
  hederaTxId: string;
  dataHash: string;
}

// ── MAINTENANCE ───────────────────────────────────────────────
export interface MaintenanceRecord {
  id: string;
  date: string;
  service: string;
  notes: string;
  verified: boolean;
  isAiRecommendation: boolean;
}

// ── PRIVACY ───────────────────────────────────────────────────
export interface PrivacySettings {
  optInTelemetry: boolean;
  anonymizeData: boolean;
}

// ── SCAN / FLASH ──────────────────────────────────────────────
export enum ScanStage {
  PROTOCOL_FUZZING = 'PROTOCOL_FUZZING',
  SECURITY_ACCESS  = 'SECURITY_ACCESS',
  ENTROPY_MAPPING  = 'ENTROPY_MAPPING',
  COMPLETE         = 'COMPLETE',
}

export interface OperationStatus {
  success: boolean;
  errorMessage: string;
  errorCode: number;
  progressPercent: number;
}

export interface DiscoveredMap {
  memoryAddress: number;
  sizeBytes: number;
  entropyScore: number;
  likelyType: string;
  confidence: number;
}

export interface ScanConfig {
  deviceUri: string;
  aggressiveMode: boolean;
}

export interface ScanUpdate {
  currentStage: ScanStage;
  status: OperationStatus;
  mapsFound: DiscoveredMap[];
}

// ── VOICE / AI ────────────────────────────────────────────────
export interface VoiceActionResponse {
  textToSpeak: string;
  action: string;
  payload?: string;
  mediaAction?: string;
  spotifyUri?: string;
  volumeLevel?: number;
}

export interface DTCAnalysis {
  summary: string;
  severity: string;
}

// ── THEMES ────────────────────────────────────────────────────
export type ThemeId = 'cyberpunk' | 'rosso' | 'trackday' | 'synthwave' | 'stealth' | 'haltech' | 'rally';

// ── WINDOW EXTENSIONS ─────────────────────────────────────────
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
