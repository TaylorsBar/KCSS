
import React, { useState } from 'react';
import { useVehicleData } from '../hooks/useVehicleData';
import { getTuningSuggestion } from '../services/geminiService';
import { TuningSuggestion, SensorDataPoint } from '../types';
import EngineDiagram from '../components/tuning/EngineDiagram';
import TuningSlider from '../components/tuning/TuningSlider';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';


const DEFAULT_TUNE = { fuelMap: 0, ignitionTiming: 0, boostPressure: 0 };

const LiveDataReadout: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-right">
        <div className="text-xs text-gray-400 uppercase">{label}</div>
        <div className="text-lg font-mono text-white">{value}</div>
    </div>
);

// Define available channels for the new data visualization chart
const availableChannels: { key: keyof SensorDataPoint; name: string; color: string }[] = [
    { key: 'rpm', name: 'RPM', color: '#00FFFF' },
    { key: 'turboBoost', name: 'Boost (bar)', color: '#FF00FF' },
    { key: 'engineLoad', name: 'Load (%)', color: '#00FF00' },
    { key: 'oilPressure', name: 'Oil (bar)', color: '#FFA500' },
    { key: 'inletAirTemp', name: 'IAT (°C)', color: '#FFFFFF' },
    { key: 'o2SensorVoltage', name: 'O2 (V)', color: '#FF0000' },
];

