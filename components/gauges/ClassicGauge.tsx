import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ClassicGaugeProps {
    label: string;
    value: number;
    min: number;
    max: number;
    unit: string;
    size: 'large' | 'small';
    coldZoneEndValue?: number;
    warningValue?: number;
    redlineValue?: number;
    dangerZone?: 'high' | 'low';
}

const sizeConfig = {
    large: { radius: 200, ticks: 9, stroke: 3, font: 20, valueFont: 60, unitFont: 20, labelFont: 16 },
    small: { radius: 100, ticks: 5, stroke: 2, font: 14, valueFont: 28, unitFont: 12, labelFont: 10 },
};

const ClassicGauge: React.FC<ClassicGaugeProps> = ({ label, value, min, max, unit, size, coldZoneEndValue, warningValue, redlineValue, dangerZone = 'high' }) => {
    const animatedValue = useAnimatedValue(value);
    const config = sizeConfig[size];
    const radius = config.radius;
    const center = radius;
    
    const ANGLE_MIN = -135;
    const ANGLE_MAX = 135;
    const angleRange = ANGLE_MAX - ANGLE_MIN;
    
    const valueRatio = (Math.max(min, Math.min(animatedValue, max)) - min) / (max - min);
    const angle = ANGLE_MIN + valueRatio * angleRange;

    const tickValue = (i: number) => min + (i / (config.ticks - 1)) * (max - min);
    
    const displayValue = unit === 'x1000' ? (animatedValue / 1000).toFixed(1) : animatedValue.toFixed(unit === '%' || unit === 'V' || unit === 'PSI' ? 0 : 1);

    return (
        <div className="relative w-full h-full filter drop-shadow-lg">
            <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="w-full h-full">
                <defs>
                    <radialGradient id="classic-chrome-bezel" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="60%" stopColor="#d0d0d0" />
                        <stop offset="85%" stopColor="#a0a0a0" />
                        <stop offset="100%" stopColor="#444444" />
                    </radialGradient>
                    <radialGradient id="classic-face-grad">
                        <stop offset="0%" stopColor="#1a1a1a" />
                        <stop offset="100%" stopColor="#000" />
                    </radialGradient>
                    <linearGradient id="classic-glare" x1="0" y1="0" x2="1" y2="1">
                         <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                         <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <filter id="classic-needle-shadow">
                        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6"/>
                    </filter>
                </defs>
                
                {/* Bezel & Face */}
                <circle cx={center} cy={center} r={radius} fill="url(#classic-chrome-bezel)" />
                <circle cx={center} cy={center} r={radius * 0.95} fill="#111" />
                <circle cx={center} cy={center} r={radius * 0.9} fill="url(#classic-face-grad)" />
                
                {/* Ticks & Numbers */}
                {Array.from({ length: config.ticks }).map((_, i) => {
                    const tv = tickValue(i);
                    const isCold = coldZoneEndValue !== undefined && tv <= coldZoneEndValue;
                    
                    let isWarning: boolean, isRedline: boolean;
                    
                    if (label === 'Voltage' && warningValue !== undefined && redlineValue !== undefined) {
                        isRedline = tv < warningValue || tv > redlineValue;
                        isWarning = false;
                    } else if (dangerZone === 'low') {
                        isRedline = redlineValue !== undefined && tv <= redlineValue;
                        isWarning = warningValue !== undefined && tv <= warningValue && !isRedline;
                    } else { // dangerZone === 'high'
                        isRedline = redlineValue !== undefined && tv >= redlineValue;
                        isWarning = warningValue !== undefined && tv >= warningValue && !isRedline;
                    }

                    const getTickColor = () => {
                        if (isRedline) return 'var(--theme-accent-red)';
                        if (isWarning) return '#facc15'; // yellow-400
                        if (isCold) return '#60a5fa'; // blue-400
                        return 'var(--theme-text-secondary)';
                    };

                     const getNumberFill = () => {
                        if (isRedline) return 'var(--theme-accent-red)';
                        if (isWarning) return '#facc15'; // yellow-400
                        return 'var(--theme-text-primary)';
                    };

                    const tickAngle = ANGLE_MIN + (i / (config.ticks - 1)) * angleRange;
                    const textAngle = tickAngle + 90;
                    const textX = center + radius * 0.7 * Math.cos(textAngle * Math.PI / 180);
                    const textY = center + radius * 0.7 * Math.sin(textAngle * Math.PI / 180);
                    
                    return (
                        <g key={`tick-${i}`}>
                            <g transform={`rotate(${tickAngle} ${center} ${center})`}>
                                <line x1={center} y1={radius * 0.1} x2={center} y2={radius * 0.2} stroke={getTickColor()} strokeWidth={config.stroke} />
                            </g>
                             <text
                                x={textX} y={textY}
                                textAnchor="middle" dominantBaseline="middle"
                                fill={getNumberFill()}
                                fontSize={config.font}
                                className="font-classic"
                            >
                                {unit === 'x1000' ? tv / 1000 : tv.toFixed(0)}
                            </text>
                        </g>
                    )
                })}

                {/* Labels and Digital Readout */}
                <text x={center} y={center - radius * 0.3} textAnchor="middle" fill="var(--theme-text-secondary)" fontSize={config.labelFont * 1.5} className="font-sans uppercase font-bold">{label}</text>
                 <foreignObject x={0} y={center + radius * 0.1} width={radius*2} height={radius*0.6}>
                     <div className="flex flex-col items-center justify-center text-center w-full h-full">
                        <div 
                           className="font-display font-bold" 
                           style={{
                                color: 'white',
                                fontSize: `${config.valueFont}px`, 
                                textShadow: `0 0 8px rgba(255,255,255,0.7)`
                            }}
                        >
                            {displayValue}
                        </div>
                        <div className="font-sans text-gray-400 -mt-1" style={{fontSize: `${config.unitFont}px`}}>{unit}</div>
                    </div>
                </foreignObject>

                {/* Needle */}
                <g transform={`rotate(${angle} ${center} ${center})`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#classic-needle-shadow)">
                    <path 
                        d={`M ${center} ${center + radius * 0.1} L ${center} ${radius * 0.15}`}
                        stroke="#facc15" // yellow-400
                        strokeWidth={config.stroke + 2}
                        strokeLinecap="round"
                    />
                </g>
                
                {/* Pivot */}
                <circle cx={center} cy={center} r={radius * (size === 'large' ? 0.12 : 0.08)} fill="var(--theme-accent-red)" />
                <circle cx={center} cy={center} r={radius * (size === 'large' ? 0.06 : 0.04)} fill="#000" />


                {/* Glare */}
                <path d={`M ${center-radius*0.9} ${center-radius*0.1} A ${radius} ${radius} 0 0 1 ${center+radius*0.3} ${center-radius*0.8}`} fill="url(#classic-glare)" />
            </svg>
        </div>
    );
};

export default ClassicGauge;