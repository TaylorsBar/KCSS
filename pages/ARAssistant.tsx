

import React, { useState, useEffect, useRef } from 'react';
import { IntentAction, ComponentHotspot, VoiceCommandIntent, SensorDataPoint } from '../types/index';
import { getVoiceCommandIntent, generateComponentImage, getComponentTuningAnalysis } from '../services/geminiService';
import MicrophoneIcon from '../components/icons/MicrophoneIcon';
import { MOCK_LOGS } from '../data/mockMaintenance';
import { MOCK_HOTSPOTS, inspectorComponents } from '../data/mockAR';
import ReactMarkdown from 'react-markdown';

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

interface ARAssistantProps {
    latestData: SensorDataPoint;
}

const ARAssistant: React.FC<ARAssistantProps> = ({ latestData }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [assistantMessage, setAssistantMessage] = useState("Activate the microphone and ask a question, like 'Show me the failing O2 sensor.'");

    const [isInspecting, setIsInspecting] = useState(false);
    const [inspectionResult, setInspectionResult] = useState<{imageUrl: string | null, analysis: string | null, error: string | null} | null>(null);
    const latestDataRef = useRef(latestData);
    latestDataRef.current = latestData;

    const getLiveDataForComponent = (componentId: string | null): string | null => {
        if (!componentId || !latestData) return null;
        switch(componentId) {
            case 'turbo': return `Boost: ${latestData.turboBoost.toFixed(2)} bar`;
            case 'o2-sensor': return `Voltage: ${latestData.o2SensorVoltage.toFixed(2)} V`;
            case 'coolant': return `Temp: ${latestData.engineTemp.toFixed(1)} °C`;
            case 'oil-filter': return `Pressure: ${latestData.oilPressure.toFixed(1)} bar`;
            case 'map-sensor': return `Load: ${latestData.engineLoad.toFixed(0)}%`;
            case 'alternator': return `Voltage: ${latestData.batteryVoltage.toFixed(1)} V`;
            case 'intake': return `Temp: ${latestData.inletAirTemp.toFixed(1)} °C`;
            default: return null;
        }
    };

    const handleConnect = () => {
        setIsConnecting(true);
        setAssistantMessage("Establishing secure link to vehicle...");
        setTimeout(() => {
            setIsConnecting(false);
            setIsConnected(true);
            setAssistantMessage("Connection successful. Activate the microphone to begin.");
        }, 2000);
    };

    const processCommand = async (command: string) => {
        setIsListening(false);
        setAssistantMessage("Thinking...");
        setSelectedComponent(null); // Clear previous selection
        const result: VoiceCommandIntent = await getVoiceCommandIntent(command);

        if (result.confidence < 0.7) {
            setAssistantMessage("I'm not quite sure what you mean. Could you try rephrasing?");
            return;
        }

        switch (result.intent) {
            case IntentAction.ShowComponent:
                if (result.component && MOCK_HOTSPOTS.find(h => h.id === result.component)) {
                    setSelectedComponent(result.component);
                } else {
                    setAssistantMessage("I can't seem to find that component on the 3D model.");
                }
                break;
            case IntentAction.QueryService:
                const nextService = MOCK_LOGS.find(log => !log.verified && log.isAiRecommendation);
                if (nextService) {
                    setAssistantMessage(`Your next recommended service is: ${nextService.service} on or around ${nextService.date}.`);
                } else {
                    setAssistantMessage("Your service log is up to date. No immediate recommendations found.");
                }
                break;
            case IntentAction.HideComponent:
                setSelectedComponent(null);
                setInspectionResult(null); // Also clear inspection
                setAssistantMessage("Highlights cleared. What's next?");
                break;
            default:
                setAssistantMessage("Sorry, I didn't understand that command. You can ask me to show a component or ask about your next service.");
        }
    };
    
    useEffect(() => {
        const inspectComponent = async () => {
            if (!selectedComponent) {
                setInspectionResult(null);
                setAssistantMessage("Select a component to inspect using voice or the dropdown menu.");
                return;
            }
    
            const componentData = inspectorComponents.find(c => c.id === selectedComponent);
            const hotspotData = MOCK_HOTSPOTS.find(h => h.id === selectedComponent);
            if (!componentData) return;
            
            const liveData = getLiveDataForComponent(selectedComponent);
            const statusMessage = hotspotData ? `Status: ${hotspotData.status}.` : '';
            setAssistantMessage(`Analyzing the ${componentData.name}... ${statusMessage} ${liveData || ''}`);
    
            setIsInspecting(true);
            setInspectionResult(null);
    
            try {
                const [imageUrl, analysis] = await Promise.all([
                    generateComponentImage(componentData.name),
                    getComponentTuningAnalysis(componentData.name, latestDataRef.current)
                ]);
                setInspectionResult({ imageUrl, analysis, error: null });
                setAssistantMessage(`Analysis for ${componentData.name} complete.`);
            } catch (error) {
                console.error(error);
                const errorMessage = "Sorry, I couldn't generate the analysis for that component.";
                setInspectionResult({ imageUrl: null, analysis: null, error: errorMessage });
                setAssistantMessage(errorMessage);
            } finally {
                setIsInspecting(false);
            }
        };
    
        inspectComponent();
    }, [selectedComponent]);


    const handleListen = () => {
        if (!recognition) {
            setAssistantMessage("Sorry, your browser doesn't support voice commands.");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            setTranscript('');
            recognition.start();
        }
    };

    useEffect(() => {
        if (!recognition) return;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
            processCommand(currentTranscript);
        };
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
            {/* Left Panel: 3D Model and Controls */}
            <div className="w-full lg:w-2/3 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col relative">
                <h1 className="text-xl font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-4">Augmented Reality Assistant</h1>

                {!isConnected ? (
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <p className="text-gray-400 mb-4">Connect to the vehicle's AR system to begin.</p>
                        <button onClick={handleConnect} disabled={isConnecting} className="bg-brand-blue text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue disabled:bg-base-700">
                            {isConnecting ? 'Connecting...' : 'Activate AR Link'}
                        </button>
                    </div>
                ) : (
                    <div className="flex-grow relative engine-3d-container">
                        <iframe
                            title="AR Engine View"
                            frameBorder="0"
                            allowFullScreen
                            src="https://sketchfab.com/models/7ebc9741434540c4831453066d7ae057/embed?autospin=0&autostart=1&ui_theme=dark&ui_controls=0&ui_infos=0"
                            className="w-full h-full"
                        />
                        {MOCK_HOTSPOTS.map(hotspot => {
                            const isHighlighted = selectedComponent === hotspot.id;
                            const liveData = getLiveDataForComponent(hotspot.id);
                            
                            const getStatusClasses = (status: 'Normal' | 'Warning' | 'Failing') => {
                                switch (status) {
                                    case 'Failing': return { border: 'border-red-500', bg: 'bg-red-500' };
                                    case 'Warning': return { border: 'border-yellow-500', bg: 'bg-yellow-500' };
                                    default: return { border: 'border-gray-500', bg: 'bg-gray-500' };
                                }
                            };
                            const statusClasses = getStatusClasses(hotspot.status);

                            return (
                                <div key={hotspot.id} className="absolute" style={{ left: hotspot.cx, top: hotspot.cy, transform: 'translate(-50%, -50%)' }}>
                                    <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${isHighlighted ? 'border-brand-cyan scale-150' : statusClasses.border}`}>
                                        <div className={`w-3 h-3 rounded-full ${isHighlighted ? 'bg-brand-cyan animate-pulse' : statusClasses.bg}`}></div>
                                    </div>
                                    {isHighlighted && liveData && (
                                        <div className="absolute bottom-full mb-2 w-max bg-black/80 text-white text-sm px-3 py-1 rounded-md animate-fade-in">
                                            {liveData}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Panel: Assistant and Inspector */}
            <div className="w-full lg:w-1/3 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-4 font-display">KC Assistant & Inspector</h2>
                <div className="flex-grow flex flex-col justify-between">
                    <div className="p-4 bg-base-800/50 rounded-md min-h-[80px] text-gray-300 mb-4">
                        {assistantMessage}
                    </div>

                    <div className="text-center my-2">
                        <button onClick={handleListen} disabled={!isConnected || isConnecting} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mx-auto ${isListening ? 'bg-red-500' : 'bg-brand-cyan'}`}>
                            <MicrophoneIcon className="w-8 h-8 text-black" />
                        </button>
                        {isListening && <p className="text-sm text-gray-400 mt-2">Listening...</p>}
                    </div>
                    
                    <div className="flex-grow mt-4 p-2 bg-base-900 rounded-md space-y-3 overflow-y-auto min-h-[200px] border border-brand-cyan/20">
                        <label htmlFor="component-select" className="text-sm text-gray-400 px-2">Manual Inspection</label>
                        <select
                           id="component-select"
                           value={selectedComponent || ''}
                           onChange={e => setSelectedComponent(e.target.value)}
                           className="w-full bg-base-800 border border-base-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                           disabled={!isConnected}
                        >
                            <option value="" disabled>Select a component...</option>
                            {inspectorComponents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        {isInspecting ? (
                            <div className="text-center text-gray-400 p-4 flex flex-col items-center justify-center h-48">
                                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 animate-spin border-t-brand-cyan"></div>
                                <span className="mt-4">Analyzing component...</span>
                            </div>
                        ) : inspectionResult ? (
                            <div className="animate-fade-in space-y-2 mt-4">
                                {inspectionResult.error && <p className="text-red-400 p-2">{inspectionResult.error}</p>}
                                {inspectionResult.imageUrl && <img src={inspectionResult.imageUrl} alt="Generated component" className="w-full h-auto rounded-md border-2 border-brand-cyan/50" />}
                                {inspectionResult.analysis && (
                                    <div className="prose prose-sm prose-invert max-w-none p-2">
                                        <ReactMarkdown>{inspectionResult.analysis}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 h-full flex items-center justify-center p-4">
                                Highlight a component to see an AI analysis.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ARAssistant;