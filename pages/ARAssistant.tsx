import React, { useState, useEffect, useRef } from 'react';
import { IntentAction, ComponentHotspot, VoiceCommandIntent } from '../types';
import { getVoiceCommandIntent, generateComponentImage } from '../services/geminiService';
import MicrophoneIcon from '../components/icons/MicrophoneIcon';
import { MOCK_LOGS } from './MaintenanceLog';

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const MOCK_HOTSPOTS: ComponentHotspot[] = [
    { id: 'o2-sensor', name: 'O2 Sensor', cx: '75%', cy: '70%', status: 'Failing' },
    { id: 'map-sensor', name: 'MAP Sensor', cx: '40%', cy: '40%', status: 'Warning' },
    { id: 'alternator', name: 'Alternator', cx: '30%', cy: '65%', status: 'Normal' },
    { id: 'turbo', name: 'Turbocharger', cx: '70%', cy: '50%', status: 'Normal' },
    { id: 'intake', name: 'Air Intake / Throttle Body', cx: '25%', cy: '40%', status: 'Normal' },
    { id: 'coolant', name: 'Coolant Outlet', cx: '45%', cy: '35%', status: 'Normal' },
    { id: 'oil-filter', name: 'Oil Filter', cx: '35%', cy: '75%', status: 'Normal' },
];

