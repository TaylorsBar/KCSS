

import React, { useState, useEffect } from 'react';
import { useVehicleData } from '../hooks/useVehicleData';
import { generateComponentImage, getComponentTuningAnalysis } from '../services/geminiService';
import EngineDiagram from '../components/tuning/EngineDiagram';
import TuningSlider from '../components/tuning/TuningSlider';
import ReactMarkdown from 'react-markdown';


const DEFAULT_TUNE = { fuelMap: 0, ignitionTiming: 0, boostPressure: 0 };

// Component list for the inspector
const MOCK_COMPONENTS = [
    { id: 'turbo', name: 'Turbocharger' },
    { id: 'o2-sensor', name: 'O2 Sensor' },
    { id: 'map-sensor', name: 'MAP Sensor' },
    { id: 'intake', name: 'Air Intake / Throttle Body' },
    { id: 'coolant', name: 'Coolant System' },
    { id: 'oil-filter', name: 'Oil System' },
];

interface InspectionResult {
    imageUrl: string | null;
    analysis: string | null;
    error: string | null;
}

const TuningPage: React.FC = () => {
    const { latestData } = useVehicleData();
    const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
    const [tuneParams, setTuneParams] = useState(DEFAULT_TUNE);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // AI Inspector state
    const [selectedComponent, setSelectedComponent] = useState<string>('');
    const [isInspecting, setIsInspecting] = useState(false);
    const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);

    const handleParamChange = (param: keyof typeof tuneParams, value: number) => {
        setTuneParams(prev => ({ ...prev, [param]: value }));
    };

    const handleWriteToEcu = () => {
        if (mode === 'live') {
            setShowConfirmModal(true);
        }
    };
    
    const confirmWrite = () => {
        console.log("WRITING TO ECU:", tuneParams); // In a real app, this sends data to the vehicle
        setShowConfirmModal(false);
        // Add visual feedback like a success toast
    };

    useEffect(() => {
        const inspectComponent = async () => {
            if (!selectedComponent) return;

            const component = MOCK_COMPONENTS.find(c => c.id === selectedComponent);
            if (!component) return;

            setIsInspecting(true);
            setInspectionResult(null);

            try {
                const [imageUrl, analysis] = await Promise.all([
                    generateComponentImage(component.name),
                    getComponentTuningAnalysis(component.name, latestData)
                ]);
                setInspectionResult({ imageUrl, analysis, error: null });
            } catch (error) {
                console.error("Failed to inspect component:", error);
                setInspectionResult({ 
                    imageUrl: null, 
                    analysis: null, 
                    error: "Failed to generate AI analysis. Please check your connection." 
                });
            } finally {
                setIsInspecting(false);
            }
        };

        inspectComponent();
    }, [selectedComponent]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Tuning Panel */}
            <div className="w-full lg:w-2/3 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2 mb-6">
                    <h1 className="text-xl font-bold text-gray-100 font-display">Tuning Suite</h1>
                    <div className="flex items-center space-x-2 bg-base-800 p-1 rounded-md">
                        <button onClick={() => setMode('sandbox')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'sandbox' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Sandbox Mode</button>
                        <button onClick={() => setMode('live')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'live' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Live Mode</button>
                    </div>
                </div>
                
                <div className="flex-grow flex flex-col items-center justify-center">
                    <EngineDiagram />
                </div>

                <div className="space-y-4 mt-6">
                    <TuningSlider label="Fuel Map Enrichment" unit="%" value={tuneParams.fuelMap} min={-10} max={10} step={1} onChange={v => handleParamChange('fuelMap', v)} />
                    <TuningSlider label="Ignition Timing Advance" unit="°" value={tuneParams.ignitionTiming} min={-5} max={5} step={1} onChange={v => handleParamChange('ignitionTiming', v)} />
                    <TuningSlider label="Boost Pressure Increase" unit="PSI" value={tuneParams.boostPressure} min={0} max={8} step={0.1} onChange={v => handleParamChange('boostPressure', v)} />
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-brand-cyan/30">
                    <button onClick={() => setTuneParams(DEFAULT_TUNE)} className="flex-1 bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600 transition-colors">Reset to Default</button>
                    <button className="flex-1 bg-gray-500 text-white font-semibold py-2 rounded-md hover:bg-gray-400 transition-colors">Save Tune Profile</button>
                    <button onClick={handleWriteToEcu} disabled={mode !== 'live'} className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-500 transition-colors disabled:bg-red-900/50 disabled:cursor-not-allowed disabled:text-gray-400">
                        Write to ECU
                    </button>
                </div>

            </div>

            {/* AI Inspector Panel */}
            <div className="w-full lg:w-1/3 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-4 font-display">AI Component Inspector</h2>
                <div className="space-y-4 flex-grow flex flex-col">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Component</label>
                        <select value={selectedComponent} onChange={e => setSelectedComponent(e.target.value)} className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200">
                            <option value="" disabled>-- Inspect a part --</option>
                            {MOCK_COMPONENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex-grow mt-4 p-4 bg-base-800/50 rounded-md space-y-3 overflow-y-auto">
                        {!selectedComponent && (
                             <div className="text-center text-gray-500 h-full flex items-center justify-center">
                                Select a component to generate a real-time AI analysis.
                            </div>
                        )}
                        {isInspecting && (
                            <div className="space-y-4 animate-pulse">
                                <div className="w-full h-48 bg-base-700 rounded-md"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-base-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-base-700 rounded w-1/2"></div>
                                    <div className="h-4 bg-base-700 rounded w-5/6"></div>
                                </div>
                            </div>
                        )}
                        {inspectionResult && (
                            <div className="animate-fade-in space-y-4">
                                {inspectionResult.error && <p className="text-red-400">{inspectionResult.error}</p>}
                                {inspectionResult.imageUrl && (
                                    <img src={inspectionResult.imageUrl} alt="AI Generated Component" className="w-full h-auto rounded-md border-2 border-brand-cyan/50" />
                                )}
                                {inspectionResult.analysis && (
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown>{inspectionResult.analysis}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
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