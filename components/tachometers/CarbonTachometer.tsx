

import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { useSweepValue } from '../../hooks/useSweepValue';

interface CarbonTachometerProps {
  rpm: number;
  speed: number;
  gear: number;
  speedUnit: string;
}

const RPM_MAX = 8000;
const REDLINE_START = 7000;
const START_ANGLE = -160;
const END_ANGLE = 160;
const ANGLE_RANGE = END_ANGLE - START_ANGLE;

const CarbonTachometer: React.FC<CarbonTachometerProps> = ({ rpm, speed, gear, speedUnit }) => {
  const sweptRpm = useSweepValue(rpm, 0, RPM_MAX);
  const animatedRpm = useAnimatedValue(sweptRpm);
  const animatedSpeed = useAnimatedValue(speed);

  const valueToAngle = (val: number, min: number, max: number) => {
    const ratio = Math.max(0, Math.min(val, max)) / (max - min);
    return START_ANGLE + ratio * ANGLE_RANGE;
  };
  
  const needleAngle = valueToAngle(animatedRpm, 0, RPM_MAX);

  const needleColor = animatedRpm >= REDLINE_START ? 'var(--theme-accent-red)' : 'var(--theme-accent-primary)';
  const gearDisplay = gear === 0 ? 'N' : gear;

  return (
    <div className="relative h-full aspect-square">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
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
            <filter id="gearGlow">
                <feGaussianBlur stdDeviation="12" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
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
            const isMajorTick = i > 0;
            return (
                <g key={`tick-${i}`} transform={`rotate(${angle} 200 200)`}>
                    <line x1="200" y1="25" x2="200" y2={isMajorTick ? "40" : "35"} stroke={isRed ? 'var(--theme-accent-red)' : 'rgba(255,255,255,0.5)'} strokeWidth={isMajorTick ? "2" : "1.5"} />
                     {isMajorTick && i <= 5 && <text
                        x="200"
                        y="60"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.7)"
                        fontSize="28"
                        transform="rotate(180 200 60)"
                        className="font-display font-bold"
                     >
                        {i}
                    </text>}
                </g>
            )
        })}
        <path d={valueToAngle(REDLINE_START, 0, RPM_MAX) < END_ANGLE ? `M ${200 + 170 * Math.cos((valueToAngle(REDLINE_START, 0, RPM_MAX)-90) * Math.PI/180)} ${200 + 170 * Math.sin((valueToAngle(REDLINE_START, 0, RPM_MAX)-90) * Math.PI/180)} A 170 170 0 0 1 ${200 + 170 * Math.cos((END_ANGLE-90) * Math.PI/180)} ${200 + 170 * Math.sin((END_ANGLE-90) * Math.PI/180)}` : ''} stroke="var(--theme-accent-red)" strokeWidth="4" fill="none" />

        {/* Central Display */}
        <foreignObject x="0" y="0" width="400" height="400">
            <div className="w-full h-full flex flex-col items-center justify-center pt-8">
                {/* Gear */}
                <div className="font-display font-black text-[12rem] leading-none" style={{color: 'var(--theme-accent-primary)', filter: 'url(#gearGlow)'}}>
                    {gearDisplay}
                </div>
                {/* Speed display */}
                <div className="w-32 h-16 mt-4 bg-black/50 border border-[var(--theme-accent-primary)]/30 rounded-md flex flex-col items-center justify-center p-1">
                    <div className="font-mono text-4xl text-white tracking-wider leading-none">{animatedSpeed.toFixed(1)}</div>
                    <div className="font-sans text-sm text-gray-400 uppercase">{speedUnit}</div>
                </div>
            </div>
        </foreignObject>

        {/* Needle */}
        <g transform={`rotate(${needleAngle} 200 200)`} style={{ transition: 'transform 0.1s cubic-bezier(.4, 0, .2, 1)' }}>
            <path d="M 200 210 L 200 30" stroke={needleColor} strokeWidth="3" style={{filter: 'drop-shadow(0 0 8px ' + needleColor + ')'}} />
        </g>
        <circle cx="200" cy="200" r="12" fill="#222" stroke="#444" strokeWidth="2" />

        {/* Indicator Lights */}
        <g transform="translate(340, 180)">
             <path d="M 0 10 L 10 0 L 10 5 L 20 5 L 20 15 L 10 15 L 10 20 Z" fill={animatedSpeed > 0 && Math.floor(Date.now() / 500) % 2 === 0 ? 'var(--theme-accent-green)' : 'rgba(0, 255, 0, 0.1)'} style={{transition: 'fill 0.1s linear'}}/>
             <path transform="translate(0, 30)" d="M12 2L2 22h20L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z" fill={'rgba(255, 0, 0, 0.1)'}/>
        </g>
      </svg>
    </div>
  );
};

export default CarbonTachometer;
