import React from 'react';

interface TirePressureDisplayProps {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
}

const LOW_PRESSURE_THRESHOLD = 32;

const Tire: React.FC<{ label: string; value: number; position: string }> = ({ label, value, position }) => {
    const isLow = value < LOW_PRESSURE_THRESHOLD;
    return (
        <div className={`absolute ${position}`}>
            <div className={`w-24 h-12 rounded-lg flex flex-col items-center justify-center border-2 transition-colors ${isLow ? 'bg-yellow-900/50 border-yellow-500' : 'bg-base-900/50 border-base-700'}`}>
                <div className={`font-mono font-bold text-2xl ${isLow ? 'text-yellow-400' : 'text-white'}`}>{value.toFixed(1)}</div>
                <div className="text-xs text-gray-400">PSI</div>
            </div>
        </div>
    );
}

const TirePressureDisplay: React.FC<TirePressureDisplayProps> = ({ fl, fr, rl, rr }) => {
    return (
        <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-left text-[var(--theme-text-secondary)] mb-4">
                Tire Pressure
            </h3>
            <div className="relative w-full aspect-[2/3] flex items-center justify-center">
                {/* Car Chassis SVG */}
                <svg viewBox="0 0 100 150" className="w-40 h-60 text-base-700">
                    <path d="M20,10 C10,10 10,20 10,30 L10,120 C10,130 10,140 20,140 L80,140 C90,140 90,130 90,120 L90,30 C90,20 90,10 80,10 Z" fill="currentColor" stroke="#4A5568" strokeWidth="2" />
                    <rect x="15" y="25" width="20" height="30" rx="5" fill="#0A0B0F" />
                    <rect x="65" y="25" width="20" height="30" rx="5" fill="#0A0B0F" />
                    <rect x="15" y="95" width="20" height="30" rx="5" fill="#0A0B0F" />
                    <rect x="65" y="95" width="20" height="30" rx="5" fill="#0A0B0F" />
                </svg>

                <Tire label="FL" value={fl} position="top-0 left-0" />
                <Tire label="FR" value={fr} position="top-0 right-0" />
                <Tire label="RL" value={rl} position="bottom-0 left-0" />
                <Tire label="RR" value={rr} position="bottom-0 right-0" />
            </div>
        </div>
    );
};

export default TirePressureDisplay;
