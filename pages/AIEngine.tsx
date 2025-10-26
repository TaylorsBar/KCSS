import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';
import { getPredictiveAnalysis, getCrewChiefResponse, getRouteScoutResponse } from '../services/geminiService';
import { TimelineEvent, PredictiveAnalysisResult, ChatMessage, GroundingChunk, AuditEvent } from '../types';
import RiskTimeline from '../components/RiskTimeline';
import EngineIcon from '../components/icons/EngineIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import ReactMarkdown from 'react-markdown';
import GroundingSources from '../components/GroundingSources';

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${checked ? 'bg-brand-cyan' : 'bg-base-700'}`}
        role="switch"
        aria-checked={checked}
    >
        <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 text-sm font-semibold transition-colors ${
            isActive ? 'bg-black text-brand-cyan border-b-2 border-brand-cyan' : 'bg-base-800/30 text-gray-400 hover:bg-base-800/50'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const PredictiveTab: React.FC = () => {
    const [isProactiveMode, setIsProactiveMode] = useState(true);
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'monitoring' | 'analyzing' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<Date | null>(null);
    const analysisIntervalRef = useRef<number | null>(null);

    const { vehicleDataHistory, timelineEvents, setTimelineEvents, maintenanceLog, addAuditEvent } = useVehicleStore(state => ({
        vehicleDataHistory: state.data,
        timelineEvents: state.timelineEvents,
        setTimelineEvents: state.setTimelineEvents,
        maintenanceLog: state.maintenanceLog,
        addAuditEvent: state.addAuditEvent,
    }));

    const handleAnalyze = useCallback(async (isForced: boolean = false) => {
        if (analysisStatus === 'analyzing' && !isForced) return;
        if (!vehicleDataHistory || vehicleDataHistory.length < 50) {
            setError("Waiting for sufficient vehicle data to begin analysis...");
            return;
        };

        setAnalysisStatus('analyzing');
        setError(null);
        if (isForced) setTimelineEvents([]);
        addAuditEvent(AuditEvent.AiAnalysis, `Predictive analysis started (${isForced ? 'manual' : 'proactive'}).`);

        try {
            const result = await getPredictiveAnalysis(vehicleDataHistory, maintenanceLog) as PredictiveAnalysisResult;
            if (result.error) {
                setError(result.error);
                setAnalysisStatus('error');
            } else {
                setTimelineEvents(result.timelineEvents || []);
                setLastAnalysisTimestamp(new Date());
                setAnalysisStatus(isProactiveMode ? 'monitoring' : 'idle');
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred during analysis.";
            setError(errorMessage);
            setAnalysisStatus('error');
        }
    }, [analysisStatus, vehicleDataHistory, isProactiveMode, setTimelineEvents, maintenanceLog, addAuditEvent]);

    useEffect(() => {
        const stopInterval = () => {
            if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        };

        if (isProactiveMode) {
            handleAnalyze();
            analysisIntervalRef.current = window.setInterval(() => handleAnalyze(), 60000);
            setAnalysisStatus('monitoring');
        } else {
            stopInterval();
            setAnalysisStatus('idle');
        }

        return () => stopInterval();
    }, [isProactiveMode, handleAnalyze]);

    const getStatusText = () => {
        if (error) return 'Error';
        if (analysisStatus === 'analyzing') return 'Analyzing...';
        if (isProactiveMode) return 'Monitoring...';
        return 'Idle';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-4">
                <div className="flex items-center justify-between p-3 bg-base-800/50 rounded-md">
                    <label htmlFor="proactive-toggle" className="font-semibold text-white">Proactive Monitoring</label>
                    <ToggleSwitch checked={isProactiveMode} onChange={setIsProactiveMode} />
                </div>
                <div className="text-center p-4 bg-base-900/50 rounded-md">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-xl font-semibold text-brand-cyan capitalize">{getStatusText()}</p>
                    <p className="text-xs text-gray-500 mt-2">Last analysis: {lastAnalysisTimestamp ? lastAnalysisTimestamp.toLocaleTimeString() : 'Never'}</p>
                </div>
                <button onClick={() => handleAnalyze(true)} disabled={analysisStatus === 'analyzing'} className="w-full bg-brand-cyan text-black font-semibold py-3 rounded-md hover:bg-cyan-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan shadow-glow-cyan disabled:bg-base-700 disabled:cursor-not-allowed">
                    {analysisStatus === 'analyzing' ? 'Analyzing...' : 'Force Analysis Now'}
                </button>
            </div>
            <div className="lg:col-span-2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg min-h-[300px]">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-6 font-display">Risk Timeline</h2>
                {analysisStatus === 'analyzing' && timelineEvents.length === 0 && (
                    <div className="flex justify-center items-center h-48"><div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-brand-cyan"></div></div>
                )}
                {error && <div className="text-red-500 text-center p-4 bg-red-900/20 rounded-md">{error}</div>}
                {(analysisStatus !== 'analyzing' || timelineEvents.length > 0) && <RiskTimeline events={timelineEvents} />}
            </div>
        </div>
    );
};

const AgentChatInterface: React.FC<{ agent: 'crew-chief' | 'route-scout' }> = ({ agent }) => {
    const { latestData, addAuditEvent } = useVehicleStore(state => ({
        latestData: state.latestData,
        addAuditEvent: state.addAuditEvent,
    }));
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const agentConfig = {
        'crew-chief': {
            title: 'Crew Chief',
            subtitle: 'AI-powered parts procurement assistant.',
            placeholder: 'e.g., "Find me performance brake pads for a 2022 WRX"',
            initialMessage: "I'm your Crew Chief. Tell me what parts you're looking for, and I'll find suppliers and information for you.",
            handler: getCrewChiefResponse,
        },
        'route-scout': {
            title: 'Route Scout',
            subtitle: 'Intelligent route and location discovery.',
            placeholder: 'e.g., "Suggest a scenic route for a club convoy"',
            initialMessage: "I'm your Route Scout. Ask me to find interesting driving routes, circuits, or meet-up spots near your current location.",
            handler: (query: string) => getRouteScoutResponse(query, { latitude: latestData.latitude, longitude: latestData.longitude }),
        }
    };
    
    const config = agentConfig[agent];
    
    useEffect(() => {
        setMessages([{ id: '1', text: config.initialMessage, sender: 'ai' }]);
    }, [agent, config.initialMessage]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        addAuditEvent(AuditEvent.DiagnosticQuery, `${config.title} query: "${input}"`);

        try {
            const aiResponse = await config.handler(input);
            const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: aiResponse.text, sender: 'ai', chunks: aiResponse.chunks };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I couldn't get a response. Please check your connection and try again.", sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] bg-black rounded-lg border border-brand-cyan/30 shadow-lg">
            <div className="p-4 border-b border-brand-cyan/30">
                <h2 className="text-xl font-bold text-gray-100 font-display">{config.title}</h2>
                <p className="text-sm text-gray-400">{config.subtitle}</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-cyan flex-shrink-0 mt-1 shadow-glow-cyan"></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-brand-blue text-white' : 'bg-base-800 text-gray-200'}`}>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                                {msg.chunks && msg.chunks.length > 0 && <GroundingSources chunks={msg.chunks} />}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-cyan flex-shrink-0 mt-1 shadow-glow-cyan"></div>
                            <div className="max-w-xl p-3 rounded-lg bg-base-800 text-gray-200">
                                <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-brand-cyan/30">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={config.placeholder} className="flex-1 bg-base-800 border border-base-700 rounded-md px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan" disabled={isLoading} />
                    <button type="submit" disabled={isLoading} className="bg-brand-cyan text-black font-semibold px-4 py-2 rounded-md disabled:bg-base-700 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors shadow-glow-cyan">Send</button>
                </form>
            </div>
        </div>
    );
};


const AIEngine: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'predictive' | 'crew-chief' | 'route-scout'>('predictive');

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-100 font-display">AI Engine</h1>
                <p className="text-gray-400 mt-1">A suite of intelligent agents to enhance your driving experience.</p>
            </div>
            
            <div className="flex bg-base-900/50 rounded-t-lg">
                <TabButton label="Predictive AI" icon={<EngineIcon className="w-6 h-6"/>} isActive={activeTab === 'predictive'} onClick={() => setActiveTab('predictive')} />
                <TabButton label="Crew Chief" icon={<ShoppingCartIcon className="w-6 h-6" />} isActive={activeTab === 'crew-chief'} onClick={() => setActiveTab('crew-chief')} />
                <TabButton label="Route Scout" icon={<MapPinIcon className="w-6 h-6" />} isActive={activeTab === 'route-scout'} onClick={() => setActiveTab('route-scout')} />
            </div>

            <div className="animate-fade-in">
                {activeTab === 'predictive' && <PredictiveTab />}
                {activeTab === 'crew-chief' && <AgentChatInterface agent="crew-chief" />}
                {activeTab === 'route-scout' && <AgentChatInterface agent="route-scout" />}
            </div>
        </div>
    );
};

export default AIEngine;
