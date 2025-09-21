
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
                     <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.5"/>
                    </filter>
                    <pattern id="carbon-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
                        <image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMzYTNhM2EiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyMjIiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgeDE9IjAiIHgyPSIxIiB5MT0iMCIgeTI9IjAiPjxzdG9vcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM0NDQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyMjIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9InVybCgjYSkiLz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHg9IjIwIiBmaWxsPSJ1cmwoI2IpIiLz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHk9IjIwIiBmaWxsPSJ1cmwoI2IpIiLz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHg9IjIwIiB5PSIyMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==" x="0" y="0" width="10" height="10" />
                    </pattern>
                    <radialGradient id="carbon-sheen" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                    </radialGradient>
                    <filter id="inner-shadow">
                        <feOffset dx="0" dy="4" />
                        <feGaussianBlur stdDeviation="4" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="black" floodOpacity="0.7" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                </defs>
                
                {/* 3D Bezel */}
                <circle cx={center} cy={center} r={radius} fill="#282828" />
                <circle cx={center} cy={center} r={radius * 0.95} fill="#111" filter="url(#inner-shadow)" />
                
                {/* Face */}
                <circle cx={center} cy={center} r={radius * 0.9} fill="url(#carbon-pattern)" />
                <circle cx={center} cy={center} r={radius * 0.9} fill="url(#carbon-sheen)" />


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
                            
                            {isMajor &&
                                <text
                                    x={center} y={isLarge ? radius * 0.32 : radius * 0.4}
                                    textAnchor="middle"
                                    fill="var(--theme-accent-primary)"
                                    fontSize={isLarge ? "18" : "14"}
                                    transform={`rotate(180 ${center} ${isLarge ? radius * 0.32 : radius * 0.4})`}
                                    className="font-sans"
                                    opacity="0.9"
                                >
                                    {label === 'RPM' ? tickValue / 1000 : tickValue.toFixed(0)}
                                </text>
                            }
                        </g>
                    );
                })}
                
                {/* Glare effect */}
                <path d={`M ${center - radius*0.7} ${center - radius*0.3} C ${center - radius*0.5} ${center - radius*0.8}, ${center + radius*0.5} ${center - radius*0.8}, ${center + radius*0.7} ${center - radius*0.3}`} fill="rgba(255,255,255,0.05)" />


                {/* Needle */}
                <g transform={`rotate(${needleAngle} ${center} ${center})`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#needle-shadow)">
                    <path d={`M ${center - (isLarge ? 4 : 2.5)} ${center + (isLarge ? 20 : 12)} L ${center} ${radius * 0.1} L ${center + (isLarge ? 4 : 2.5)} ${center + (isLarge ? 20 : 12)} Z`} fill="var(--theme-accent-primary)" filter="url(#cyan-glow)" />
                </g>
                <circle cx={center} cy={center} r={radius * 0.1} fill="#111" />
                <circle cx={center} cy={center} r={radius * 0.05} fill="var(--theme-accent-primary)" />

                
                {/* Central Display for Large Gauge */}
                {isLarge &&
                    <foreignObject x="0" y="0" width={radius*2} height={radius*2}>
                        <div className="flex flex-col items-center justify-center h-full w-full pt-16 pl-8">
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