import { create } from 'zustand';
import { SensorDataPoint, TimelineEvent } from '../types';

enum VehicleSimState {
  IDLE,
  ACCELERATING,
  CRUISING,
  BRAKING,
}

const UPDATE_INTERVAL_MS = 20; // 50Hz for high precision
const MAX_DATA_POINTS = 500;
const RPM_IDLE = 800;
const RPM_MAX = 8000;
const SPEED_MAX = 280;
const GEAR_RATIOS = [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6];
const DEFAULT_LAT = -37.88; // Karapiro, NZ
const DEFAULT_LON = 175.55;

const generateInitialData = (): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const now = Date.now();
  for (let i = MAX_DATA_POINTS; i > 0; i--) {
    data.push({
      time: now - i * UPDATE_INTERVAL_MS,
      rpm: RPM_IDLE,
      speed: 0,
      gear: 1,
      fuelUsed: 19.4,
      inletAirTemp: 25.0,
      batteryVoltage: 12.7,
      engineTemp: 90.0,
      fuelTemp: 20.0,
      turboBoost: -0.8,
      fuelPressure: 3.5,
      oilPressure: 1.5,
      shortTermFuelTrim: 0,
      longTermFuelTrim: 1.5,
      o2SensorVoltage: 0.45,
      engineLoad: 15,
      distance: 0,
      gForce: 0,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LON,
    });
  }
  return data;
};

interface VehicleState {
  data: SensorDataPoint[];
  latestData: SensorDataPoint;
  hasActiveFault: boolean;
  timelineEvents: TimelineEvent[];
}

interface VehicleActions {
  setTimelineEvents: (events: TimelineEvent[]) => void;
}

const initialData = generateInitialData();
const initialState: VehicleState = {
  data: initialData,
  latestData: initialData[initialData.length - 1],
  hasActiveFault: false,
  timelineEvents: [],
};

export const useVehicleStore = create<VehicleState & VehicleActions>((set, get) => ({
  ...initialState,
  setTimelineEvents: (events) => set({ timelineEvents: events }),
}));

// --- Simulation Logic ---
let vehicleState = VehicleSimState.IDLE;
let stateTimeout = 0;
let lastUpdate = Date.now();
let gpsDataRef: {latitude: number; longitude: number; speed: number | null} | null = null;
let watcherId: number | null = null;
let intervalId: number | null = null;

