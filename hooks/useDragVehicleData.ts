
import { useState, useEffect, useRef } from 'react';
import { SensorDataPoint } from '../types';

const UPDATE_INTERVAL_MS = 20; // 50Hz
const MAX_DATA_POINTS = 1000; // Store enough data for a full 1/4 mile run
const RPM_IDLE = 800;
const RPM_MAX = 8000;
const GEAR_RATIOS = [0, 3.8, 2.2, 1.5, 1.1, 0.9, 0.7]; // Aggressive ratios
const SHIFT_RPM = 7500;

const generateInitialData = (): SensorDataPoint => ({
    time: performance.now(),
    rpm: RPM_IDLE,
    speed: 0,
    gear: 1,
    fuelUsed: 0,
    inletAirTemp: 30.0,
    batteryVoltage: 13.8,
    engineTemp: 90.0,
    fuelTemp: 25.0,
    turboBoost: -0.5,
    fuelPressure: 3.5,
    oilPressure: 2.0,
    shortTermFuelTrim: 0,
    longTermFuelTrim: 0,
    o2SensorVoltage: 0.45,
    engineLoad: 10,
    distance: 0,
    gForce: 0,
    latitude: -37.88,
    longitude: 175.55,
});

export const useDragVehicleData = ({ isLaunched, isNosActive }: { isLaunched: boolean; isNosActive: boolean; }) => {
    const [data, setData] = useState<SensorDataPoint[]>(() => [generateInitialData()]);
    const [nosLevel, setNosLevel] = useState(100);
    const lastUpdate = useRef<number>(performance.now());
    
    useEffect(() => {
        if (!isLaunched) {
            setData([generateInitialData()]);
            return; // Stop simulation if not launched
        }

        const interval = setInterval(() => {
            const now = performance.now();
            const deltaTimeSeconds = (now - lastUpdate.current) / 1000.0;
            lastUpdate.current = now;

            setData(prevData => {
                const prev = prevData[prevData.length - 1];
                let { rpm, speed, gear, distance } = prev;

                // NOS Logic
                let nosPowerMultiplier = 1.0;
                if (isNosActive && nosLevel > 0) {
                    nosPowerMultiplier = 1.4; // 40% power boost
                    setNosLevel(nl => Math.max(0, nl - 100 * deltaTimeSeconds / 5)); // Deplete over 5 seconds
                }

                // Physics Simulation
                if (rpm > SHIFT_RPM && gear < GEAR_RATIOS.length - 1) {
                    gear++;
                    rpm *= 0.7; // RPM drop on shift
                }
                
                const enginePower = (rpm / RPM_MAX) * nosPowerMultiplier;
                rpm += (5000 * enginePower) * deltaTimeSeconds;
                
                rpm = Math.max(RPM_IDLE, Math.min(rpm, RPM_MAX));
                speed += (enginePower * 20 / gear) * deltaTimeSeconds;
                speed = Math.max(0, speed);
                
                const speedMetersPerSecond = speed * (1000 / 3600);
                const prevSpeedMetersPerSecond = prev.speed * (1000 / 3600);
                const acceleration = (speedMetersPerSecond - prevSpeedMetersPerSecond) / deltaTimeSeconds;
                
                const newDistance = distance + (speedMetersPerSecond * deltaTimeSeconds);

                const newDataPoint: SensorDataPoint = {
                    time: now,
                    rpm,
                    speed,
                    gear,
                    fuelUsed: prev.fuelUsed + enginePower * 0.01,
                    inletAirTemp: 30 + (speed / 200) * 30,
                    batteryVoltage: 13.8,
                    engineTemp: 90 + enginePower * 15,
                    fuelTemp: 25,
                    turboBoost: Math.min(2.0, -0.5 + (rpm / RPM_MAX) * 3.0),
                    fuelPressure: 3.5 + enginePower * 2.5,
                    oilPressure: 2.0 + (rpm / RPM_MAX) * 5.0,
                    shortTermFuelTrim: 0,
                    longTermFuelTrim: 0,
                    o2SensorVoltage: 0.8,
                    engineLoad: 10 + enginePower * 90,
                    distance: newDistance,
                    gForce: acceleration / 9.81,
                    latitude: prev.latitude,
                    longitude: prev.longitude,
                };
                
                const updatedData = [...prevData, newDataPoint];
                if (updatedData.length > MAX_DATA_POINTS) {
                    return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
                }
                return updatedData;
            });

        }, UPDATE_INTERVAL_MS);

        return () => clearInterval(interval);

    }, [isLaunched, isNosActive, nosLevel]);

    const reset = () => {
        setData([generateInitialData()]);
        setNosLevel(100);
    }

    return { data, latestData: data[data.length - 1], nosLevel, reset };
};
