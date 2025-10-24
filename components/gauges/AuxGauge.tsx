import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface AuxGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

const START_ANGLE = -135;
const END_ANGLE = 135;
const ANGLE_RANGE = END_ANGLE - START_ANGLE;

const AuxGauge: React.FC<AuxGaugeProps> = ({ label, value, min, max, unit }) => {
  const animatedValue = useAnimatedValue(value);

  const valueToAngle = (val: number) => {
    const ratio = (Math.max(min, Math.min(val, max)) - min) / (max - min);
    return START_ANGLE + ratio * ANGLE_RANGE;
  };
  
  const needleAngle = valueToAngle(animatedValue);
  const numTicks = 5;

  return (
    <div className="relative w-full aspect-square">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
            {/* Using definitions from CarbonTachometer, assuming they are globally available or passed down */}
            <pattern id="carbonPattern" patternUnits="userSpaceOnUse" width="12" height="12">
                <path d="M0 0 H12 V12 H0Z" fill="#111115"/>
                <path d="M0 0 H6 V6 H0Z" fill="#222228"/>
                <path d="M6 6 H12 V12 H6Z" fill="#222228"/>
            </pattern>
            <linearGradient id="brushedMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d0d0d0"/>
                <stop offset="25%" stopColor="#a0a0a0"/>
                <stop offset="50%" stopColor="#707070"/>
                <stop offset="75%" stopColor="#a0a0a0"/>
                <stop offset="100%" stopColor="#d0d0d0"/>
            </linearGradient>
            <linearGradient id="glassGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
                <stop offset="50%" stopColor="white" stopOpacity="0.02"/>
                <stop offset="100%" stopColor="white" stopOpacity="0.1"/>
            </linearGradient>
             <filter id="auxNeedleShadow">
                <feDropShadow dx="0.5" dy="0.5" stdDeviation="1" floodColor="#000" floodOpacity="0.7"/>
            </filter>
        </defs>
        
        <circle cx="100" cy="100" r="100" fill="url(#brushedMetal)" />
        <circle cx="100" cy="100" r="97" fill="#222" />
        <circle cx="100" cy="100" r="92" fill="url(#carbonPattern)" />
        
        {Array.from({ length: numTicks }).map((_, i) => {
            const tickValue = min + i * ((max-min) / (numTicks - 1));
            const angle = valueToAngle(tickValue);
            return (
                <g key={`tick-${i}`} transform={`rotate(${angle} 100 100)`}>
                    <line x1="100" y1="15" x2="100" y2="25" stroke={'var(--brand-cyan)'} strokeWidth="2" />
                </g>
            )
        })}

        <text x="100" y="80" textAnchor="middle" fill="var(--brand-cyan)" fontSize="18" className="font-display uppercase font-bold">{label}</text>
        
        <foreignObject x="50" y="95" width="100" height="50">
            <div className="flex flex-col items-center justify-center text-center text-white w-full h-full">
                <div className="font-display font-bold text-3xl leading-none" style={{textShadow: '0 0 5px #fff'}}>
                    {animatedValue.toFixed(unit === '%' || unit === 'v' || unit === 'ratio' ? 1 : 0)}
                </div>
                <div className="font-sans text-sm text-gray-400 -mt-1">{unit}</div>
            </div>
        </foreignObject>
        
        <g transform={`rotate(${needleAngle} 100 100)`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#auxNeedleShadow)">
          <path d="M 99 110 L 99 28 L 101 28 L 101 110 Z" fill="var(--brand-cyan)" />
        </g>
        <circle cx="100" cy="100" r="10" fill="#333" stroke="#555" strokeWidth="1" />
        
        <circle cx="100" cy="100" r="92" fill="url(#glassGlare)" />
      </svg>
    </div>
  );
};

export default AuxGauge;