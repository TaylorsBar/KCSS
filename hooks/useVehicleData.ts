import { useState, useEffect, useRef } from 'react';
import { SensorDataPoint } from '../types/index';

enum VehicleState {
  IDLE,
  ACCELERATING,
  CRUISING,
  BRAKING,
}

const UPDATE_INTERVAL_MS = 20; // 50Hz for high precision
const MAX_DATA_POINTS = 500; // Store more data for race analysis
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
      afr: 14.7,
      powerOutputKw: 0,
      tireFL: 35,
      tireFR: 35,
      tireRL: 35,
      tireRR: 35,
    });
  }
  return data;
};

export const useVehicleData = () => {
  const [data, setData] = useState<SensorDataPoint[]>(generateInitialData);
  const [hasActiveFault, setHasActiveFault] = useState(false);
  const vehicleState = useRef<VehicleState>(VehicleState.IDLE);
  const stateTimeout = useRef<number>(0);
  const lastUpdate = useRef<number>(Date.now());
  const [gpsData, setGpsData] = useState<{latitude: number; longitude: number; speed: number | null} | null>(null);
  const slowLeakTireRef = useRef(35); // Simulate a slow leak in one tire

  useEffect(() => {
    let watcherId: number | null = null;
    if ('geolocation' in navigator) {
      watcherId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed, // meters per second
          });
        },
        (error) => {
          console.warn(`Geolocation error: ${error.message} (Code: ${error.code})`);
          setGpsData(null); // Fallback to simulation
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000, // Increased timeout to 10 seconds
        }
      );
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTimeSeconds = (now - lastUpdate.current) / 1000.0;
      lastUpdate.current = now;
      
      // Update slow leak tire pressure
      slowLeakTireRef.current -= 0.0005;


      setData(prevData => {
        const prev = prevData[prevData.length - 1];
        let { rpm, speed, gear, longTermFuelTrim, distance, latitude, longitude } = prev;

        // GPS Mode (if data is available)
        if (gpsData && gpsData.speed !== null) {
            speed = gpsData.speed * 3.6; // m/s to km/h
            latitude = gpsData.latitude;
            longitude = gpsData.longitude;

            // Determine gear based on speed
            if (speed < 20) gear = 1;
            else if (speed < 40) gear = 2;
            else if (speed < 70) gear = 3;
            else if (speed < 100) gear = 4;
            else if (speed < 130) gear = 5;
            else gear = 6;
            
            // Determine RPM based on speed and gear
            if (speed > 1) {
                rpm = RPM_IDLE + (1500 * (gear-1)) + (speed % 30) * 100;
            } else {
                rpm = RPM_IDLE;
                gear = 1;
            }

        // Simulation Mode
        } else {
            if (now > stateTimeout.current) {
              const rand = Math.random();
              switch (vehicleState.current) {
                case VehicleState.IDLE:
                  vehicleState.current = VehicleState.ACCELERATING;
                  stateTimeout.current = now + (5000 + Math.random() * 5000);
                  break;
                case VehicleState.ACCELERATING:
                  vehicleState.current = rand > 0.5 ? VehicleState.CRUISING : VehicleState.BRAKING;
                  stateTimeout.current = now + (8000 + Math.random() * 10000);
                  break;
                case VehicleState.CRUISING:
                  vehicleState.current = rand > 0.6 ? VehicleState.ACCELERATING : (rand > 0.3 ? VehicleState.BRAKING : VehicleState.CRUISING);
                  stateTimeout.current = now + (5000 + Math.random() * 8000);
                  break;
                case VehicleState.BRAKING:
                  vehicleState.current = rand > 0.3 ? VehicleState.IDLE : VehicleState.ACCELERATING;
                  stateTimeout.current = now + (3000 + Math.random() * 3000);
                  break;
              }
            }

            switch (vehicleState.current) {
              case VehicleState.IDLE:
                rpm += (RPM_IDLE - rpm) * 0.1;
                speed *= 0.98;
                if (speed < 5) gear = 1;
                break;
              case VehicleState.ACCELERATING:
                if (rpm > 4500 && gear < 6) {
                  gear++;
                  rpm *= 0.6;
                }
                rpm += (RPM_MAX / (gear * 15)) * (1 - rpm/RPM_MAX) + Math.random() * 50;
                break;
              case VehicleState.CRUISING:
                rpm += (2500 - rpm) * 0.05 + (Math.random() - 0.5) * 100;
                break;
              case VehicleState.BRAKING:
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
            if(!gpsData) vehicleState.current = VehicleState.IDLE;
        }

        const speedMetersPerSecond = speed * (1000 / 3600);
        const prevSpeedMetersPerSecond = prev.speed * (1000 / 3600);
        const acceleration = (speedMetersPerSecond - prevSpeedMetersPerSecond) / deltaTimeSeconds;
        const gForce = acceleration / 9.81;

        // EV-specific power calculation
        // Power (kW) = Force (N) * Velocity (m/s) / 1000
        // Force = Mass (kg) * Acceleration (m/s^2) + Drag Force + Rolling Resistance
        const vehicleMassKg = 1800;
        const dragCoefficient = 0.28;
        const frontalArea = 2.22;
        const airDensity = 1.225;
        const rollingResistance = 0.012;
        
        const force = (vehicleMassKg * acceleration) + 
                      (0.5 * dragCoefficient * frontalArea * airDensity * Math.pow(speedMetersPerSecond, 2)) +
                      (rollingResistance * vehicleMassKg * 9.81);
        
        // Positive power is usage, negative is regen
        let powerOutputKw = (force * speedMetersPerSecond) / 1000;
        // Cap regen power
        if (powerOutputKw < 0) {
            powerOutputKw = Math.max(powerOutputKw, -80); // Cap regen at 80kW
        } else {
            powerOutputKw = Math.min(powerOutputKw, 350); // Cap power at 350kW
        }


        const distanceThisFrame = speedMetersPerSecond * deltaTimeSeconds;
        const newDistance = distance + distanceThisFrame;

        const timeOfDayEffect = Math.sin(now / 20000);
        const isFaultActive = timeOfDayEffect > 0.7;
        setHasActiveFault(isFaultActive);
        const simulatedFault = isFaultActive ? 5.0 : 0; 
        const engineLoad = 15 + (rpm - RPM_IDLE) / (RPM_MAX - RPM_IDLE) * 85;
        const afr = 14.7 - (engineLoad / 100) * 3.5; // Richer under load
        
        const newDataPoint: SensorDataPoint = {
          time: now,
          rpm,
          speed,
          gear,
          fuelUsed: prev.fuelUsed + (rpm / RPM_MAX) * 0.005,
          inletAirTemp: 25 + (speed / SPEED_MAX) * 20,
          batteryVoltage: 13.8 + (rpm > 1000 ? 0.2 : 0) - (Math.random() * 0.1) - (isFaultActive ? 0.5 : 0),
          engineTemp: 90 + (rpm / RPM_MAX) * 15 + (simulatedFault > 0 ? 5 : 0),
          fuelTemp: 20 + (speed / SPEED_MAX) * 10,
          turboBoost: -0.8 + (rpm / RPM_MAX) * 2.8 * (gear / 6),
          fuelPressure: 3.5 + (rpm / RPM_MAX) * 2,
          oilPressure: 1.5 + (rpm / RPM_MAX) * 5.0 - (isFaultActive ? 0.5 : 0),
          shortTermFuelTrim: 2.0 + (Math.random() - 0.5) * 4 + simulatedFault,
          longTermFuelTrim: Math.min(10, longTermFuelTrim + (simulatedFault > 0 ? 0.01 : -0.005)),
          o2SensorVoltage: 0.1 + (0.5 + Math.sin(now / 500) * 0.4),
          engineLoad,
          distance: newDistance,
          gForce,
          latitude,
          longitude,
          afr,
          powerOutputKw,
          tireFL: 35.0 + (Math.random() - 0.5) * 0.1,
          tireFR: slowLeakTireRef.current, // The one with the slow leak
          tireRL: 35.2 + (Math.random() - 0.5) * 0.1,
          tireRR: 34.9 + (Math.random() - 0.5) * 0.1,
        };

        const updatedData = [...prevData, newDataPoint];
        if (updatedData.length > MAX_DATA_POINTS) {
          return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
        }
        return updatedData;
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (watcherId && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, [gpsData]); // Rerun effect if gpsData object changes

  return { data, latestData: data[data.length - 1], hasActiveFault };
};