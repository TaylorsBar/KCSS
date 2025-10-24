import { create } from 'zustand';
import { SensorDataPoint, TimelineEvent, ConnectionStatus } from '../types';
import { obdService } from '../services/obdService';

// --- Simulator Configuration ---
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
const GEAR_RATIOS = [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6];
const DEFAULT_LAT = -37.88; // Karapiro, NZ
const DEFAULT_LON = 175.55;

// --- Store State Definition ---
interface VehicleState {
  data: SensorDataPoint[];
  latestData: SensorDataPoint;
  hasActiveFault: boolean;
  timelineEvents: TimelineEvent[];
  connectionStatus: ConnectionStatus;
  isSimulating: boolean;
}

interface VehicleActions {
  setTimelineEvents: (events: TimelineEvent[]) => void;
  connectToVehicle: () => void;
  disconnectFromVehicle: () => void;
}

// --- Initial State & Data Generation ---
const generateInitialData = (): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const now = Date.now();
  for (let i = MAX_DATA_POINTS; i > 0; i--) {
    data.push({
      time: now - i * UPDATE_INTERVAL_MS, rpm: RPM_IDLE, speed: 0, gear: 1, fuelUsed: 19.4, inletAirTemp: 25.0, batteryVoltage: 12.7, engineTemp: 90.0, fuelTemp: 20.0, turboBoost: -0.8, fuelPressure: 3.5, oilPressure: 1.5, shortTermFuelTrim: 0, longTermFuelTrim: 1.5, o2SensorVoltage: 0.45, engineLoad: 15, distance: 0, gForce: 0, latitude: DEFAULT_LAT, longitude: DEFAULT_LON,
    });
  }
  return data;
};

const initialData = generateInitialData();
const initialState: VehicleState = {
  data: initialData,
  latestData: initialData[initialData.length - 1],
  hasActiveFault: false,
  timelineEvents: [],
  connectionStatus: ConnectionStatus.DISCONNECTED,
  isSimulating: true,
};

// --- Zustand Store Creation ---
export const useVehicleStore = create<VehicleState & VehicleActions>((set, get) => ({
  ...initialState,
  setTimelineEvents: (events) => set({ timelineEvents: events }),
  connectToVehicle: () => {
    stopSimulation();
    set({ isSimulating: false });
    obdService.connect();
  },
  disconnectFromVehicle: () => {
    obdService.disconnect();
    // The status callback will handle restarting the simulation
  },
}));

// --- OBD Service Subscription ---
obdService.subscribe(
  (status: ConnectionStatus) => {
    useVehicleStore.setState({ connectionStatus: status });
    if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      if (!get().isSimulating) {
        useVehicleStore.setState({ isSimulating: true });
        startSimulation();
      }
    }
  },
  (update: Partial<SensorDataPoint>) => {
    if (get().isSimulating) return; // Ignore OBD data if we're simulating

    const { data, latestData } = get();
    const now = Date.now();
    
    // Merge the update from OBD into the latest data point
    const mergedData = { ...latestData, ...update, time: now };
    
    // Calculate derived values
    const deltaTimeSeconds = (now - latestData.time) / 1000.0;
    const speedMetersPerSecond = mergedData.speed * (1000 / 3600);
    const prevSpeedMetersPerSecond = latestData.speed * (1000 / 3600);
    mergedData.gForce = ((speedMetersPerSecond - prevSpeedMetersPerSecond) / deltaTimeSeconds) / 9.81;
    mergedData.distance += speedMetersPerSecond * deltaTimeSeconds;

    const updatedData = [...data, mergedData];
    const slicedData = updatedData.length > MAX_DATA_POINTS
      ? updatedData.slice(updatedData.length - MAX_DATA_POINTS)
      : updatedData;
    
    useVehicleStore.setState({ data: slicedData, latestData: mergedData });
  }
);
const { getState: get, setState: set } = useVehicleStore;

// --- Simulation Logic (now internal to the store module) ---
let simState = {
  vehicleState: VehicleSimState.IDLE,
  stateTimeout: 0,
  lastUpdate: Date.now(),
  gpsDataRef: null as {latitude: number; longitude: number; speed: number | null} | null,
  motionDataRef: null as {x: number; y: number; z: number} | null, // To store accelerometer data
  watcherId: null as number | null,
  intervalId: null as number | null,
};

// Motion event handler
const handleMotionEvent = (event: DeviceMotionEvent) => {
    if (event.acceleration) {
        simState.motionDataRef = {
            x: event.acceleration.x || 0,
            y: event.acceleration.y || 0,
            z: event.acceleration.z || 0,
        };
    }
};

function stopSimulation() {
  if (simState.intervalId) {
    clearInterval(simState.intervalId);
    simState.intervalId = null;
  }
  if (simState.watcherId && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(simState.watcherId);
    simState.watcherId = null;
  }
  window.removeEventListener('devicemotion', handleMotionEvent);
}

