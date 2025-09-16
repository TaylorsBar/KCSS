import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ModernGaugeProps {
    value: number;
    min: number;
    max: number;
    label: string;
    size?: 'large' | 'small';
    centerValue?: string | number;
    centerUnit?: string;
}

const ModernGauge: React.FC<ModernGaugeProps> = ({ value, min, max, label, size = 'large', centerValue, centerUnit }) => {
    const animatedValue = useAnimatedValue(value);

    const isLarge = size === 'large';
    const radius = isLarge ? 220 : 120;
    const center = radius;
    const strokeWidth = isLarge ? 2 : 1.5;
    
    // 270 degree sweep from -225 to 45 degrees
    const ANGLE_MIN = -225;
    const ANGLE_MAX = 45;
    const angleRange = ANGLE_MAX - ANGLE_MIN;

    const valueToAngle = (val: number) => {
        const valueRatio = (Math.max(min, Math.min(val, max)) - min) / (max - min);
        return ANGLE_MIN + valueRatio * angleRange;
    };

    const needleAngle = valueToAngle(animatedValue);
    const numTicks = isLarge ? 9 : 7; // e.g., 0-8 for RPM, or 7 ticks for smaller gauges

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
                     <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.5"/>
                    </filter>
                </defs>
                
                {/* 3D Bezel */}
                <circle cx={center} cy={center} r={radius} fill="#282828" />
                <circle cx={center} cy={center} r={radius * 0.95} fill="#111" />
                
                {/* Face */}
                <circle cx={center} cy={center} r={radius * 0.9} fill="url(#gauge-face-grad)" />

                {/* Ticks & Labels */}
                {Array.from({ length: numTicks }).map((_, i) => {
                    const tickValue = min + i * ((max - min) / (numTicks - 1));
                    const angle = valueToAngle(tickValue);
                    const isMajor = isLarge ? true : i % 2 === 0;

                    return (
                        <g key={i} transform={`rotate(${angle} ${center} ${center})`}>
                            {/* Major/Minor ticks */}
                            <line
                                x1={center} y1={radius * 0.1}
                                x2={center} y2={radius * (isMajor ? 0.22 : 0.18)}
                                stroke="var(--theme-accent-primary)"
                                strokeWidth={strokeWidth}
                                strokeOpacity={isMajor ? 0.9 : 0.5}
                            />
                            {/* Minor ticks between major ticks for large gauge */}
                            {isLarge && i < numTicks - 1 && Array.from({length: 4}).map((_, j) => {
                                const minorAngle = angle + ((angleRange / (numTicks - 1)) / 5) * (j + 1);
                                return (
                                    <g key={`minor-${i}-${j}`} transform={`rotate(${minorAngle - angle} ${center} ${center})`}>
                                        <line x1={center} y1={radius*0.1} x2={center} y2={radius*0.15} stroke="var(--theme-accent-primary)" strokeWidth={strokeWidth*0.75} strokeOpacity={0.3} />
                                    </g>
                                )
                            })}
                            
                            {isMajor && isLarge &&
                                <text
                                    x={center} y={radius * 0.32}
                                    textAnchor="middle"
                                    fill="var(--theme-accent-primary)"
                                    fontSize={isLarge ? "18" : "12"}
                                    transform={`rotate(180 ${center} ${radius * 0.32})`}
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
                <g transform={`rotate(${needleAngle} ${center} ${center})`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#needle-shadow)">
                    <path d={`M ${center - (isLarge ? 4 : 2.5)} ${center + (isLarge ? 20 : 12)} L ${center} ${radius * 0.1} L ${center + (isLarge ? 4 : 2.5)} ${center + (isLarge ? 20 : 12)} Z`} fill="var(--theme-accent-primary)" filter="url(#cyan-glow)" />
                </g>
                <circle cx={center} cy={center} r={radius * 0.1} fill="#111" />
                <circle cx={center} cy={center} r={radius * 0.05} fill="var(--theme-accent-primary)" />

                
                {/* Central Display for Large Gauge */}
                {isLarge &&
                    <foreignObject x="0" y="0" width={radius*2} height={radius*2}>
                        <div className="flex flex-col items-center justify-center h-full w-full pt-16">
                            <span className="font-display font-bold text-7xl text-[#00ffff] leading-none" style={{textShadow: '0 0 10px #00ffff', fontVariantNumeric: 'tabular-nums'}}>
                                {centerValue !== undefined ? String(centerValue).padStart(3,'\u00A0') : Math.round(animatedValue).toString().padStart(3,'\u00A0')}
                            </span>
                            <span className="font-sans text-xl text-[#00ffff] opacity-80 uppercase -mt-2">{centerUnit ? centerUnit : label}</span>
                        </div>
                    </foreignObject>
                }
                 {/* Label for Small Gauges */}
                 {!isLarge &&
                    <text x={center} y={center * 1.4} textAnchor="middle" fill="var(--theme-text-secondary)" className="font-sans uppercase text-sm font-bold tracking-wider">
                        {label}
                    </text>
                 }
            </svg>
        </div>
    );
};

export default ModernGauge;