// Custom Tooltip for the chart
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-900/80 backdrop-blur-sm p-2 border border-base-700 rounded-md shadow-lg">
        <p className="label text-sm text-gray-400">{`${new Date(label).toLocaleTimeString()}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }} className="text-xs font-mono">{`${pld.name}: ${pld.value.toFixed(2)}`}</p>
        ))}
      </div>
    );
  }
  return null;
};


const TuningPage: React.FC = () => {
    const { latestData, data } = useVehicleData();
    const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
    const [tuneParams, setTuneParams] = useState(DEFAULT_TUNE);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // AI Tuning Assistant state
    const [drivingStyle, setDrivingStyle] = useState('Street Performance');
    const [conditions, setConditions] = useState('Normal, dry roads');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestion, setSuggestion] = useState<TuningSuggestion | null>(null);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    // Data Visualization state
    const [activeChannels, setActiveChannels] = useState<Array<keyof SensorDataPoint>>(['rpm', 'turboBoost']);

    const handleParamChange = (param: keyof typeof tuneParams, value: number) => {
        setTuneParams(prev => ({ ...prev, [param]: value }));
    };
    
    const handleGetSuggestion = async () => {
        setIsGenerating(true);
        setSuggestion(null);
        setSuggestionError(null);
        try {
            const result = await getTuningSuggestion(latestData, drivingStyle, conditions);
            setSuggestion(result);
        } catch (error) {
            console.error(error);
            setSuggestionError("Failed to get AI suggestion. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleApplySuggestion = () => {
        if (suggestion) {
            setTuneParams(suggestion.suggestedParams);
        }
    };

    const handleWriteToEcu = () => {
        if (mode === 'live') {
            setShowConfirmModal(true);
        }
    };
    
    const confirmWrite = () => {
        console.log("WRITING TO ECU:", tuneParams);
        setShowConfirmModal(false);
    };
    
    const handleChannelToggle = (channelKey: keyof SensorDataPoint) => {
        setActiveChannels(prev => {
            if (prev.includes(channelKey)) {
                return prev.filter(c => c !== channelKey);
            }
            if (prev.length < 4) { // Limit to 4 active channels for readability
                return [...prev, channelKey];
            }
            return prev; // Do not add more than 4
        });
    };


    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
            {/* Left Column */}
            <div className="w-full lg:w-1/2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <h1 className="text-xl font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-4">Engine Bay</h1>
                <EngineDiagram />

                <div className="mt-6 pt-4 border-t border-brand-cyan/30">
                    <h2 className="text-lg font-semibold font-display mb-4">AI Tuning Assistant</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Driving Style</label>
                            <select value={drivingStyle} onChange={e => setDrivingStyle(e.target.value)} className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200">
                                <option>Street Performance</option>
                                <option>Track Day</option>
                                <option>Fuel Economy</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Conditions</label>
                            <input type="text" value={conditions} onChange={e => setConditions(e.target.value)} className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200" />
                        </div>
                    </div>
                    <button onClick={handleGetSuggestion} disabled={isGenerating} className="w-full bg-brand-blue text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue disabled:bg-base-700">
                        {isGenerating ? 'Generating Tune...' : "Get KC's Suggestion"}
                    </button>
                    {suggestionError && <p className="text-red-400 mt-2 text-sm">{suggestionError}</p>}
                    {suggestion && (
                        <div className="mt-4 p-4 bg-base-800/50 rounded-md animate-fade-in space-y-3">
                            <div>
                                <h4 className="font-semibold text-brand-cyan">Predicted Gains:</h4>
                                <p className="text-sm text-gray-300">{suggestion.analysis.predictedGains}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-brand-cyan">Potential Risks:</h4>
                                <p className="text-sm text-gray-300">{suggestion.analysis.potentialRisks}</p>
                            </div>
                            <button onClick={handleApplySuggestion} className="w-full bg-brand-cyan text-black font-semibold py-2 rounded-md hover:bg-cyan-300 transition-colors">Apply Suggested Tune</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-1/2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col space-y-4">
                <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2">
                    <h1 className="text-xl font-bold text-gray-100 font-display">ECU Control</h1>
                    <div className="flex items-center space-x-2 bg-base-800 p-1 rounded-md">
                        <button onClick={() => setMode('sandbox')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'sandbox' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Sandbox</button>
                        <button onClick={() => setMode('live')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'live' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Live</button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 bg-base-800/50 p-2 rounded-md">
                    <LiveDataReadout label="RPM" value={latestData.rpm.toFixed(0)} />
                    <LiveDataReadout label="Boost" value={`${latestData.turboBoost.toFixed(2)} bar`} />
                    <LiveDataReadout label="Load" value={`${latestData.engineLoad.toFixed(1)}%`} />
                    <LiveDataReadout label="IAT" value={`${latestData.inletAirTemp.toFixed(1)}°C`} />
                </div>

                <div className="space-y-4">
                    <TuningSlider label="Fuel Map Enrichment" unit="%" value={tuneParams.fuelMap} min={-10} max={10} step={1} onChange={v => handleParamChange('fuelMap', v)} />
                    <TuningSlider label="Ignition Timing Advance" unit="°" value={tuneParams.ignitionTiming} min={-5} max={5} step={1} onChange={v => handleParamChange('ignitionTiming', v)} />
                    <TuningSlider label="Boost Pressure Increase" unit="PSI" value={tuneParams.boostPressure} min={0} max={8} step={0.1} onChange={v => handleParamChange('boostPressure', v)} />
                </div>

                <div className="flex gap-4 pt-2">
                    <button onClick={() => setTuneParams(DEFAULT_TUNE)} className="flex-1 bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600">Reset</button>
                    <button onClick={handleWriteToEcu} disabled={mode !== 'live'} className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-500 disabled:bg-red-900/50 disabled:text-gray-400">Write to ECU</button>
                </div>
                
                {/* Data Visualization System */}
                <div className="flex-grow flex flex-col pt-4 border-t border-brand-cyan/30 min-h-0">
                    <h2 className="text-lg font-semibold font-display mb-2">Live Data Visualization</h2>
                     <div className="flex flex-wrap gap-2 mb-2">
                        {availableChannels.map(channel => {
                            const isActive = activeChannels.includes(channel.key);
                            return (
                                <button 
                                    key={channel.key} 
                                    onClick={() => handleChannelToggle(channel.key as keyof SensorDataPoint)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isActive ? 'bg-brand-cyan text-black shadow-glow-cyan' : 'bg-base-700 text-gray-300 hover:bg-base-600'}`}
                                >
                                    {channel.name}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex-grow bg-base-800/50 rounded-md p-2 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" />
                                <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} stroke="#7F7F98" tick={{fontSize: 10}} />
                                <YAxis stroke="#7F7F98" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                                {availableChannels
                                    .filter(channel => activeChannels.includes(channel.key))
                                    .map(channel => (
                                        <Line key={channel.key} type="monotone" dataKey={channel.key} name={channel.name} stroke={channel.color} strokeWidth={2} dot={false} animationDuration={300} />
                                    ))
                                }
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {showConfirmModal && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg bg-base-900 rounded-lg border-2 border-red-500 shadow-lg p-6">
                        <h2 className="text-2xl font-bold font-display text-red-500">LIVE TUNE WARNING</h2>
                        <p className="mt-4 text-gray-300">You are about to write new parameters directly to the vehicle's ECU. Incorrect values can cause severe engine damage.</p>
                        <p className="mt-2 font-semibold text-yellow-400">This action should only be performed by a professional tuner on a dynamometer.</p>
                        <p className="mt-4 text-gray-300">Are you absolutely sure you want to proceed?</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-md bg-base-700 text-white font-semibold hover:bg-base-600">Cancel</button>
                            <button onClick={confirmWrite} className="px-6 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500">Confirm & Write Tune</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TuningPage;
