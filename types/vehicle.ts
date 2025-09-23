
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
  // For AFR Gauge
  afr: number;
  // For Advanced EV Dashboard
  powerOutputKw?: number;
  tireFL?: number;
  tireFR?: number;
  tireRL?: number;
  tireRR?: number;
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
