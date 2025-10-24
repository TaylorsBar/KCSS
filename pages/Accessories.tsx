

import React, { useState, useContext } from 'react';
import { AppearanceContext, CopilotAudioOutput } from '../contexts/AppearanceContext';
import { useVehicleStore } from '../store/useVehicleStore';
import { ConnectionStatus } from '../types';

const VehicleConnection: React.FC = () => {
    const { connectionStatus, connectToVehicle, disconnectFromVehicle } = useVehicleStore(state => ({
        connectionStatus: state.connectionStatus,
        connectToVehicle: state.connectToVehicle,
        disconnectFromVehicle: state.disconnectFromVehicle,
    }));

    const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
    const isConnecting = connectionStatus === ConnectionStatus.CONNECTING;

    const getStatusColor = () => {
        switch(connectionStatus) {
            case ConnectionStatus.CONNECTED: return 'bg-green-500';
            case ConnectionStatus.CONNECTING: return 'bg-yellow-500 animate-pulse';
            case ConnectionStatus.ERROR: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }
    
    const handleConnectClick = () => {
        if (isConnected) {
            disconnectFromVehicle();
        } else {
            connectToVehicle();
        }
    }

    return (
         <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
            <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2 mb-6">
                <h2 className="text-lg font-semibold font-display">Vehicle Connection (OBD-II)</h2>
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
                    <span className="text-sm text-gray-400">{connectionStatus}</span>
                </div>
            </div>
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Connect to a compatible ELM327 Bluetooth OBD-II dongle to stream live data directly from your vehicle's ECU.
                </p>
                <button
                    onClick={handleConnectClick}
                    disabled={isConnecting}
                    className="w-full mt-4 bg-brand-blue text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors shadow-glow-blue disabled:bg-base-700 disabled:cursor-not-allowed"
                >
                    {isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect from Vehicle' : 'Connect to Vehicle')}
                </button>
            </div>
        </div>
    );
};


const Accessories: React.FC = () => {
    const { copilotAudioOutput, setCopilotAudioOutput } = useContext(AppearanceContext);

    const [isStereoConnected, setIsStereoConnected] = useState(true);
    const [stereoName, setStereoName] = useState('Pioneer AVH-Z9200DAB');
    const [volume, setVolume] = useState(75);
    const [source, setSource] = useState<'Radio' | 'Bluetooth' | 'USB'>('Bluetooth');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-100 font-display">Accessory Control</h1>
                <p className="text-gray-400 mt-1">Manage connected devices and integrations.</p>
            </div>
            
            <VehicleConnection />

            {/* Car Stereo Section */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
                <div className="flex justify-between items-center border-b border-brand-cyan/30 pb-2 mb-6">
                    <h2 className="text-lg font-semibold font-display">Car Stereo</h2>
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isStereoConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <span className="text-sm text-gray-400">
                            {isStereoConnected ? `Connected: ${stereoName}` : 'Disconnected'}
                        </span>
                    </div>
                </div>

                <div className={`space-y-6 ${!isStereoConnected ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                        <label htmlFor="volume" className="block text-md font-semibold text-gray-300 mb-2">Master Volume</label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="range"
                                id="volume"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={e => setVolume(parseInt(e.target.value))}
                                className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                disabled={!isStereoConnected}
                            />
                            <span className="font-mono text-lg w-12 text-right">{volume}%</span>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-semibold text-gray-300 mb-3">Audio Source</h3>
                        <div className="flex gap-4">
                            {(['Radio', 'Bluetooth', 'USB'] as const).map(src => (
                                <button
                                    key={src}
                                    onClick={() => setSource(src)}
                                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${source === src ? 'bg-brand-cyan text-black' : 'bg-base-800 text-gray-300 hover:bg-base-700'}`}
                                    disabled={!isStereoConnected}
                                >
                                    {src}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Co-Pilot Integration */}
            <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-6 font-display">Handsfree Co-Pilot Integration</h2>
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Route audio feedback from KC through your desired output.</p>
                     <div>
                        <h3 className="text-md font-semibold text-gray-300 mb-3">Audio Output</h3>
                        <div className="flex gap-4">
                            {(['phone', 'stereo'] as const).map(output => (
                                <button
                                    key={output}
                                    onClick={() => setCopilotAudioOutput(output)}
                                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors capitalize ${copilotAudioOutput === output ? 'bg-brand-cyan text-black' : 'bg-base-800 text-gray-300 hover:bg-base-700'}`}
                                    disabled={output === 'stereo' && !isStereoConnected}
                                >
                                    {output} {output === 'stereo' && !isStereoConnected ? '(N/A)' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Accessories;
