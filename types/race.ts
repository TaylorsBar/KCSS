
import { SensorDataPoint } from './vehicle';

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
