
import { useState, useEffect, useRef, useCallback } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';
import { SensorDataPoint, LapTime, RaceSession } from '../types';

const QUARTER_MILE_METERS = 402.336;
const KPH_PER_MPH = 1.60934;
const TARGETS_KPH = {
    '100kmh': 100,
    '200kmh': 200,
    '30mph': 30 * KPH_PER_MPH,
    '60mph': 60 * KPH_PER_MPH,
    '130mph': 130 * KPH_PER_MPH,
};

const initialSessionState: RaceSession = {
    isActive: false,
    startTime: null,
    elapsedTime: 0,
    data: [],
    lapTimes: [],
    gpsPath: [],
    zeroToHundredKmhTime: null,
    zeroToSixtyMphTime: null,
    sixtyToHundredThirtyMphTime: null,
    hundredToTwoHundredKmhTime: null,
    quarterMileTime: null,
    quarterMileSpeed: null,
    _internal: {
        startDataPoint: null,
        crossingTimes: {},
    }
};

const interpolateTime = (p1: SensorDataPoint, p2: SensorDataPoint, targetSpeed: number): number => {
    if (p2.speed === p1.speed) return p2.time;
    const fraction = (targetSpeed - p1.speed) / (p2.speed - p1.speed);
    return p1.time + (p2.time - p1.time) * fraction;
};

export const useRaceSession = () => {
    const latestData = useVehicleStore(state => state.latestData);
    const [session, setSession] = useState<RaceSession>(initialSessionState);
    const sessionUpdateRef = useRef<number | null>(null);

    const updateSession = useCallback(() => {
        if (!session.isActive || !session.startTime) {
            if (sessionUpdateRef.current) cancelAnimationFrame(sessionUpdateRef.current);
            return;
        }

        setSession(prev => {
            if (!prev.isActive || !prev.startTime) return prev;
            
            const prevPoint = prev.data[prev.data.length - 1] || latestData;
            const now = performance.now();
            const elapsedTime = now - prev.startTime;
            const newData = [...prev.data, latestData];
            const newGpsPath = [...prev.gpsPath, { latitude: latestData.latitude, longitude: latestData.longitude }];

            let { _internal, ...benchmarks } = prev;

            // --- BENCHMARK LOGIC ---
            if (prevPoint.speed < 1 && latestData.speed > 1 && !_internal.startDataPoint) {
                _internal.startDataPoint = latestData;
            }

            if (_internal.startDataPoint) {
                const startTime = _internal.startDataPoint.time;
                
                const checkBenchmark = (targetKey: keyof typeof TARGETS_KPH, fieldKey: keyof Omit<RaceSession, 'data' | '_internal' | 'isActive' | 'startTime' | 'elapsedTime' | 'lapTimes' | 'gpsPath'>) => {
                    if (!benchmarks[fieldKey] && prevPoint.speed < TARGETS_KPH[targetKey] && latestData.speed >= TARGETS_KPH[targetKey]) {
                        const crossingTime = interpolateTime(prevPoint, latestData, TARGETS_KPH[targetKey]);
                        _internal.crossingTimes[targetKey] = crossingTime;
                        // @ts-ignore
                        benchmarks[fieldKey] = (crossingTime - startTime) / 1000;
                    }
                };
                
                checkBenchmark('100kmh', 'zeroToHundredKmhTime');
                checkBenchmark('60mph', 'zeroToSixtyMphTime');
                
                // Interval benchmarks
                // 60-130 mph
                if (!_internal.crossingTimes['60mph'] && prevPoint.speed < TARGETS_KPH['60mph'] && latestData.speed >= TARGETS_KPH['60mph']) {
                     _internal.crossingTimes['60mph'] = interpolateTime(prevPoint, latestData, TARGETS_KPH['60mph']);
                }
                if (_internal.crossingTimes['60mph'] && !benchmarks.sixtyToHundredThirtyMphTime && prevPoint.speed < TARGETS_KPH['130mph'] && latestData.speed >= TARGETS_KPH['130mph']) {
                    const crossingTime = interpolateTime(prevPoint, latestData, TARGETS_KPH['130mph']);
                    benchmarks.sixtyToHundredThirtyMphTime = (crossingTime - _internal.crossingTimes['60mph']!) / 1000;
                }

                // 100-200 km/h
                if (!_internal.crossingTimes['100kmh'] && prevPoint.speed < TARGETS_KPH['100kmh'] && latestData.speed >= TARGETS_KPH['100kmh']) {
                     _internal.crossingTimes['100kmh'] = interpolateTime(prevPoint, latestData, TARGETS_KPH['100kmh']);
                }
                if (_internal.crossingTimes['100kmh'] && !benchmarks.hundredToTwoHundredKmhTime && prevPoint.speed < TARGETS_KPH['200kmh'] && latestData.speed >= TARGETS_KPH['200kmh']) {
                    const crossingTime = interpolateTime(prevPoint, latestData, TARGETS_KPH['200kmh']);
                    benchmarks.hundredToTwoHundredKmhTime = (crossingTime - _internal.crossingTimes['100kmh']!) / 1000;
                }

                // 1/4 mile
                if (!benchmarks.quarterMileTime && prevPoint.distance < QUARTER_MILE_METERS && latestData.distance >= QUARTER_MILE_METERS) {
                    const crossingTime = interpolateTime(prevPoint, latestData, QUARTER_MILE_METERS);
                    benchmarks.quarterMileTime = (crossingTime - startTime) / 1000;
                    benchmarks.quarterMileSpeed = latestData.speed;
                }
            }

            return {
                ...prev,
                ...benchmarks,
                _internal,
                elapsedTime,
                data: newData,
                gpsPath: newGpsPath,
            };
        });

        sessionUpdateRef.current = requestAnimationFrame(updateSession);
    }, [session.isActive, session.startTime, latestData]);
    
    useEffect(() => {
        if (session.isActive) {
            sessionUpdateRef.current = requestAnimationFrame(updateSession);
        } else {
            if (sessionUpdateRef.current) cancelAnimationFrame(sessionUpdateRef.current);
        }
        return () => {
            if (sessionUpdateRef.current) cancelAnimationFrame(sessionUpdateRef.current);
        };
    }, [session.isActive, updateSession]);


    const startSession = () => {
        setSession({
            ...initialSessionState,
            isActive: true,
            startTime: performance.now(),
            data: [latestData],
            gpsPath: [{latitude: latestData.latitude, longitude: latestData.longitude}]
        });
    };

    const stopSession = () => {
        setSession(prev => ({ ...prev, isActive: false }));
    };

    const recordLap = () => {
        if (!session.isActive || !session.startTime || session.elapsedTime < 1000) return;
        const lastLapTotalTime = session.lapTimes.reduce((sum, lap) => sum + lap.time, 0);
        const lapTime = session.elapsedTime - lastLapTotalTime;
        setSession(prev => ({
            ...prev,
            lapTimes: [...prev.lapTimes, { lap: prev.lapTimes.length + 1, time: lapTime }],
        }));
    };

    return { session, startSession, stopSession, recordLap };
};