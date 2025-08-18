
import React, { useState, useCallback, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { useVehicleData } from '../hooks/useVehicleData';
import { getTuningSuggestion } from '../services/geminiService';
import { TuningSuggestion } from '../types';

interface TuningParams {
  fuelMap: number;
  ignitionTiming: number;
  boostPressure: number;
}

const TuningSandbox: React.FC = () => {
  const [params, setParams] = useState<TuningParams>({
    fuelMap: 0,
    ignitionTiming: 0,
    boostPressure: 0,
  });

  const [predicted, setPredicted] = useState({
    torque: 480,
    power: 450,
    efficiency: 18.5,
  });

  const [drivingStyle, setDrivingStyle] = useState('Spirited Canyon (Balanced)');
  const [conditions, setConditions] = useState('Standard Day (20°C, Sea Level)');
  const [aiSuggestion, setAiSuggestion] = useState<TuningSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { latestData } = useVehicleData();

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: Number(value) }));
  };
  
  const runSimulation = useCallback(() => {
    const baseTorque = 480;
    const basePower = 450;
    const baseEfficiency = 18.5;

    const newTorque = baseTorque + (params.fuelMap * 2) + (params.ignitionTiming * 1.5) + (params.boostPressure * 3);
    const newPower = basePower + (params.fuelMap * 1.8) + (params.ignitionTiming * 2.2) + (params.boostPressure * 3.5);
    const newEfficiency = baseEfficiency - (Math.abs(params.fuelMap) * 0.2) - (Math.abs(params.ignitionTiming) * 0.1) - (params.boostPressure * 0.4);

    setPredicted({
      torque: Math.round(newTorque),
      power: Math.round(newPower),
      efficiency: Math.round(newEfficiency * 10) / 10,
    });
  }, [params]);

  useEffect(() => {
    runSimulation();
  }, [params, runSimulation]);

  const handleGetSuggestion = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAiSuggestion(null);
    try {
      const suggestion = await getTuningSuggestion(latestData, drivingStyle, conditions);
      setAiSuggestion(suggestion);
    } catch (err) {
      setError("Failed to get a tuning suggestion from KC. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setParams(aiSuggestion.suggestedParams);
    }
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-gray-100 font-display">Tuning Sandbox</h1>
        <p className="text-gray-400 mt-1">Simulate tuning changes and predict their impact with the help of your AI assistant.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Controls & AI */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Manual Controls */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-6">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 font-display">Manual Tuning Parameters</h2>
                
                <div>
                  <label htmlFor="fuelMap" className="block text-sm font-medium text-gray-400">Fuel Map Enrichment (%)</label>
                  <div className="flex items-center space-x-4">
                      <input type="range" id="fuelMap" name="fuelMap" min="-10" max="10" value={params.fuelMap} onChange={handleParamChange} className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                      <span className="font-mono text-lg w-12 text-right">{params.fuelMap}%</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="ignitionTiming" className="block text-sm font-medium text-gray-400">Ignition Timing Advance (°)</label>
                   <div className="flex items-center space-x-4">
                      <input type="range" id="ignitionTiming" name="ignitionTiming" min="-5" max="5" value={params.ignitionTiming} onChange={handleParamChange} className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                      <span className="font-mono text-lg w-12 text-right">{params.ignitionTiming}°</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="boostPressure" className="block text-sm font-medium text-gray-400">Boost Pressure (PSI)</label>
                  <div className="flex items-center space-x-4">
                      <input type="range" id="boostPressure" name="boostPressure" min="0" max="8" step="0.5" value={params.boostPressure} onChange={handleParamChange} className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                      <span className="font-mono text-lg w-12 text-right">{params.boostPressure.toFixed(1)}</span>
                  </div>
                </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-4">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 font-display">AI Tuning Assistant</h2>
                 <div>
                    <label htmlFor="drivingStyle" className="block text-sm font-medium text-gray-400 mb-1">Driving Style</label>
                    <select id="drivingStyle" value={drivingStyle} onChange={e => setDrivingStyle(e.target.value)} className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
                        <option>Daily Commute (Efficiency)</option>
                        <option>Spirited Canyon (Balanced)</option>
                        <option>Track Day (Max Performance)</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="conditions" className="block text-sm font-medium text-gray-400 mb-1">Environmental Conditions</label>
                    <select id="conditions" value={conditions} onChange={e => setConditions(e.target.value)} className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
                        <option>Standard Day (20°C, Sea Level)</option>
                        <option>Hot & Humid (35°C, 90% RH)</option>
                        <option>High Altitude (Denver, CO)</option>
                    </select>
                </div>
                 <button
                    onClick={handleGetSuggestion}
                    disabled={isAnalyzing}
                    className="w-full bg-brand-blue text-white font-semibold py-3 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-blue shadow-glow-blue disabled:bg-base-700"
                >
                    {isAnalyzing ? 'KC is Analyzing...' : 'Get AI Recommendation'}
                </button>
            </div>
        </div>

        {/* Right Column: Outcomes & AI Suggestion */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Predicted Outcomes */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-6 font-display">Live Simulation</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Predicted Torque" value={predicted.torque} unit="lb-ft" />
                    <StatCard title="Predicted Power" value={predicted.power} unit="HP" />
                    <StatCard title="Predicted Fuel Economy" value={predicted.efficiency} unit="MPG" />
                </div>
            </div>

             {/* AI Suggestion Display */}
             <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex-grow flex flex-col">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-4 font-display">KC's Recommendation</h2>
                {isAnalyzing && (
                    <div className="flex-grow flex justify-center items-center">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-brand-cyan"></div>
                    </div>
                )}
                {error && <div className="text-red-500 text-center p-4 bg-red-900/20 rounded-md">{error}</div>}
                {aiSuggestion && !isAnalyzing && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-brand-cyan">Suggested Parameters:</h4>
                            <p className="font-mono text-gray-300">
                                Fuel: {aiSuggestion.suggestedParams.fuelMap}% | 
                                Timing: {aiSuggestion.suggestedParams.ignitionTiming}° | 
                                Boost: +{aiSuggestion.suggestedParams.boostPressure.toFixed(1)} PSI
                            </p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-brand-cyan">Predicted Gains:</h4>
                            <p className="text-gray-300">{aiSuggestion.analysis.predictedGains}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-cyan">Potential Risks & Notes:</h4>
                            <p className="text-gray-300">{aiSuggestion.analysis.potentialRisks}</p>
                        </div>
                        <button
                            onClick={applyAISuggestion}
                            className="w-full bg-brand-cyan text-black font-semibold py-2 rounded-md hover:bg-cyan-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan shadow-glow-cyan"
                        >
                            Apply to Sandbox
                        </button>
                    </div>
                )}
                 {!aiSuggestion && !isAnalyzing && !error && (
                    <div className="flex-grow flex items-center justify-center text-center">
                        <p className="text-gray-500">Select your preferences and ask KC for a recommendation.</p>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default TuningSandbox;
