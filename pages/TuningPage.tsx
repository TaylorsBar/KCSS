import React, { useState, useMemo } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';
import { getTuningSuggestion, analyzeTuneSafety, getTuningChatResponse } from '../services/geminiService';
import { TuningSuggestion, ChatMessage } from '../types';
import TuningSlider from '../components/tuning/TuningSlider';
import TuningMap from '../components/tuning/TuningMap';
import SparklesIcon from '../components/icons/SparklesIcon';
import ReactMarkdown from 'react-markdown';

const RPM_AXIS = ['800', '1500', '2500', '3500', '4500', '5500', '6500', '7500'];
const LOAD_AXIS = ['20', '30', '40', '50', '60', '70', '80', '100'];

const generateDefaultMap = (baseValue: number): number[][] => 
    Array(LOAD_AXIS.length).fill(0).map(() => Array(RPM_AXIS.length).fill(baseValue));

const DEFAULT_TUNE = {
    fuelMap: 0,
    ignitionTiming: generateDefaultMap(25),
    boostPressure: generateDefaultMap(0.5),
};

const TuningPage: React.FC = () => {
    const { latestData, data: vehicleDataHistory } = useVehicleStore(state => ({
        latestData: state.latestData,
        data: state.data
    }));

    const [currentTune, setCurrentTune] = useState(DEFAULT_TUNE);
    const [activeTab, setActiveTab] = useState<'fuel' | 'ignition' | 'boost'>('ignition');
    const [aiIsLoading, setAiIsLoading] = useState(false);
    const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
    const [aiChatInput, setAiChatInput] = useState('');
    const [safetyReport, setSafetyReport] = useState<{ score: number; warnings: string[] } | null>(null);

    const handleMapChange = (map: 'ignitionTiming' | 'boostPressure', row: number, col: number, value: number) => {
        const newMap = currentTune[map].map(r => [...r]);
        newMap[row][col] = value;
        setCurrentTune(prev => ({ ...prev, [map]: newMap }));
        setSafetyReport(null); // Invalidate safety report on change
    };

    const handleFuelChange = (value: number) => {
        setCurrentTune(prev => ({...prev, fuelMap: value}));
        setSafetyReport(null);
    }
    
    const applySuggestion = (suggestion: TuningSuggestion) => {
        setCurrentTune(suggestion.suggestedParams);
        const aiMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            text: `**Tune Applied: Analysis**\n- **Gains:** ${suggestion.analysis.predictedGains}\n- **Risks:** ${suggestion.analysis.potentialRisks}`
        };
        if (suggestion.analysis.educationalTip) {
            aiMessage.text += `\n- **Pro Tip:** ${suggestion.analysis.educationalTip}`;
        }
        setAiChat(prev => [...prev, aiMessage]);
        setSafetyReport(null);
    };

    const handleGetSuggestion = async (goal: string) => {
        setAiIsLoading(true);
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: `Generate a tune for: ${goal}` };
        setAiChat(prev => [...prev, userMessage]);
        try {
            const suggestion = await getTuningSuggestion(goal, latestData);
            applySuggestion(suggestion);
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred.";
            const aiMessage: ChatMessage = { id: Date.now().toString(), sender: 'ai', text: `Sorry, I couldn't generate a tune. Error: ${error}` };
            setAiChat(prev => [...prev, aiMessage]);
        } finally {
            setAiIsLoading(false);
        }
    };

    const handleSafetyCheck = async () => {
        setAiIsLoading(true);
        setSafetyReport(null);
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: 'Analyze the safety of my current tune.' };
        setAiChat(prev => [...prev, userMessage]);
        try {
            const { ignitionTiming, boostPressure } = currentTune;
            const report = await analyzeTuneSafety({ ignitionTiming, boostPressure }, latestData);
            setSafetyReport({ score: report.safetyScore, warnings: report.warnings });
            let safetyMessage = `**Safety Analysis Complete**\n- **Safety Score:** ${report.safetyScore}/100\n`;
            if (report.warnings.length > 0) {
                safetyMessage += `- **Warnings:**\n${report.warnings.map(w => `  - ${w}`).join('\n')}`;
            } else {
                safetyMessage += "- No immediate safety concerns detected under current conditions.";
            }
            const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: safetyMessage };
            setAiChat(prev => [...prev, aiMessage]);
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred.";
            const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: `Sorry, I couldn't analyze the tune. Error: ${error}` };
            setAiChat(prev => [...prev, aiMessage]);
        } finally {
            setAiIsLoading(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4">
            {/* Left Panel: AI Assistant */}
            <div className="lg:col-span-1 bg-black p-4 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 font-display">AI Tuning Assistant</h2>
                <div className="flex-grow my-4 space-y-2 overflow-y-auto">
                    {aiChat.map(msg => (
                         <div key={msg.id} className={`max-w-xs p-2 rounded-lg ${msg.sender === 'user' ? 'bg-brand-blue/80 ml-auto' : 'bg-base-800'}`}>
                             <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                         </div>
                    ))}
                    {aiIsLoading && <div className="text-center text-gray-400">KC is thinking...</div>}
                </div>
                <div className="flex-shrink-0 space-y-2">
                    <p className="text-xs text-gray-400 font-semibold">QUICK ACTIONS:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <button onClick={() => handleGetSuggestion('Max Performance')} disabled={aiIsLoading} className="flex items-center justify-center gap-1 bg-base-700 p-2 rounded hover:bg-base-600 disabled:opacity-50"><SparklesIcon className="w-4 h-4 text-brand-pink" /> Track Day</button>
                        <button onClick={() => handleGetSuggestion('Fuel Economy')} disabled={aiIsLoading} className="flex items-center justify-center gap-1 bg-base-700 p-2 rounded hover:bg-base-600 disabled:opacity-50"><SparklesIcon className="w-4 h-4 text-brand-green" /> Eco Tune</button>
                        <button onClick={() => handleGetSuggestion('Daily Driving')} disabled={aiIsLoading} className="flex items-center justify-center gap-1 bg-base-700 p-2 rounded hover:bg-base-600 disabled:opacity-50"><SparklesIcon className="w-4 h-4 text-brand-cyan" /> Daily</button>
                        <button onClick={handleSafetyCheck} disabled={aiIsLoading} className="bg-yellow-600/80 p-2 rounded hover:bg-yellow-500/80 disabled:opacity-50 font-semibold">Safety Check</button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Tables & Controls */}
            <div className="lg:col-span-2 bg-black p-4 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2 mb-2">
                    <div className="flex bg-base-900/50 rounded-md">
                        <button onClick={() => setActiveTab('ignition')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'ignition' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Ignition</button>
                        <button onClick={() => setActiveTab('boost')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'boost' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Boost</button>
                        <button onClick={() => setActiveTab('fuel')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'fuel' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}>Fuel</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentTune(DEFAULT_TUNE)} className="bg-base-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-base-600 transition-colors text-sm">Reset</button>
                         <button disabled className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md disabled:bg-red-900/50 disabled:cursor-not-allowed disabled:text-gray-400 text-sm">Write to ECU</button>
                    </div>
                </div>
                
                <div className="flex-grow mt-2 overflow-auto">
                    {activeTab === 'ignition' && <TuningMap title="Ignition Timing (deg BTDC)" data={currentTune.ignitionTiming} xAxisLabels={RPM_AXIS} yAxisLabels={LOAD_AXIS} onChange={(r, c, v) => handleMapChange('ignitionTiming', r, c, v)} />}
                    {activeTab === 'boost' && <TuningMap title="Boost Pressure Target (bar)" data={currentTune.boostPressure} xAxisLabels={RPM_AXIS} yAxisLabels={LOAD_AXIS} onChange={(r, c, v) => handleMapChange('boostPressure', r, c, v)} />}
                    {activeTab === 'fuel' && (
                        <div className="p-8">
                            <h2 className="text-lg font-semibold text-center mb-4 font-display">Global Fuel Map Enrichment</h2>
                            <TuningSlider label="Fuel Trim" unit="%" value={currentTune.fuelMap} min={-10} max={10} step={0.5} onChange={handleFuelChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TuningPage;