import { create } from 'zustand';
import { SensorDataPoint, TimelineEvent, ConnectionStatus } from '../types';
import { obdService } from '../services/obdService';

// --- Constants ---
const MAX_DATA_POINTS = 500;
const RPM_IDLE = 800;

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

// --- Initial State ---
const generateInitialData = (): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const now = Date.now();
  for (let i = MAX_DATA_POINTS; i > 0; i--) {
    data.push({
      time: now - i * 20, rpm: RPM_IDLE, speed: 0, gear: 1, fuelUsed: 19.4, inletAirTemp: 25.0, batteryVoltage: 12.7, engineTemp: 90.0, fuelTemp: 20.0, turboBoost: -0.8, fuelPressure: 3.5, oilPressure: 1.5, shortTermFuelTrim: 0, longTermFuelTrim: 1.5, o2SensorVoltage: 0.45, engineLoad: 15, distance: 0, gForce: 0, latitude: -37.88, longitude: 175.55,
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
export const useVehicleStore = create<VehicleState & VehicleActions>((set) => ({
  ...initialState,
  setTimelineEvents: (events) => set({ timelineEvents: events }),
  connectToVehicle: () => {
    simulationManager.stop();
    set({ isSimulating: false });
    obdService.connect();
  },
  disconnectFromVehicle: () => {
    obdService.disconnect();
  },
}));

// --- OBD Service Subscription ---
obdService.subscribe(
  (status: ConnectionStatus) => {
    useVehicleStore.setState({ connectionStatus: status });
    if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      if (!useVehicleStore.getState().isSimulating) {
        useVehicleStore.setState({ isSimulating: true });
        simulationManager.start();
      }
    }
  },
  (update: Partial<SensorDataPoint>) => {
    const { isSimulating, data, latestData } = useVehicleStore.getState();
    if (isSimulating || !latestData) return; // Ignore OBD data if simulating or store not ready

    const now = Date.now();
    const mergedData: SensorDataPoint = { ...latestData, ...update, time: now };
    
    const deltaTimeSeconds = (now - latestData.time) / 1000.0;
    if (deltaTimeSeconds > 0) {
      const speedMetersPerSecond = mergedData.speed * (1000 / 3600);
      const prevSpeedMetersPerSecond = latestData.speed * (1000 / 3600);
      mergedData.gForce = ((speedMetersPerSecond - prevSpeedMetersPerSecond) / deltaTimeSeconds) / 9.81;
      mergedData.distance = (latestData.distance || 0) + (speedMetersPerSecond * deltaTimeSeconds);
    }

    const updatedData = [...data, mergedData];
    const slicedData = updatedData.length > MAX_DATA_POINTS
      ? updatedData.slice(updatedData.length - MAX_DATA_POINTS)
      : updatedData;
    
    useVehicleStore.setState({ data: slicedData, latestData: mergedData });
  }
);

// --- Simulation Manager ---
const simulationManager = {
  UPDATE_INTERVAL_MS: 20,
  RPM_MAX: 8000,
  GEAR_RATIOS: [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6],
  DEFAULT_LAT: -37.88,
  DEFAULT_LON: 175.55,
  
  simState: {
    vehicleState: 0 as number, // Enum VehicleSimState
    stateTimeout: 0,
    lastUpdate: Date.now(),
    gpsDataRef: null as { latitude: number; longitude: number; speed: number | null } | null,
    watcherId: null as number | null,
    intervalId: null as number | null,
  },

  stop() {
    if (this.simState.intervalId) {
      clearInterval(this.simState.intervalId);
      this.simState.intervalId = null;
    }
    if (this.simState.watcherId && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.simState.watcherId);
      this.simState.watcherId = null;
    }
  },

  start() {
    if (this.simState.intervalId) return;

    if ('geolocation' in navigator && !this.simState.watcherId) {
      this.simState.watcherId = navigator.geolocation.watchPosition(
        (p) => { this.simState.gpsDataRef = { latitude: p.coords.latitude, longitude: p.coords.longitude, speed: p.coords.speed }; },
        () => { this.simState.gpsDataRef = null; },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    this.simState.intervalId = window.setInterval(() => {
      if (!useVehicleStore.getState().isSimulating) {
        this.stop();
        return;
      }
      this.tick();
    }, this.UPDATE_INTERVAL_MS);
  },
  
  tick() {
      const now = Date.now();
      const deltaTimeSeconds = (now - this.simState.lastUpdate) / 1000.0;
      this.simState.lastUpdate = now;

      const { latestData, data } = useVehicleStore.getState();
      let { rpm, speed, gear, longTermFuelTrim, distance, latitude, longitude } = latestData;
      
      const currentGpsData = this.simState.gpsDataRef;

      if (currentGpsData?.speed != null && currentGpsData.speed > 0.5) {
        speed = currentGpsData.speed * 3.6; // m/s to km/h
        latitude = currentGpsData.latitude;
        longitude = currentGpsData.longitude;
        if (speed < 20) gear = 1; else if (speed < 40) gear = 2; else if (speed < 70) gear = 3; else if (speed < 100) gear = 4; else if (speed < 130) gear = 5; else gear = 6;
        rpm = speed > 1 ? RPM_IDLE + (1500 * (gear-1)) + (speed % 30) * 100 : RPM_IDLE;
      } else {
        if (now > this.simState.stateTimeout) {
            this.simState.vehicleState = (this.simState.vehicleState + Math.floor(Math.random() * 2) + 1) % 4;
            this.simState.stateTimeout = now + 3000 + Math.random() * 5000;
        }
        switch (this.simState.vehicleState) {
          case 1: if (rpm > 4500 && gear < 6) { gear++; rpm *= 0.6; } rpm += (this.RPM_MAX / (gear * 15)) * (1 - rpm/this.RPM_MAX) + Math.random() * 50; break;
          case 2: rpm += (2500 - rpm) * 0.05; break;
          case 3: if (rpm < 2000 && gear > 1) { gear--; rpm *= 1.2; } rpm *= 0.98; speed *= 0.96; break;
          default: rpm += (RPM_IDLE - rpm) * 0.1; speed *= 0.98; if (speed < 5) gear = 1; break;
        }
        speed = (rpm / (this.GEAR_RATIOS[gear] * 300)) * (1 - (1/gear)) * 10;
      }
      
      rpm = Math.max(RPM_IDLE, Math.min(rpm, this.RPM_MAX));
      speed = Math.max(0, Math.min(speed, 280));
      if (speed < 1) { speed = 0; gear = speed > 0.1 ? 1: 0; }

      const timeOfDayEffect = Math.sin(now / 20000);
      const isFaultActive = timeOfDayEffect > 0.7;
      const speedDelta = (speed - latestData.speed) * (1000/3600);
      const gForce = deltaTimeSeconds > 0 ? (speedDelta / deltaTimeSeconds) / 9.81 : 0;
      
      const newDataPoint: SensorDataPoint = {
        time: now, rpm, speed, gear,
        fuelUsed: latestData.fuelUsed + (rpm / this.RPM_MAX) * 0.005,
        inletAirTemp: 25 + (speed / 280) * 20,
        batteryVoltage: 13.8 + (rpm > 1000 ? 0.2 : 0) - (Math.random() * 0.1) - (isFaultActive ? 0.5 : 0),
        engineTemp: 90 + (rpm / this.RPM_MAX) * 15 + (isFaultActive ? 5 : 0),
        fuelTemp: 20 + (speed / 280) * 10,
        turboBoost: -0.8 + (rpm / this.RPM_MAX) * 2.8 * (gear / 6),
        fuelPressure: 3.5 + (rpm / this.RPM_MAX) * 2,
        oilPressure: 1.5 + (rpm / this.RPM_MAX) * 5.0 - (isFaultActive ? 0.5 : 0),
        shortTermFuelTrim: 2.0 + (Math.random() - 0.5) * 4 + (isFaultActive ? 5 : 0),
        longTermFuelTrim: Math.min(10, longTermFuelTrim + (isFaultActive ? 0.01 : -0.005)),
        o2SensorVoltage: 0.1 + (0.5 + Math.sin(now / 500) * 0.4),
        engineLoad: 15 + (rpm - RPM_IDLE) / (this.RPM_MAX - RPM_IDLE) * 85,
        distance: distance + (speed * (1000 / 3600)) * deltaTimeSeconds,
        gForce,
        latitude: currentGpsData?.latitude || latitude,
        longitude: currentGpsData?.longitude || longitude,
      };

      const updatedData = [...data, newDataPoint];
      const slicedData = updatedData.length > MAX_DATA_POINTS ? updatedData.slice(updatedData.length - MAX_DATA_POINTS) : updatedData;
      useVehicleStore.setState({ data: slicedData, latestData: newDataPoint, hasActiveFault: isFaultActive });
  }
};

// Start the simulation by default.
simulationManager.start();
