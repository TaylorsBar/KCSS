import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ModernGaugeProps {
    value: number;
    min: number;
    max: number;
    label: string;
    size?: 'large' | 'small';
}

const ModernGauge: React.FC<ModernGaugeProps> = ({ value, min, max, label, size = 'large' }) => {
    const animatedValue = useAnimatedValue(value);

    const isLarge = size === 'large';
    const radius = isLarge ? 150 : 80;
    const center = radius;
    const strokeWidth = isLarge ? 2 : 1.5;
    
    const ANGLE_MIN = -225;
    const ANGLE_MAX = 45;
    const angleRange = ANGLE_MAX - ANGLE_MIN;

    const valueToAngle = (val: number) => {
        const valueRatio = (Math.max(min, Math.min(val, max)) - min) / (max - min);
        return ANGLE_MIN + valueRatio * angleRange;
    };

    const needleAngle = valueToAngle(animatedValue);
    const numTicks = isLarge ? 9 : 7;

    return (
        <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
            <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="w-full h-full">
                <defs>
                    <filter id="cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <radialGradient id="gauge-face-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#151820" />
                        <stop offset="100%" stopColor="#0d1018" />
                    </radialGradient>
                </defs>
                
                {/* Face */}
                <circle cx={center} cy={center} r={radius} fill="url(#gauge-face-grad)" />
                <circle cx={center} cy={center} r={radius * 0.98} fill="#0d1018" />

                {/* Ticks & Labels */}
                {Array.from({ length: numTicks }).map((_, i) => {
                    const tickValue = min + i * ((max - min) / (numTicks - 1));
                    const angle = valueToAngle(tickValue);
                    const isMajor = isLarge ? true : i % 2 === 0;

                    return (
                        <g key={i} transform={`rotate(${angle} ${center} ${center})`}>
                            <line
                                x1={center} y1={radius * 0.05}
                                x2={center} y2={radius * (isMajor ? 0.2 : 0.15)}
                                stroke="#00ffff"
                                strokeWidth={strokeWidth}
                                strokeOpacity={isMajor ? 0.8 : 0.4}
                            />
                            {isMajor &&
                                <text
                                    x={center} y={radius * 0.3}
                                    textAnchor="middle"
                                    fill="#00ffff"
                                    fontSize={isLarge ? "18" : "12"}
                                    transform={`rotate(180 ${center} ${radius * 0.3})`}
                                    className="font-sans"
                                    opacity="0.9"
                                >
                                    {label === 'RPM' ? tickValue / 1000 : tickValue.toFixed(0)}
                                </text>
                            }
                        </g>
                    );
                })}

                {/* Needle */}
                <g transform={`rotate(${needleAngle} ${center} ${center})`} style={{ transition: 'transform 0.1s ease-out' }}>
                    <path d={`M ${center} ${center + radius * 0.1} L ${center} ${radius * 0.15}`} stroke="#00ffff" strokeWidth={isLarge ? 4 : 3} strokeLinecap="round" filter="url(#cyan-glow)" />
                </g>
                <circle cx={center} cy={center} r={radius * 0.1} fill="#111" />
                <circle cx={center} cy={center} r={radius * 0.08} fill="#000" />
                
                {isLarge &&
                    <foreignObject x="0" y="0" width={radius*2} height={radius*2}>
                        <div className="flex flex-col items-center justify-center h-full w-full pt-16">
                            <span className="font-sans text-xl text-[#00ffff] opacity-80 uppercase">{label}</span>
                            <span className="font-display font-bold text-6xl text-[#00ffff]" style={{textShadow: '0 0 10px #00ffff'}}>
                                {animatedValue.toFixed(0)}
                            </span>
                        </div>
                    </foreignObject>
                }
            </svg>
        </div>
    );
};

export default ModernGauge;