const startSimulation = () => {
    if (intervalId) return; // Already running

    if ('geolocation' in navigator && !watcherId) {
      watcherId = navigator.geolocation.watchPosition(
        (position) => {
          gpsDataRef = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed, // meters per second
          };
        },
        (error) => {
          console.warn(`Geolocation error: ${error.message} (Code: ${error.code})`);
          gpsDataRef = null;
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0, // Force fresh data for high accuracy
          timeout: 10000,
        }
      );
    }

    intervalId = window.setInterval(() => {
        const now = Date.now();
        const deltaTimeSeconds = (now - lastUpdate) / 1000.0;
        lastUpdate = now;

        const prevData = useVehicleStore.getState().data;
        const prev = prevData[prevData.length - 1];
        let { rpm, speed, gear, longTermFuelTrim, distance, latitude, longitude } = prev;

        const currentGpsData = gpsDataRef;

        if (currentGpsData && currentGpsData.speed !== null) {
            speed = currentGpsData.speed * 3.6; // m/s to km/h
            latitude = currentGpsData.latitude;
            longitude = currentGpsData.longitude;

            if (speed < 20) gear = 1;
            else if (speed < 40) gear = 2;
            else if (speed < 70) gear = 3;
            else if (speed < 100) gear = 4;
            else if (speed < 130) gear = 5;
            else gear = 6;
            
            if (speed > 1) {
                rpm = RPM_IDLE + (1500 * (gear-1)) + (speed % 30) * 100;
            } else {
                rpm = RPM_IDLE;
                gear = 1;
            }
        } else {
             if (now > stateTimeout) {
              const rand = Math.random();
              switch (vehicleState) {
                case VehicleSimState.IDLE:
                  vehicleState = VehicleSimState.ACCELERATING;
                  stateTimeout = now + (5000 + Math.random() * 5000);
                  break;
                case VehicleSimState.ACCELERATING:
                  vehicleState = rand > 0.5 ? VehicleSimState.CRUISING : VehicleSimState.BRAKING;
                  stateTimeout = now + (8000 + Math.random() * 10000);
                  break;
                case VehicleSimState.CRUISING:
                  vehicleState = rand > 0.6 ? VehicleSimState.ACCELERATING : (rand > 0.3 ? VehicleSimState.BRAKING : VehicleSimState.CRUISING);
                  stateTimeout = now + (5000 + Math.random() * 8000);
                  break;
                case VehicleSimState.BRAKING:
                  vehicleState = rand > 0.3 ? VehicleSimState.IDLE : VehicleSimState.ACCELERATING;
                  stateTimeout = now + (3000 + Math.random() * 3000);
                  break;
              }
            }

            switch (vehicleState) {
              case VehicleSimState.IDLE:
                rpm += (RPM_IDLE - rpm) * 0.1;
                speed *= 0.98;
                if (speed < 5) gear = 1;
                break;
              case VehicleSimState.ACCELERATING:
                if (rpm > 4500 && gear < 6) {
                  gear++;
                  rpm *= 0.6;
                }
                rpm += (RPM_MAX / (gear * 15)) * (1 - rpm/RPM_MAX) + Math.random() * 50;
                break;
              case VehicleSimState.CRUISING:
                rpm += (2500 - rpm) * 0.05 + (Math.random() - 0.5) * 100;
                break;
              case VehicleSimState.BRAKING:
                if (rpm < 2000 && gear > 1) {
                    gear--;
                    rpm *= 1.2;
                }
                rpm *= 0.98;
                speed *= 0.96;
                break;
            }
             speed = (rpm / (GEAR_RATIOS[gear] * 300)) * (1 - (1/gear)) * 10;
        }

        rpm = Math.max(RPM_IDLE, Math.min(rpm, RPM_MAX));
        speed = Math.max(0, Math.min(speed, SPEED_MAX));
        if (speed < 1) {
            speed = 0;
            if(!currentGpsData) vehicleState = VehicleSimState.IDLE;
        }

        const speedMetersPerSecond = speed * (1000 / 3600);
        const prevSpeedMetersPerSecond = prev.speed * (1000 / 3600);
        const acceleration = (speedMetersPerSecond - prevSpeedMetersPerSecond) / deltaTimeSeconds;
        const gForce = acceleration / 9.81;

        const distanceThisFrame = speedMetersPerSecond * deltaTimeSeconds;
        const newDistance = distance + distanceThisFrame;

        const timeOfDayEffect = Math.sin(now / 20000);
        const isFaultActive = timeOfDayEffect > 0.7;
        
        const newDataPoint: SensorDataPoint = {
          time: now,
          rpm,
          speed,
          gear,
          fuelUsed: prev.fuelUsed + (rpm / RPM_MAX) * 0.005,
          inletAirTemp: 25 + (speed / SPEED_MAX) * 20,
          batteryVoltage: 13.8 + (rpm > 1000 ? 0.2 : 0) - (Math.random() * 0.1) - (isFaultActive ? 0.5 : 0),
          engineTemp: 90 + (rpm / RPM_MAX) * 15 + (isFaultActive ? 5 : 0),
          fuelTemp: 20 + (speed / SPEED_MAX) * 10,
          turboBoost: -0.8 + (rpm / RPM_MAX) * 2.8 * (gear / 6),
          fuelPressure: 3.5 + (rpm / RPM_MAX) * 2,
          oilPressure: 1.5 + (rpm / RPM_MAX) * 5.0 - (isFaultActive ? 0.5 : 0),
          shortTermFuelTrim: 2.0 + (Math.random() - 0.5) * 4 + (isFaultActive ? 5 : 0),
          longTermFuelTrim: Math.min(10, longTermFuelTrim + (isFaultActive ? 0.01 : -0.005)),
          o2SensorVoltage: 0.1 + (0.5 + Math.sin(now / 500) * 0.4),
          engineLoad: 15 + (rpm - RPM_IDLE) / (RPM_MAX - RPM_IDLE) * 85,
          distance: newDistance,
          gForce,
          latitude,
          longitude,
        };

        const updatedData = [...prevData, newDataPoint];
        const slicedData = updatedData.length > MAX_DATA_POINTS 
          ? updatedData.slice(updatedData.length - MAX_DATA_POINTS)
          : updatedData;

        useVehicleStore.setState({ data: slicedData, latestData: newDataPoint, hasActiveFault: isFaultActive });
    }, UPDATE_INTERVAL_MS);
};

// Start the simulation when the store is initialized.
startSimulation();
