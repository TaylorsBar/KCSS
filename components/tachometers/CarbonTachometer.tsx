import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface CarbonTachometerProps {
  rpm: number;
  speed: number;
  gear: number;
  speedUnit: string;
}

const RPM_MAX = 8000;
const REDLINE_START = 6500;
const START_ANGLE = -135;
const END_ANGLE = 135;
const ANGLE_RANGE = END_ANGLE - START_ANGLE;

const CarbonTachometer: React.FC<CarbonTachometerProps> = ({ rpm, speed, gear, speedUnit }) => {
  const animatedRpm = useAnimatedValue(rpm);
  const animatedSpeed = useAnimatedValue(speed);

  const valueToAngle = (val: number, min: number, max: number) => {
    const ratio = Math.max(0, Math.min(val, max)) / (max - min);
    return START_ANGLE + ratio * ANGLE_RANGE;
  };
  
  const needleAngle = valueToAngle(animatedRpm, 0, RPM_MAX);

  return (
    <div className="relative w-full h-full max-w-[500px] aspect-square">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
            {/* Carbon Fiber Pattern */}
            <pattern id="carbonPattern" patternUnits="userSpaceOnUse" width="12" height="12">
                <path d="M0 0 H12 V12 H0Z" fill="#111115"/>
                <path d="M0 0 H6 V6 H0Z" fill="#222228"/>
                <path d="M6 6 H12 V12 H6Z" fill="#222228"/>
            </pattern>
            {/* Brushed Metal Gradient for Bezel */}
            <linearGradient id="brushedMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d0d0d0"/>
                <stop offset="25%" stopColor="#a0a0a0"/>
                <stop offset="50%" stopColor="#707070"/>
                <stop offset="75%" stopColor="#a0a0a0"/>
                <stop offset="100%" stopColor="#d0d0d0"/>
            </linearGradient>
            {/* Glass Glare Effect */}
            <linearGradient id="glassGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.2"/>
                <stop offset="50%" stopColor="white" stopOpacity="0.05"/>
                <stop offset="100%" stopColor="white" stopOpacity="0.2"/>
            </linearGradient>
            {/* Needle Shadow Filter */}
            <filter id="needleShadow">
                <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.7"/>
            </filter>
        </defs>
        
        {/* Bezel */}
        <circle cx="200" cy="200" r="200" fill="url(#brushedMetal)" />
        <circle cx="200" cy="200" r="195" fill="#222" />
        
        {/* Face */}
        <circle cx="200" cy="200" r="185" fill="url(#carbonPattern)" />
        
        {/* Ticks and Numbers */}
        {Array.from({ length: 9 }).map((_, i) => {
            const r = i * 1000;
            const angle = valueToAngle(r, 0, RPM_MAX);
            const isRed = r >= REDLINE_START;
            const isMajorTick = i % 1 === 0;
            return (
                <g key={`tick-${i}`} transform={`rotate(${angle} 200 200)`}>
                    <line x1="200" y1="25" x2="200" y2={isMajorTick ? "45" : "35"} stroke={isRed ? 'var(--theme-accent-red)' : 'var(--brand-cyan)'} strokeWidth="3" />
                     {isMajorTick && <text
                        x="200"
                        y="65"
                        textAnchor="middle"
                        fill={isRed ? 'var(--theme-accent-red)' : 'var(--brand-cyan)'}
                        fontSize="28"
                        transform="rotate(180 200 65)"
                        className="font-display font-bold"
                     >
                        {i}
                    </text>}
                </g>
            )
        })}

        {/* Digital Displays */}
        <foreignObject x="150" y="120" width="100" height="80">
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <div className="font-display font-black text-7xl leading-none" style={{color: 'var(--theme-accent-primary)', textShadow: '0 0 8px var(--theme-glow-color)'}}>
                    {gear === 0 ? 'N' : gear}
                </div>
            </div>
        </foreignObject>
        <foreignObject x="100" y="180" width="200" height="150">
            <div className="flex flex-col items-center justify-center text-center text-white w-full h-full">
                <div className="font-display font-black text-8xl leading-none" style={{textShadow: '0 0 10px #fff'}}>{Math.round(animatedSpeed)}</div>
                <div className="font-sans font-bold text-2xl text-gray-400 -mt-2">{speedUnit}</div>
            </div>
        </foreignObject>
        
        {/* Needle */}
        <g transform={`rotate(${needleAngle} 200 200)`} style={{ transition: 'transform 0.1s cubic-bezier(.4, 0, .2, 1)' }} filter="url(#needleShadow)">
          <path d="M 199 215 L 198 40 L 202 40 L 201 215 A 15 15 0 0 1 199 215 Z" fill="var(--brand-cyan)" />
        </g>
        <circle cx="200" cy="200" r="20" fill="#333" stroke="#555" strokeWidth="2" />
        
        {/* Glass Glare Overlay */}
        <circle cx="200" cy="200" r="185" fill="url(#glassGlare)" />
      </svg>
    </div>
  );
};

export default CarbonTachometer;