function startSimulation() {
    if (simState.intervalId) return;

    // GPS watcher
    if ('geolocation' in navigator && !simState.watcherId) {
      simState.watcherId = navigator.geolocation.watchPosition(
        (p) => { simState.gpsDataRef = { latitude: p.coords.latitude, longitude: p.coords.longitude, speed: p.coords.speed }; },
        () => { simState.gpsDataRef = null; },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    // Motion sensor listener with permission handling for iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((permissionState: string) => {
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotionEvent);
            }
        });
    } else {
        // Non-iOS 13+ browsers
        window.addEventListener('devicemotion', handleMotionEvent);
    }


    simState.intervalId = window.setInterval(() => {
      if (!get().isSimulating) {
        stopSimulation();
        return;
      }
      
      const now = Date.now();
      const deltaTimeSeconds = (now - simState.lastUpdate) / 1000.0;
      simState.lastUpdate = now;

      const prev = get().latestData;
      let { rpm, speed, gear, longTermFuelTrim, distance, latitude, longitude } = prev;
      
      const currentGpsData = simState.gpsDataRef;

      if (currentGpsData && currentGpsData.speed !== null && currentGpsData.speed > 0.5) {
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
            rpm = RPM_IDLE + (1500 * (gear-1)) + (speed % 30) * 100 + Math.sin(now/300) * 50;
        } else {
            rpm = RPM_IDLE;
            gear = 1;
        }
      } else {
        if (now > simState.stateTimeout) {
            const rand = Math.random();
            switch (simState.vehicleState) {
              case VehicleSimState.IDLE: simState.vehicleState = VehicleSimState.ACCELERATING; simState.stateTimeout = now + (5000 + Math.random() * 5000); break;
              case VehicleSimState.ACCELERATING: simState.vehicleState = rand > 0.5 ? VehicleSimState.CRUISING : VehicleSimState.BRAKING; simState.stateTimeout = now + (8000 + Math.random() * 10000); break;
              case VehicleSimState.CRUISING: simState.vehicleState = rand > 0.6 ? VehicleSimState.ACCELERATING : (rand > 0.3 ? VehicleSimState.BRAKING : VehicleSimState.CRUISING); simState.stateTimeout = now + (5000 + Math.random() * 8000); break;
              case VehicleSimState.BRAKING: simState.vehicleState = rand > 0.3 ? VehicleSimState.IDLE : VehicleSimState.ACCELERATING; simState.stateTimeout = now + (3000 + Math.random() * 3000); break;
            }
          }
          switch (simState.vehicleState) {
            case VehicleSimState.IDLE: rpm += (RPM_IDLE - rpm) * 0.1; speed *= 0.98; if (speed < 5) gear = 1; break;
            case VehicleSimState.ACCELERATING: if (rpm > 4500 && gear < 6) { gear++; rpm *= 0.6; } rpm += (RPM_MAX / (gear * 15)) * (1 - rpm/RPM_MAX) + Math.random() * 50; break;
            case VehicleSimState.CRUISING: rpm += (2500 - rpm) * 0.05 + (Math.random() - 0.5) * 100; break;
            case VehicleSimState.BRAKING: if (rpm < 2000 && gear > 1) { gear--; rpm *= 1.2; } rpm *= 0.98; speed *= 0.96; break;
          }
           speed = (rpm / (GEAR_RATIOS[gear] * 300)) * (1 - (1/gear)) * 10;
      }

      rpm = Math.max(RPM_IDLE, Math.min(rpm, RPM_MAX));
      speed = Math.max(0, Math.min(speed, 280));
      if (speed < 1) { 
        speed = 0;
        if (!currentGpsData) simState.vehicleState = VehicleSimState.IDLE;
      }

      const timeOfDayEffect = Math.sin(now / 20000);
      const isFaultActive = timeOfDayEffect > 0.7;
      
      let gForce;
      if (simState.motionDataRef) {
          // Assuming portrait orientation where Y is longitudinal acceleration.
          // This is a simplification; a production app might need calibration.
          gForce = (simState.motionDataRef.y || 0) / 9.81;
      } else {
          // Fallback to deriving from speed change if motion data is unavailable
          const speedDelta = (speed - prev.speed) * (1000/3600);
          gForce = deltaTimeSeconds > 0 ? (speedDelta / deltaTimeSeconds) / 9.81 : 0;
      }

      const newDataPoint: SensorDataPoint = {
        time: now, rpm, speed, gear,
        fuelUsed: prev.fuelUsed + (rpm / RPM_MAX) * 0.005,
        inletAirTemp: 25 + (speed / 280) * 20,
        batteryVoltage: 13.8 + (rpm > 1000 ? 0.2 : 0) - (Math.random() * 0.1) - (isFaultActive ? 0.5 : 0),
        engineTemp: 90 + (rpm / RPM_MAX) * 15 + (isFaultActive ? 5 : 0),
        fuelTemp: 20 + (speed / 280) * 10,
        turboBoost: -0.8 + (rpm / RPM_MAX) * 2.8 * (gear / 6),
        fuelPressure: 3.5 + (rpm / RPM_MAX) * 2,
        oilPressure: 1.5 + (rpm / RPM_MAX) * 5.0 - (isFaultActive ? 0.5 : 0),
        shortTermFuelTrim: 2.0 + (Math.random() - 0.5) * 4 + (isFaultActive ? 5 : 0),
        longTermFuelTrim: Math.min(10, longTermFuelTrim + (isFaultActive ? 0.01 : -0.005)),
        o2SensorVoltage: 0.1 + (0.5 + Math.sin(now / 500) * 0.4),
        engineLoad: 15 + (rpm - RPM_IDLE) / (RPM_MAX - RPM_IDLE) * 85,
        distance: distance + (speed * (1000 / 3600)) * deltaTimeSeconds,
        gForce: gForce,
        latitude: currentGpsData?.latitude || latitude,
        longitude: currentGpsData?.longitude || longitude,
      };

      const updatedData = [...get().data, newDataPoint];
      const slicedData = updatedData.length > MAX_DATA_POINTS 
        ? updatedData.slice(updatedData.length - MAX_DATA_POINTS)
        : updatedData;

      set({ data: slicedData, latestData: newDataPoint, hasActiveFault: isFaultActive });
    }, UPDATE_INTERVAL_MS);
}

// Start the simulation by default when the store is initialized.
startSimulation();
