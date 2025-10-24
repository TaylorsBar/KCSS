import React, { useEffect, useState } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import MicrophoneIcon from '../components/icons/MicrophoneIcon';
import SoundWaveIcon from '../components/icons/SoundWaveIcon';

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

const Diagnostics: React.FC = () => {
    const { 
        connectionState, 
        userTranscript, 
        aiTranscript,
        error, 
        connect, 
        disconnect 
    } = useLiveConversation();

    const [lastUserTranscript, setLastUserTranscript] = useState('');
    const [lastAiTranscript, setLastAiTranscript] = useState("Hello! I'm KC. Press the microphone to start a conversation.");

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
                <h2 className="text-2xl font-bold text-gray-100 font-display">Live Conversational Diagnostics</h2>
                <p className="text-gray-400 mt-1">Speak directly with KC for real-time assistance.</p>
                <div className="mt-4">
                    <StatusIndicator status={error ? 'ERROR' : connectionState} />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            </div>

            <div className="w-full max-w-2xl flex-grow flex flex-col justify-center gap-8">
                {/* AI Response */}
                <div className="min-h-[6rem] p-4 bg-base-900/50 rounded-lg border border-base-700">
                    <h3 className="font-semibold text-brand-cyan mb-2">KC's Response:</h3>
                    <p className="text-lg text-gray-200">{lastAiTranscript}</p>
                </div>
                {/* User Input */}
                <div className="min-h-[6rem] p-4 bg-base-800/50 rounded-lg border border-base-700">
                     <h3 className="font-semibold text-gray-400 mb-2">Your Input:</h3>
                     <p className="text-lg text-gray-300 italic">{lastUserTranscript || "..."}</p>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <button
                    onClick={handleButtonClick}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mx-auto ${isSessionActive ? 'bg-red-500' : 'bg-brand-cyan'}`}
                >
                    {isSessionActive ? <SoundWaveIcon className="w-12 h-12 text-black" /> : <MicrophoneIcon className="w-12 h-12 text-black" />}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                    {connectionState === 'CONNECTING' ? 'Establishing secure connection...' : (isSessionActive ? 'Tap to disconnect' : 'Tap to start conversation')}
                </p>
            </div>
        </div>
    );
};

export default Diagnostics;