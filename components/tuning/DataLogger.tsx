import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import SensorChart from '../SensorChart';
import { SensorDataPoint } from '../../types';

const SENSORS_TO_LOG: { key: keyof SensorDataPoint, name: string, color: string }[] = [
    { key: 'rpm', name: 'RPM', color: '#FF00FF' },
    { key: 'turboBoost', name: 'Boost (bar)', color: '#00FFFF' },
    { key: 'afr', name: 'AFR', color: '#00FF00' },
    { key: 'engineTemp', name: 'Coolant (°C)', color: '#FF7F00' },
    { key: 'oilPressure', name: 'Oil (bar)', color: '#FFFF00' },
];

const DataLogger: React.FC = () => {
    const { data } = useVehicleData();
    const [isLogging, setIsLogging] = useState(false);
    const [loggedData, setLoggedData] = useState<SensorDataPoint[]>([]);
    const [selectedSensors, setSelectedSensors] = useState<Array<keyof SensorDataPoint>>(['rpm', 'turboBoost', 'afr']);
    const latestDataPoint = data[data.length - 1];

    useEffect(() => {
        if (isLogging && latestDataPoint) {
            setLoggedData(prev => {
                const newData = [...prev, latestDataPoint];
                // Keep the log to a reasonable size for performance
                if (newData.length > 1000) {
                    return newData.slice(newData.length - 1000);
                }
                return newData;
            });
        }
    }, [isLogging, latestDataPoint]);

    const handleToggleSensor = (key: keyof SensorDataPoint) => {
        setSelectedSensors(prev =>
            prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
        );
    };

    const chartLines = SENSORS_TO_LOG
        .filter(s => selectedSensors.includes(s.key))
        .map(s => ({ dataKey: s.key, stroke: s.color, name: s.name }));

    return (
        <div className="h-full flex gap-4">
            <div className="w-48 flex-shrink-0 flex flex-col gap-2">
                 <h3 className="text-md font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-1 mb-1">Controls</h3>
                 <button
                    onClick={() => setIsLogging(prev => !prev)}
                    className={`w-full font-semibold py-2 rounded-md text-sm ${isLogging ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                 >
                     {isLogging ? 'Stop Logging' : 'Start Logging'}
                 </button>
                 <button
                    onClick={() => setLoggedData([])}
                    className="w-full bg-base-700 text-white font-semibold py-2 rounded-md text-sm"
                 >
                     Clear Log
                 </button>
                 <h3 className="text-md font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-1 mb-1 pt-2">Channels</h3>
                 <div className="flex flex-col gap-1">
                    {SENSORS_TO_LOG.map(sensor => (
                         <label key={sensor.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                             <input
                                type="checkbox"
                                checked={selectedSensors.includes(sensor.key)}
                                onChange={() => handleToggleSensor(sensor.key)}
                                className="w-4 h-4 rounded accent-brand-cyan"
                             />
                             <span style={{ color: sensor.color }}>■</span>
                             <span>{sensor.name}</span>
                         </label>
                    ))}
                 </div>
            </div>
            <div className="flex-grow h-full">
                <SensorChart
                    title="Live Data Log"
                    data={loggedData}
                    lines={chartLines}
                />
            </div>
        </div>
    );
};

export default DataLogger;
