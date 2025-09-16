
import React, { useState, useCallback } from 'react';
import { useVehicleData } from '../hooks/useVehicleData';
import { AiTuningSuggestion, SensorDataPoint } from '../types';
import { getAiSuggestions, prewriteCheck, logToHederaAndPolygon, issueServiceVC } from '../services/apiService';
import EngineDiagram from '../components/tuning/EngineDiagram';
import TuningSlider from '../components/tuning/TuningSlider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Default base tune parameters
const DEFAULT_TUNE = { 
    fuelMap: 0, 
    ignitionTiming: 0, 
    boostPressure: 0,
    // Add other relevant parameters for suggestions/checks
    rpmLimit: 7200,
    boostTarget: 1.2,
    afrTarget: 11.5,
};

const LiveDataReadout: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="text-right">
        <div className="text-xs text-gray-400 uppercase">{label}</div>
        <div className="text-lg font-mono text-white">{value}</div>
    </div>
);

const availableChannels: { key: keyof SensorDataPoint; name: string; color: string }[] = [
    { key: 'rpm', name: 'RPM', color: '#00FFFF' },
    { key: 'turboBoost', name: 'Boost (bar)', color: '#FF00FF' },
    { key: 'engineLoad', name: 'Load (%)', color: '#00FF00' },
    { key: 'oilPressure', name: 'Oil (bar)', color: '#FFA500' },
    { key: 'inletAirTemp', name: 'IAT (°C)', color: '#FFFFFF' },
    { key: 'o2SensorVoltage', name: 'O2 (V)', color: '#FF0000' },
];

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

    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<AiTuningSuggestion[] | null>(null);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const [activeChannels, setActiveChannels] = useState<Array<keyof SensorDataPoint>>(['rpm', 'turboBoost']);

    // State for the write process modal
    const [isWriting, setIsWriting] = useState(false);
    const [writeStatus, setWriteStatus] = useState<string[]>([]);
    const [writeError, setWriteError] = useState<string | null>(null);

    const handleParamChange = useCallback((param: keyof typeof tuneParams, value: number) => {
        setTuneParams(prev => ({ ...prev, [param]: value }));
    }, []);
    
    const handleGetSuggestion = useCallback(async () => {
        setIsGenerating(true);
        setSuggestions(null);
        setSuggestionError(null);
        try {
            const context = { ambientC: 22, altitudeM: 150, fuelOctane: 93 }; // Mock context
            const result = await getAiSuggestions(tuneParams, context);
            setSuggestions(result);
        } catch (error) {
            console.error(error);
            setSuggestionError("Failed to get AI suggestion. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }, [tuneParams]);
    
    const handleApplySuggestion = useCallback((suggestion: AiTuningSuggestion) => {
        const newParams = { ...tuneParams };
        suggestion.changes.forEach(change => {
            if (change.key in newParams) {
                (newParams as any)[change.key] = change.to;
            }
        });
        setTuneParams(newParams);
    }, [tuneParams]);

    const handleWriteToEcu = useCallback(() => {
        if (mode === 'live') {
            setShowConfirmModal(true);
            setWriteStatus([]);
            setWriteError(null);
        }
    }, [mode]);
    
    const confirmWrite = useCallback(async () => {
        setIsWriting(true);
        setWriteError(null);
        setWriteStatus([]);

        try {
            // Step 1: Pre-write Check
            setWriteStatus(prev => [...prev, "1. Performing pre-write safety checks..."]);
            const checkResult = await prewriteCheck(tuneParams);
            if (!checkResult.ok || !checkResult.audit) {
                throw new Error(checkResult.reason || "Pre-write check failed for an unknown reason.");
            }
            setWriteStatus(prev => [...prev, "✅ Pre-write check passed."]);
            
            // Step 2: Log to DLT
            setWriteStatus(prev => [...prev, "2. Logging tune signature to Hedera & Polygon..."]);
            const dltResult = await logToHederaAndPolygon(checkResult.audit);
            console.log("DLT Result:", dltResult);
            setWriteStatus(prev => [...prev, "✅ Audit trail secured on DLT."]);

            // Step 3: Issue Verifiable Credential
            setWriteStatus(prev => [...prev, "3. Issuing Verifiable Credential for service..."]);
            const vcResult = await issueServiceVC(checkResult.audit.hash);
            console.log("VC Result:", vcResult);
            setWriteStatus(prev => [...prev, "✅ Service credential issued."]);

            // Final Step: "Write" to ECU
            console.log("WRITING TO ECU:", tuneParams);
            setWriteStatus(prev => [...prev, "🚀 Tune successfully written to ECU!"]);

            setTimeout(() => setShowConfirmModal(false), 2000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setWriteError(errorMessage);
        } finally {
            setIsWriting(false);
        }
    }, [tuneParams]);
    
    const handleChannelToggle = useCallback((channelKey: keyof SensorDataPoint) => {
        setActiveChannels(prev => {
            if (prev.includes(channelKey)) return prev.filter(c => c !== channelKey);
            return prev.length < 4 ? [...prev, channelKey] : prev;
        });
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
            {/* Left Column */}
            <div className="w-full lg:w-1/2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <h1 className="text-xl font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-4">Engine Bay</h1>
                <EngineDiagram />
                <div className="mt-6 pt-4 border-t border-brand-cyan/30">
                    <h2 className="text-lg font-semibold font-display mb-4">AI Tuning Assistant</h2>
                    <button onClick={handleGetSuggestion} disabled={isGenerating} className="w-full bg-brand-pink text-black font-semibold py-2 rounded-md hover:bg-fuchsia-500 transition-colors shadow-glow-pink disabled:bg-base-700 disabled:text-gray-400">
                        {isGenerating ? 'Analyzing Current Tune...' : "Get AI Suggestions"}
                    </button>
                    {suggestionError && <p className="text-red-400 mt-2 text-sm">{suggestionError}</p>}
                    {suggestions && (
                        <div className="mt-4 p-4 bg-base-800/50 rounded-md animate-fade-in space-y-4">
                           {suggestions.map((sug, i) => (
                               <div key={i} className="border-b border-base-700 last:border-b-0 pb-3 last:pb-0">
                                   <h4 className="font-semibold text-brand-cyan">{sug.title} <span className="text-xs text-gray-400 capitalize">({sug.risk} Risk)</span></h4>
                                   <p className="text-sm text-gray-300 my-1">{sug.rationale}</p>
                                   {sug.changes.length > 0 && (
                                       <button onClick={() => handleApplySuggestion(sug)} className="text-xs bg-brand-cyan/20 text-brand-cyan font-semibold py-1 px-2 rounded-md hover:bg-brand-cyan/40 mt-1">
                                           Apply This Suggestion
                                       </button>
                                   )}
                               </div>
                           ))}
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
                    <TuningSlider label="RPM Limit" unit="" value={tuneParams.rpmLimit} min={6000} max={8500} step={50} onChange={v => handleParamChange('rpmLimit', v)} />
                    <TuningSlider label="Boost Target" unit="bar" value={tuneParams.boostTarget} min={0.8} max={2.0} step={0.05} onChange={v => handleParamChange('boostTarget', v)} />
                    <TuningSlider label="AFR Target" unit="" value={tuneParams.afrTarget} min={10.0} max={14.7} step={0.1} onChange={v => handleParamChange('afrTarget', v)} />
                </div>
                <div className="flex gap-4 pt-2">
                    <button onClick={() => setTuneParams(DEFAULT_TUNE)} className="flex-1 bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600">Reset</button>
                    <button onClick={handleWriteToEcu} disabled={mode !== 'live'} className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-500 disabled:bg-red-900/50 disabled:text-gray-400">Write to ECU</button>
                </div>
                <div className="flex-grow flex flex-col pt-4 border-t border-brand-cyan/30 min-h-0">
                    <h2 className="text-lg font-semibold font-display mb-2">Live Data Visualization</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {availableChannels.map(channel => (
                            <button key={channel.key} onClick={() => handleChannelToggle(channel.key as keyof SensorDataPoint)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeChannels.includes(channel.key) ? 'bg-brand-cyan text-black shadow-glow-cyan' : 'bg-base-700 text-gray-300 hover:bg-base-600'}`}>{channel.name}</button>
                        ))}
                    </div>
                    <div className="flex-grow bg-base-800/50 rounded-md p-2 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D42" />
                                <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} stroke="#7F7F98" tick={{fontSize: 10}} />
                                <YAxis stroke="#7F7F98" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }}/>
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                                {availableChannels.filter(c => activeChannels.includes(c.key)).map(c => <Line key={c.key} type="monotone" dataKey={c.key} name={c.name} stroke={c.color} strokeWidth={2} dot={false} animationDuration={300} />)}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {showConfirmModal && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg bg-base-900 rounded-lg border-2 border-red-500 shadow-lg p-6">
                        <h2 className="text-2xl font-bold font-display text-red-500">LIVE TUNE CONFIRMATION</h2>
                        {writeError ? (
                            <>
                                <p className="mt-4 text-gray-300">The ECU write failed for the following reason:</p>
                                <div className="mt-2 p-3 bg-red-900/30 text-red-300 rounded-md">{writeError}</div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-md bg-base-700 text-white font-semibold hover:bg-base-600">Close</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="mt-4 text-gray-300">You are about to write new parameters to the ECU. Please review the safety and audit process below.</p>
                                <div className="mt-4 space-y-2 font-mono text-sm text-gray-400">
                                    {writeStatus.map((status, i) => <p key={i}>{status}</p>)}
                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={() => setShowConfirmModal(false)} disabled={isWriting} className="px-6 py-2 rounded-md bg-base-700 text-white font-semibold hover:bg-base-600 disabled:opacity-50">Cancel</button>
                                    <button onClick={confirmWrite} disabled={isWriting} className="px-6 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50">
                                        {isWriting ? 'Writing...' : 'Confirm & Write'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TuningPage;