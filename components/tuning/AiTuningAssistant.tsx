

import React, { useState } from 'react';
import { SensorDataPoint, AiTuningSuggestion } from '../../types/index';
import { getAiSuggestions } from '../../services/apiService';

interface AiTuningAssistantProps {
    latestData: SensorDataPoint;
}

const VitalStat: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline bg-base-800/50 p-2 rounded-md">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="font-mono text-lg text-white font-semibold">{value}</span>
    </div>
);

const AiTuningAssistant: React.FC<AiTuningAssistantProps> = ({ latestData }) => {
    const [suggestions, setSuggestions] = useState<AiTuningSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
            // Using mock/default values for now
            const mockSensors = { rpmLimit: 7200, boostTarget: 1.2, afrTarget: 11.5 };
            const mockContext = { ambientC: 22, altitudeM: 100, fuelOctane: 98 };
            const result = await getAiSuggestions(mockSensors, mockContext);
            setSuggestions(result);
        } catch (error) {
            console.error("Failed to fetch AI suggestions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
        if (risk === 'high') return 'border-red-500';
        if (risk === 'medium') return 'border-yellow-500';
        return 'border-green-500';
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-2">Live Vitals</h2>
                <div className="space-y-2">
                    <VitalStat label="RPM" value={latestData.rpm.toFixed(0)} />
                    <VitalStat label="Speed" value={`${latestData.speed.toFixed(0)} km/h`} />
                    <VitalStat label="Boost" value={`${latestData.turboBoost.toFixed(2)} bar`} />
                    <VitalStat label="AFR" value={latestData.afr.toFixed(1)} />
                    <VitalStat label="Engine Temp" value={`${latestData.engineTemp.toFixed(1)} °C`} />
                    <VitalStat label="Oil Pressure" value={`${latestData.oilPressure.toFixed(1)} bar`} />
                </div>
            </div>

            <div className="flex-grow flex flex-col">
                <h2 className="text-lg font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-2">AI Assistant</h2>
                <button
                    onClick={fetchSuggestions}
                    disabled={isLoading}
                    className="w-full bg-brand-cyan text-black font-semibold py-2 rounded-md hover:bg-cyan-300 transition-colors shadow-glow-cyan disabled:bg-base-700"
                >
                    {isLoading ? 'Analyzing...' : 'Get Suggestions'}
                </button>
                <div className="mt-4 flex-grow space-y-3 overflow-y-auto">
                    {suggestions.map((sug, i) => (
                        <div key={i} className={`p-3 bg-base-800/50 rounded-md border-l-4 ${getRiskColor(sug.risk)}`}>
                            <h4 className="font-semibold text-white">{sug.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{sug.rationale}</p>
                        </div>
                    ))}
                    {!isLoading && suggestions.length === 0 && (
                         <div className="text-center text-gray-500 pt-10">
                            Click button to get AI tuning suggestions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiTuningAssistant;