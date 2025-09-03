
import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface KarapiroGaugeProps {
    rpm: number;
    speed: number;
    distance: number;
}

const KarapiroGauge: React.FC<KarapiroGaugeProps> = ({ rpm, speed, distance }) => {
    const animatedRpm = useAnimatedValue(rpm);
    const animatedSpeed = useAnimatedValue(speed);
    const tripDistance = ((distance / 1000) % 1000).toFixed(0).padStart(3, '0');

    const RPM_FOR_ANGLE_MAX = 9000;
    const ANGLE_MIN = -150; 
    const ANGLE_MAX = 150;
    const angleRange = ANGLE_MAX - ANGLE_MIN;

    const valueToAngle = (val: number) => {
        const valueRatio = (Math.max(0, Math.min(val, RPM_FOR_ANGLE_MAX))) / RPM_FOR_ANGLE_MAX;
        return ANGLE_MIN + valueRatio * angleRange;
    };
    
    const needleAngle = valueToAngle(animatedRpm);

    const describeArc = (x:number, y:number, radius:number, startAngle:number, endAngle:number) => {
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const start = { x: x + radius * Math.cos(startRad), y: y + radius * Math.sin(startRad) };
        const end = { x: x + radius * Math.cos(endRad), y: y + radius * Math.sin(endRad) };
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    const redlineStartAngle = valueToAngle(6500);

    return (
        <div className="w-full max-w-[500px] aspect-square">
            <svg viewBox="0 0 500 500" className="w-full h-full font-sans">
                <defs>
                    <radialGradient id="h-bezel" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                        <stop offset="90%" stopColor="#222" />
                        <stop offset="100%" stopColor="#444" />
                    </radialGradient>
                    <linearGradient id="h-needle" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff4d4d" />
                        <stop offset="50%" stopColor="#ff0000" />
                        <stop offset="100%" stopColor="#b30000" />
                    </linearGradient>
                    <linearGradient id="h-display-bg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#444" />
                        <stop offset="100%" stopColor="#333" />
                    </linearGradient>
                    <filter id="h-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.7"/>
                    </filter>
                </defs>

                <circle cx="250" cy="250" r="250" fill="#0a0a0a" />
                <circle cx="250" cy="250" r="245" fill="url(#h-bezel)" />
                <circle cx="250" cy="250" r="235" fill="#1a1a1a" />

                <path d={describeArc(250, 250, 190, ANGLE_MIN, ANGLE_MAX)} fill="none" stroke="var(--theme-haltech-yellow)" strokeWidth="80" />
                <path d={describeArc(250, 250, 190, redlineStartAngle, valueToAngle(8200))} fill="none" stroke="var(--theme-haltech-red)" strokeWidth="80" />

                {Array.from({ length: 9 }).map((_, i) => {
                    if (i === 0) return null;
                    const tickVal = i * 1000;
                    const angle = valueToAngle(tickVal);
                    const isRed = tickVal >= 7000;
                    return (
                        <g key={`num-${i}`} transform={`rotate(${angle} 250 250)`}>
                            <text x="250" y="90" textAnchor="middle" dominantBaseline="central" fill={isRed ? 'white' : 'black'} fontSize="48" fontWeight="900" transform={`rotate(180 250 90)`}>{i}</text>
                        </g>
                    );
                })}
                {Array.from({ length: 41 }).map((_, i) => {
                    const tickVal = i * 200;
                    if (tickVal >= 8200) return null;
                    const angle = valueToAngle(tickVal);
                    const isMajor = i % 5 === 0;
                    return (
                         <g key={`tick-${i}`} transform={`rotate(${angle} 250 250)`}>
                             <line x1="250" y1="55" x2="250" y2={isMajor ? 70 : 65} stroke="#000" strokeWidth="2" opacity="0.8"/>
                         </g>
                    );
                })}

                <circle cx="250" cy="250" r="148" fill="none" stroke="#000" strokeWidth="2" />
                <circle cx="250" cy="250" r="142" fill="none" stroke="var(--theme-haltech-yellow)" strokeWidth="3" opacity="0.6" />
                <circle cx="250" cy="250" r="138" fill="none" stroke="#000" strokeWidth="2" />

                <text x="250" y="180" textAnchor="middle" fontFamily="Orbitron, sans-serif" fontStyle="italic" fontWeight="900" fontSize="36" fill="var(--theme-haltech-yellow)" stroke="#000" strokeWidth="1">
                    Haltech
                </text>
                
                <g transform="translate(260, 280)">
                    <path d="M 0 0 H 180 L 190 10 V 110 L 180 120 H 0 L -10 110 V 10 Z" fill="url(#h-display-bg)" stroke="#222" strokeWidth="2" />
                    <path d="M 2 2 H 178 L 187 11 V 109 L 178 118 H 2 L -7 109 V 11 Z" fill="none" stroke="#555" strokeWidth="2" />
                    
                    <foreignObject x="0" y="0" width="190" height="120">
                        <div className="w-full h-full flex flex-col items-center p-2 font-mono text-white select-none">
                            <div className="flex-1 w-full text-right border-b border-gray-500/50 flex items-baseline justify-end pr-2">
                                <span className="text-6xl font-bold">{animatedRpm > 9999 ? '----' : animatedRpm.toFixed(0)}</span>
                                <span className="text-xl ml-2 mb-1">RPM</span>
                            </div>
                            <div className="flex-1 w-full flex">
                                <div className="w-2/3 h-full flex items-baseline justify-end text-right pr-2">
                                    <span className="text-4xl font-bold">{animatedSpeed.toFixed(0)}</span>
                                    <span className="text-lg ml-1 mb-1">km</span>
                                </div>
                                <div className="w-1/3 h-full flex items-end justify-end border-l border-gray-500/50 pl-2">
                                    <span className="text-xl font-bold">{tripDistance}</span>
                                </div>
                            </div>
                        </div>
                    </foreignObject>
                </g>

                <g transform={`rotate(${needleAngle} 250 250)`} style={{ transition: 'transform 0.05s linear' }} filter="url(#h-shadow)">
                    <path d="M 250 480 L 245 260 L 255 260 Z" fill="#222" />
                    <path d="M 250 265 L 247 60 L 253 60 Z" fill="url(#h-needle)" />
                    <circle cx="250" cy="250" r="12" fill="url(#h-needle)" />
                    <circle cx="250" cy="250" r="10" fill="#ff0000" />
                </g>
                <circle cx="250" cy="250" r="20" fill="#1a1a1a" />
            </svg>
        </div>
    );
};


const HaltechDashboard: React.FC = () => {
    const { latestData } = useVehicleData();
    return (
        <div className="flex h-full w-full items-center justify-center p-4 theme-background haltech-ic7-background">
            <KarapiroGauge
                rpm={latestData.rpm}
                speed={latestData.speed}
                distance={latestData.distance}
            />
        </div>
    );
};

export default HaltechDashboard;
