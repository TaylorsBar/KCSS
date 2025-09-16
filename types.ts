
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
  turboBoost: number;
  fuelPressure: number;
  oilPressure: number;
  // New detailed OBD-II params for AI Engine
  shortTermFuelTrim: number;
  longTermFuelTrim: number;
  o2SensorVoltage: number;
  engineLoad: number;
  // For Race Pack
  distance: number;
  gForce: number;
  // For GPS
  latitude: number;
  longitude: number;
}

export enum AlertLevel {
  Info = 'Info',
  Warning = 'Warning',
  Critical = 'Critical'
}

export interface DiagnosticAlert {
  id: string;
  level: AlertLevel;
  component: string;
  message: string;
  timestamp: string;
  isFaultRelated?: boolean; // New field for Co-Pilot context
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  service: string;
  notes: string;
  verified: boolean;
  isAiRecommendation: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

// Types for the new Predictive AI Engine
export interface PredictiveIssue {
    component: string;
    rootCause: string;
    recommendedActions: string[];
    plainEnglishSummary: string;
    tsbs?: string[];
}

export interface TimelineEvent {
    id:string;
    level: AlertLevel;
    title: string;
    timeframe: string; // e.g., "Immediate", "Next 3 months", "Within 5000 miles"
    details: PredictiveIssue;
}

// For AI Tuning Suggestions from FastAPI
export interface AiTuningSuggestion {
  title: string;
  rationale: string;
  changes: {
    key: 'rpmLimit' | 'boostTarget' | 'afrTarget' | string;
    from: number;
    to: number;
  }[];
  risk: 'low' | 'medium' | 'high';
}

// For Pre-write Check response
export interface PrewriteCheckResponse {
  ok: boolean;
  reason: string | null;
  audit: {
    hash: string;
    payload: string;
  };
}


// Types for Security Audit Trail
export enum AuditEvent {
    Login = 'User Login',
    AiAnalysis = 'AI Analysis',
    DataSync = 'Data Sync',
    TuningChange = 'Tuning Change',
    DiagnosticQuery = 'Diagnostic Query'
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: AuditEvent;
  description: string;
  ipAddress: string;
  status: 'Success' | 'Failure';
}

// Types for AR Assistant
export enum IntentAction {
  ShowComponent = 'SHOW_COMPONENT',
  QueryService = 'QUERY_SERVICE',
  HideComponent = 'HIDE_COMPONENT',
  Unknown = 'UNKNOWN',
}

export interface VoiceCommandIntent {
  intent: IntentAction;
  component?: string; // e.g., 'o2-sensor', 'map-sensor'
  confidence: number;
}

export interface ComponentHotspot {
  id: string;
  name: string;
  cx: string;
  cy: string;
  status: 'Normal' | 'Warning' | 'Failing';
}

// Types for Hedera DLT Integration
export enum HederaEventType {
    Maintenance = 'Maintenance',
    Tuning = 'AI Tuning',
    Diagnostic = 'Diagnostic Alert',
}

export interface HederaRecord {
    id: string;
    timestamp: string;
    eventType: HederaEventType;
    vin: string;
    summary: string;
    hederaTxId: string;
    dataHash: string; // The hash of the off-chain data
}

// Types for Race Pack
export interface GpsPoint {
    latitude: number;
    longitude: number;
}

export interface LapTime {
    lap: number;
    time: number;
}

export interface RaceSession {
    isActive: boolean;
    startTime: number | null;
    elapsedTime: number;
    data: SensorDataPoint[];
    lapTimes: LapTime[];
    gpsPath: GpsPoint[];
    zeroToHundredTime: number | null;
    quarterMileTime: number | null;
    quarterMileSpeed: number | null;
}

export interface SavedRaceSession {
    id: string;
    date: string;
    totalTime: number;
    maxSpeed: number;
    distance: number;
    data: SensorDataPoint[];
    zeroToHundredTime: number | null;
    quarterMileTime: number | null;
    quarterMileSpeed: number | null;
    lapTimes: LapTime[];
    gpsPath: GpsPoint[];
}

export interface LeaderboardEntry {
    value: number;
    date: string;
}

export interface Leaderboard {
    zeroToHundred: LeaderboardEntry | null;
    quarterMileTime: LeaderboardEntry | null;
    quarterMileSpeed: LeaderboardEntry | null;
}

// Types for Drag Strip
export interface DragRaceResult {
  reactionTime: number | null;
  timeTo60ft: number | null;
  timeTo330ft: number | null;
  timeTo1_8mile: number | null;
  speedAt1_8mile: number | null;
  timeTo1000ft: number | null;
  timeTo1_4mile: number | null;
  speedAt1_4mile: number | null;
}

// Types for Verified Parts Marketplace
export enum PartCategory {
    Engine = 'Engine',
    Suspension = 'Suspension',
    Brakes = 'Brakes',
    Exhaust = 'Exhaust',
    Electronics = 'Electronics',
    ForcedInduction = 'Forced Induction',
}

export enum PartCondition {
    New = 'New',
    UsedLikeNew = 'Used - Like New',
    UsedGood = 'Used - Good',
}

export enum ProvenanceEventType {
    Minted = 'Minted',
    Listed = 'Listed',
    Sold = 'Sold',
    Installed = 'Installed',
    Serviced = 'Serviced',
}

export interface Part {
    id: string;
    manufacturer: string;
    sku: string;
    serial: string;
    category: PartCategory;
    name: string;
    description: string;
    imageUrl?: string;
}

export interface Listing {
    id: string;
    part: Part;
    price: number;
    currency: 'USD';
    condition: PartCondition;
    seller: string;
    isOemVerified: boolean;
}

export interface ProvenanceEvent {
    id: string;
    type: ProvenanceEventType;
    actor: string; // e.g., 'Manufacturer', 'KC Speed Shop'
    timestamp: string;
    hederaTxId: string;
    details?: string;
}