const ARAssistant: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);
    const [assistantMessage, setAssistantMessage] = useState("Activate the microphone and ask a question, like 'Show me the failing O2 sensor.'");
    const [isRemoteSessionActive, setIsRemoteSessionActive] = useState(false);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

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
        setHighlightedComponent(null); // Clear previous highlight
        const result: VoiceCommandIntent = await getVoiceCommandIntent(command);

        if (result.confidence < 0.7) {
            setAssistantMessage("I'm not quite sure what you mean. Could you try rephrasing?");
            return;
        }

        switch (result.intent) {
            case IntentAction.ShowComponent:
                if (result.component && MOCK_HOTSPOTS.find(h => h.id === result.component)) {
                    setHighlightedComponent(result.component);
                } else {
                    setAssistantMessage("I can't seem to find that component.");
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
                setHighlightedComponent(null);
                setAssistantMessage("Highlights cleared. What's next?");
                break;
            default:
                setAssistantMessage("Sorry, I didn't understand that command. You can ask me to show a component or ask about your next service.");
        }
    };
    
    useEffect(() => {
        if (highlightedComponent) {
            const componentData = MOCK_HOTSPOTS.find(h => h.id === highlightedComponent);
            if (componentData) {
                setAssistantMessage(`Highlighting the ${componentData.name}. Status: ${componentData.status}.`);
            }
        }
    }, [highlightedComponent]);

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

    const handleGenerateImage = async () => {
        if (!highlightedComponent) return;

        const componentData = MOCK_HOTSPOTS.find(h => h.id === highlightedComponent);
        if (!componentData) return;
        
        setIsGeneratingImage(true);
        setGeneratedImageUrl(null);
        setImageError(null);
        setAssistantMessage(`Generating a diagram for the ${componentData.name}...`);
        
        try {
            const imageUrl = await generateComponentImage(componentData.name);
            setGeneratedImageUrl(imageUrl);
            setAssistantMessage(`Diagram for ${componentData.name} generated successfully.`);
        } catch (error) {
            console.error(error);
            const errorMessage = "Sorry, I couldn't generate the diagram. Please try again.";
            setImageError(errorMessage);
            setAssistantMessage(errorMessage);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const hotspotStatusClasses = {
        'Failing': 'fill-red-500/50 stroke-red-500',
        'Warning': 'fill-yellow-500/50 stroke-yellow-500',
        'Normal': 'fill-green-500/50 stroke-green-500',
    };
    
    const statusTextClasses = {
        'Failing': 'text-red-500',
        'Warning': 'text-yellow-500',
        'Normal': 'text-green-500',
    };

    const modelUrl = "https://sketchfab.com/models/7ebc9741434540c4831453066d7ae057/embed?autospin=1&autostart=1&preload=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_help=0&ui_settings=0&ui_vr=0&ui_annotations=0&ui_hint=2";

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* AR Viewport (background) */}
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black">
                <div className="relative w-full max-w-5xl aspect-video">
                    <iframe
                        title="Toyota 2JZ GTE Engine 3D Model"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                        src={modelUrl}
                        className="w-full h-full"
                    ></iframe>
                    <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1280 720">
                        {MOCK_HOTSPOTS.map(hotspot => (
                            <g key={hotspot.id} className={`transition-opacity duration-300 ${highlightedComponent === hotspot.id || highlightedComponent === null ? 'opacity-100' : 'opacity-20'}`}>
                                <circle 
                                    cx={hotspot.cx} 
                                    cy={hotspot.cy} 
                                    r="20" 
                                    className={`${hotspotStatusClasses[hotspot.status]} transition-all`}
                                    strokeWidth="2"
                                >
                                    {highlightedComponent === hotspot.id && <>
                                        <animate attributeName="r" from="20" to="30" dur="1.5s" begin="0s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                                    </>}
                                </circle>
                                <circle 
                                    cx={hotspot.cx} 
                                    cy={hotspot.cy} 
                                    r="15" 
                                    className={`${hotspotStatusClasses[hotspot.status]}`}
                                    strokeWidth="2"
                                />
                                {highlightedComponent === hotspot.id && <text x={hotspot.cx} y={hotspot.cy} dy="-30" textAnchor="middle" className="fill-white font-sans font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                    {hotspot.name}
                                </text>}
                            </g>
                        ))}
                    </svg>
                </div>
            </div>

            {/* Floating Control Panel */}
            <div className="absolute top-0 right-0 h-full w-full max-w-md p-6 flex flex-col gap-6 overflow-y-auto">
                <div className="glassmorphism-panel p-6 rounded-lg flex-grow flex flex-col">
                    <h2 className="text-lg font-semibold border-b border-[var(--theme-panel-border)] pb-2 mb-4 font-display">Assistant Control</h2>
                    <div className="flex flex-col items-center justify-center flex-grow text-center">
                        <button onClick={handleListen} disabled={isListening || !isConnected} className={`relative w-24 h-24 rounded-full transition-colors ${isListening ? 'bg-red-500' : 'bg-brand-cyan'} text-black flex items-center justify-center shadow-lg disabled:bg-base-700 disabled:cursor-not-allowed`}>
                            {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                            <MicrophoneIcon className="w-10 h-10" />
                        </button>
                        <p className="mt-4 text-gray-300 h-6">{isListening ? 'Listening...' : (transcript ? `“${transcript}”` : 'Tap to speak')}</p>
                    </div>
                    <div className="mt-4 p-4 bg-base-800/50 rounded-md text-center min-h-[80px] flex items-center justify-center">
                        <p className="text-brand-cyan">{assistantMessage}</p>
                    </div>
                </div>

                {highlightedComponent && (() => {
                    const componentData = MOCK_HOTSPOTS.find(h => h.id === highlightedComponent);
                    if (!componentData) return null;
                    
                    return (
                        <div className="glassmorphism-panel p-6 rounded-lg">
                            <h2 className="text-lg font-semibold border-b border-[var(--theme-panel-border)] pb-2 mb-4 font-display">Component Details</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Component:</span>
                                    <span className="font-semibold text-white">{componentData.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Status:</span>
                                    <span className={`font-semibold ${statusTextClasses[componentData.status]}`}>{componentData.status}</span>
                                </div>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="w-full mt-2 bg-brand-blue text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue disabled:bg-base-700 disabled:cursor-wait"
                                >
                                    {isGeneratingImage ? 'Generating...' : 'Generate AI Diagram'}
                                </button>
                                {imageError && <p className="text-sm text-red-500 mt-2 text-center">{imageError}</p>}
                            </div>
                        </div>
                    );
                })()}

                <div className="glassmorphism-panel p-6 rounded-lg">
                    <h2 className="text-lg font-semibold border-b border-[var(--theme-panel-border)] pb-2 mb-4 font-display">Remote Workshop Link</h2>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-semibold ${isRemoteSessionActive ? 'text-green-400' : 'text-gray-500'}`}>
                            {isRemoteSessionActive ? 'Session Active' : 'Disconnected'}
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsRemoteSessionActive(prev => !prev)}
                        className="w-full bg-brand-blue text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue"
                    >
                        {isRemoteSessionActive ? 'End Remote Session' : 'Initiate Remote Session'}
                    </button>
                </div>
            </div>

            {/* Connection Overlay */}
            {!isConnected && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-fade-in">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-100 font-display">AR Assistant Offline</h1>
                        <p className="text-gray-400 mt-2 mb-8 max-w-md">Establish a secure connection to your vehicle to enable real-time augmented reality diagnostics.</p>
                        <button onClick={handleConnect} disabled={isConnecting} className="bg-brand-blue text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-blue shadow-glow-blue disabled:bg-base-700 disabled:cursor-not-allowed">
                             {isConnecting ? 'Connecting...' : 'Connect to Assistant'}
                        </button>
                    </div>
                </div>
            )}


            {generatedImageUrl && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setGeneratedImageUrl(null)}>
                    <div className="w-full max-w-2xl bg-base-900 rounded-lg border border-brand-cyan shadow-glow-cyan relative p-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setGeneratedImageUrl(null)} className="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-brand-cyan rounded-full text-brand-cyan hover:text-white text-xl font-bold z-10">&times;</button>
                        <div className="bg-black rounded-md overflow-hidden">
                          <img src={generatedImageUrl} alt="Generated component diagram" className="w-full h-auto object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ARAssistant;