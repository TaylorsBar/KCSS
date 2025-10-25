import React, { useEffect, useState } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import MicrophoneIcon from '../components/icons/MicrophoneIcon';
import SoundWaveIcon from '../components/icons/SoundWaveIcon';
import { useVehicleStore } from '../store/useVehicleStore';
import { obdService } from '../services/obdService';
import { getDTCInfo } from '../services/geminiService';
import { DTCInfo, ConnectionStatus } from '../types';

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    const getStatusColor = () => {
        switch(status) {
            case 'CONNECTED': return 'text-green-400';
            case 'DISCONNECTED': return 'text-red-400';
            case 'ERROR': return 'text-red-500';
            default: return 'text-yellow-400';
        }
    }
    return (
        <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor().replace('text', 'bg')}`}></div>
            <span className={`text-sm font-semibold ${getStatusColor()}`}>{status}</span>
        </div>
    );
};

const ConversationalDiagnostics: React.FC = () => {
    const { 
        connectionState, 
        userTranscript, 
        aiTranscript,
        error, 
        connect, 
        disconnect 
    } = useLiveConversation();

    const [lastUserTranscript, setLastUserTranscript] = useState('');
    const [lastAiTranscript, setLastAiTranscript] = useState("Hello! I'm KC. How can I help you with your vehicle diagnostics today?");

    useEffect(() => {
        if (userTranscript) setLastUserTranscript(userTranscript);
    }, [userTranscript]);

    useEffect(() => {
        if (aiTranscript) setLastAiTranscript(aiTranscript);
    }, [aiTranscript]);

    const isSessionActive = connectionState !== 'DISCONNECTED' && connectionState !== 'ERROR';

    const handleButtonClick = () => {
        if (isSessionActive) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <div className="flex flex-col h-full bg-black rounded-lg border border-brand-cyan/30 shadow-lg p-6 text-center items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-gray-100 font-display">Live Conversational AI</h2>
                <p className="text-gray-400 mt-1 text-sm">Speak with KC for real-time help.</p>
                <div className="mt-4">
                    <StatusIndicator status={error ? 'ERROR' : connectionState} />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            </div>

            <div className="w-full max-w-2xl flex-grow flex flex-col justify-center gap-6 my-4">
                <div className="min-h-[5rem] p-3 bg-base-900/50 rounded-lg border border-base-700">
                    <h3 className="font-semibold text-brand-cyan mb-2 text-left text-sm">KC's Response:</h3>
                    <p className="text-md text-gray-200 text-left">{lastAiTranscript}</p>
                </div>
                <div className="min-h-[5rem] p-3 bg-base-800/50 rounded-lg border border-base-700">
                     <h3 className="font-semibold text-gray-400 mb-2 text-left text-sm">Your Input:</h3>
                     <p className="text-md text-gray-300 italic text-left">{lastUserTranscript || "..."}</p>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <button
                    onClick={handleButtonClick}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mx-auto ${isSessionActive ? 'bg-red-500' : 'bg-brand-cyan'}`}
                >
                    {isSessionActive ? <SoundWaveIcon className="w-10 h-10 text-black" /> : <MicrophoneIcon className="w-10 h-10 text-black" />}
                </button>
                <p className="text-xs text-gray-400 mt-3">
                    {connectionState === 'CONNECTING' ? 'Connecting...' : (isSessionActive ? 'Tap to disconnect' : 'Tap to start')}
                </p>
            </div>
        </div>
    );
}

const DTCScanner: React.FC = () => {
    const connectionStatus = useVehicleStore(state => state.connectionStatus);
    const [isScanning, setIsScanning] = useState(false);
    const [dtcResults, setDtcResults] = useState<DTCInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        setIsScanning(true);
        setError(null);
        setDtcResults([]);

        try {
            const codes = await obdService.fetchDTCs();
            if (codes.length === 0) {
                // Add a "No codes" success message
                 setDtcResults([{ code: "P0000", description: "No Diagnostic Trouble Codes found in the system.", severity: "Info", possibleCauses: [] }]);
            } else {
                const results = await Promise.all(codes.map(code => getDTCInfo(code)));
                setDtcResults(results);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsScanning(false);
        }
    };
    
    const severityStyles = {
        Critical: { border: 'border-red-500', text: 'text-red-400' },
        Warning: { border: 'border-yellow-500', text: 'text-yellow-400' },
        Info: { border: 'border-blue-500', text: 'text-blue-400' },
    };

    return (
        <div className="flex flex-col h-full bg-black rounded-lg border border-brand-cyan/30 shadow-lg p-6">
            <div className="flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-100 font-display">Fault Code Scanner</h2>
                <p className="text-gray-400 mt-1 text-sm">Scan your vehicle's ECU for Diagnostic Trouble Codes (DTCs).</p>
                 <button
                    onClick={handleScan}
                    disabled={isScanning || connectionStatus !== ConnectionStatus.CONNECTED}
                    className="w-full mt-4 bg-brand-blue text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue disabled:bg-base-700 disabled:cursor-not-allowed"
                >
                    {isScanning ? 'Scanning...' : 'Scan for Fault Codes'}
                </button>
                {connectionStatus !== ConnectionStatus.CONNECTED && <p className="text-xs text-yellow-400 text-center mt-2">Vehicle connection required to scan for codes.</p>}
            </div>

            <div className="flex-grow mt-4 overflow-y-auto pr-2">
                {error && <div className="text-red-400 bg-red-900/20 p-3 rounded-md">{error}</div>}
                <div className="space-y-3">
                    {dtcResults.map(dtc => (
                        <div key={dtc.code} className={`p-3 rounded-md border-l-4 bg-base-800/50 ${severityStyles[dtc.severity].border}`}>
                            <h3 className={`font-mono font-bold text-lg ${severityStyles[dtc.severity].text}`}>{dtc.code}</h3>
                            <p className="text-gray-200 mt-1">{dtc.description}</p>
                            {dtc.possibleCauses.length > 0 && (
                                <div className="mt-2">
                                    <h4 className="text-xs font-semibold text-gray-400">Potential Causes:</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mt-1">
                                        {dtc.possibleCauses.map((cause, i) => <li key={i}>{cause}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                     {isScanning && (
                        <div className="flex justify-center items-center py-10">
                            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 animate-spin border-t-brand-cyan"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const Diagnostics: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-4">
            <ConversationalDiagnostics />
            <DTCScanner />
        </div>
    );
};

export default Diagnostics;