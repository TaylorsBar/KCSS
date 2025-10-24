

import React, { useState } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';
import TuningSlider from '../components/tuning/TuningSlider';
import SensorChart from '../components/SensorChart';


const DEFAULT_TUNE = { fuelMap: 0, ignitionTiming: 0, boostPressure: 0 };

const engineChartLines = [
    { dataKey: 'rpm' as const, stroke: '#8884d8', name: 'RPM' },
    { dataKey: 'turboBoost' as const, stroke: '#82ca9d', name: 'Boost (bar)' },
    { dataKey: 'engineLoad' as const, stroke: '#ffc658', name: 'Load (%)' },
];

const fuelChartLines = [
     { dataKey: 'shortTermFuelTrim' as const, stroke: '#ff7300', name: 'STFT (%)' },
     { dataKey: 'longTermFuelTrim' as const, stroke: '#e60000', name: 'LTFT (%)' },
     { dataKey: 'o2SensorVoltage' as const, stroke: '#00c4ff', name: 'O2 Voltage (V)' },
];


const TuningPage: React.FC = () => {
    const data = useVehicleStore(state => state.data);
    const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
    const [tuneParams, setTuneParams] = useState(DEFAULT_TUNE);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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


    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
            {/* Left Panel: Sliders & Controls */}
            <div className="lg:col-span-2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2 mb-6">
                        <h1 className="text-xl font-bold text-gray-100 font-display">Tuning Suite</h1>
                        <div className="flex items-center space-x-2 bg-base-800 p-1 rounded-md">
                            <button onClick={() => setMode('sandbox')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'sandbox' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Sandbox</button>
                            <button onClick={() => setMode('live')} className={`px-3 py-1 text-sm font-semibold rounded ${mode === 'live' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Live</button>
                        </div>
                    </div>
                    <div className="space-y-4 mt-6">
                        <TuningSlider label="Fuel Map Enrichment" unit="%" value={tuneParams.fuelMap} min={-10} max={10} step={1} onChange={v => handleParamChange('fuelMap', v)} />
                        <TuningSlider label="Ignition Timing Advance" unit="°" value={tuneParams.ignitionTiming} min={-5} max={5} step={1} onChange={v => handleParamChange('ignitionTiming', v)} />
                        <TuningSlider label="Boost Pressure Increase" unit="PSI" value={tuneParams.boostPressure} min={0} max={8} step={0.1} onChange={v => handleParamChange('boostPressure', v)} />
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-brand-cyan/30">
                    <div className="flex gap-4">
                        <button onClick={() => setTuneParams(DEFAULT_TUNE)} className="flex-1 bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600 transition-colors">Reset</button>
                        <button className="flex-1 bg-gray-500 text-white font-semibold py-2 rounded-md hover:bg-gray-400 transition-colors">Save Tune</button>
                    </div>
                    <button onClick={handleWriteToEcu} disabled={mode !== 'live'} className="w-full bg-red-600 text-white font-semibold py-3 rounded-md hover:bg-red-500 transition-colors disabled:bg-red-900/50 disabled:cursor-not-allowed disabled:text-gray-400">
                        Write to ECU
                    </button>
                </div>
            </div>
            
            {/* Right Panel: Visualization */}
            <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                 <div className="flex-1 min-h-0">
                    <SensorChart data={data} lines={engineChartLines} title="Engine Performance" />
                </div>
                <div className="flex-1 min-h-0">
                    <SensorChart data={data} lines={fuelChartLines} title="Fuel & Air" />
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