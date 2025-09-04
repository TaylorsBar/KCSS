
import React from 'react';

const HaltechDashboard: React.FC = () => {

    const SvgDefs = () => (
        <defs>
            <radialGradient id="ic7-bezel-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="90%" stopColor="#222" />
                <stop offset="98%" stopColor="#666" />
                <stop offset="100%" stopColor="#333" />
            </radialGradient>
            <radialGradient id="ic7-bezel-inner-sheen" cx="50%" cy="50%" r="50%" fx="50%" fy="30%">
                <stop offset="90%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </radialGradient>
            <linearGradient id="ic7-display-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
             <linearGradient id="ic7-housing-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#252525" />
                <stop offset="50%" stopColor="#383838" />
                <stop offset="100%" stopColor="#252525" />
            </linearGradient>
        </defs>
    );

    const SideDisplayCluster = ({ transform }: { transform?: string }) => {
        const displays = [
            { y: 80, height: 80 },
            { y: 180, height: 80 },
            { y: 280, height: 80 },
            { y: 380, height: 80 },
        ];
        return (
            <g transform={transform}>
                {/* Main Housing Shape */}
                <path 
                    d="M 320 60 C 310 60, 280 90, 280 150 L 280 450 C 280 510, 310 540, 320 540 L 40 540 L 40 60 Z"
                    fill="url(#ic7-housing-grad)"
                    stroke="#111"
                    strokeWidth="2"
                />
                <path 
                    d="M 315 65 C 305 65, 285 95, 285 150 L 285 450 C 285 505, 305 535, 315 535 L 45 535 L 45 65 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                />
                
                {displays.map((disp, i) => (
                    <g key={i} transform={`translate(60, ${disp.y})`}>
                        {/* Display Frame */}
                        <rect x="0" y="0" width="220" height={disp.height} rx="5" fill="#111" />
                        {/* Display Screen */}
                        <rect x="5" y="5" width="210" height={disp.height - 10} rx="3" fill="url(#ic7-display-grad)" />
                         {/* Icon Area */}
                        <rect x="5" y="5" width="40" height={disp.height - 10} rx="3" fill="#2a2a2e" />
                    </g>
                ))}
            </g>
        );
    };

    const BottomRightDisplays = () => (
        <g transform="translate(680, 370)">
            {/* Housing for the cluster */}
            <path d="M 0 0 H 160 V 10 L 170 20 V 110 L 160 120 H 0 L -10 110 V 10 Z" fill="#222" />
            
            {/* Top two small displays */}
            <rect x="5" y="5" width="70" height="50" rx="3" fill="url(#ic7-display-grad)" stroke="#111" />
            <rect x="85" y="5" width="70" height="50" rx="3" fill="url(#ic7-display-grad)" stroke="#111" />
            
            {/* Bottom large display */}
            <rect x="5" y="65" width="150" height="50" rx="3" fill="url(#ic7-display-grad)" stroke="#111" />
        </g>
    );

    return (
        <div className="flex h-full w-full items-center justify-center p-4 theme-background bg-[#111]">
            <svg viewBox="0 0 1200 600" className="w-full max-w-6xl font-sans">
                <SvgDefs />

                {/* Left and Right Side Displays */}
                <SideDisplayCluster />
                <SideDisplayCluster transform="translate(1200, 0) scale(-1, 1)" />

                {/* Main Bezel */}
                <circle cx="600" cy="300" r="280" fill="url(#ic7-bezel-grad)" />
                <circle cx="600" cy="300" r="275" fill="#1a1a1a" />
                <circle cx="600" cy="300" r="255" fill="#333" />
                <circle cx="600" cy="300" r="250" fill="url(#ic7-bezel-grad)" />
                <circle cx="600" cy="300" r="248" fill="#111" />
                <circle cx="600" cy="300" r="245" fill="url(#ic7-bezel-inner-sheen)" />

                {/* Central Display */}
                <circle cx="600" cy="300" r="245" fill="black" />

                {/* Logos */}
                <g transform="translate(600, 250)">
                    <rect x="-45" y="-30" width="90" height="40" rx="5" fill="none" stroke="white" strokeWidth="2" />
                    <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="32" fontWeight="bold">
                        iC-7
                    </text>
                </g>
                 <text x="600" y="320" textAnchor="middle" dominantBaseline="middle" fill="var(--theme-haltech-yellow)" fontFamily="Orbitron, sans-serif" fontStyle="italic" fontWeight="900" fontSize="56" stroke="#000" strokeWidth="1">
                    Haltech
                </text>
                
                {/* Bottom Right Inset Displays */}
                <BottomRightDisplays />
            </svg>
        </div>
    );
};

export default HaltechDashboard;
