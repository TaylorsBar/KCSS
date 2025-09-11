import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ClassicTachometerProps {
  rpm: number;
  speed: number;
}

const ClassicTachometer: React.FC<ClassicTachometerProps> = ({ rpm, speed }) => {
  const animatedRpm = useAnimatedValue(rpm);
  const animatedSpeed = useAnimatedValue(speed);
  
  const RPM_MAX = 8000;
  const ANGLE_MIN = -150;
  const ANGLE_MAX = 150;
  const rpmRange = RPM_MAX;
  const rpmValueRatio = (Math.max(0, Math.min(animatedRpm, RPM_MAX))) / rpmRange;
  const rpmAngle = ANGLE_MIN + rpmValueRatio * (ANGLE_MAX - ANGLE_MIN);

  const SPEED_MAX = 280;
  const speedValueRatio = (Math.max(0, Math.min(animatedSpeed, SPEED_MAX))) / SPEED_MAX;
  const speedAngle = ANGLE_MIN + speedValueRatio * (ANGLE_MAX - ANGLE_MIN);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center filter drop-shadow-lg">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
            <radialGradient id="classic-bezel-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0.9" stopColor="#e0e0e0" />
                <stop offset="0.95" stopColor="#ffffff" />
                <stop offset="1" stopColor="#888888" />
            </radialGradient>
            <filter id="classic-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="classic-tacho-needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.7"/>
            </filter>
        </defs>
        
        {/* Bezel & Face */}
        <circle cx="200" cy="200" r="200" fill="url(#classic-bezel-grad)" />
        <circle cx="200" cy="200" r="190" fill="#222" />
        <circle cx="200" cy="200" r="185" fill="var(--theme-gauge-face)" stroke="#000" strokeWidth="2" />
        <circle cx="200" cy="200" r="185" fill="var(--theme-glow-color)" opacity="0.1" filter="url(#classic-glow)" />

        {/* RPM Ticks & Labels */}
        {Array.from({ length: 9 }).map((_, i) => {
            const tickValue = i * 1000;
            const tickRatio = tickValue / rpmRange;
            const tickAngle = ANGLE_MIN + tickRatio * (ANGLE_MAX - ANGLE_MIN);
            
            return (
                <g key={`rpm-tick-${i}`} transform={`rotate(${tickAngle} 200 200)`}>
                    <line x1="200" y1="25" x2="200" y2="40" stroke="var(--theme-gauge-text)" strokeWidth="3" />
                    <text
                        x="200" y="60"
                        textAnchor="middle"
                        fill="var(--theme-gauge-text)"
                        fontSize="20"
                        transform="rotate(180 200 60)"
                        className="font-sans font-bold"
                    >
                        {i}
                    </text>
                </g>
            )
        })}
        <text x="200" y="100" textAnchor="middle" fill="var(--theme-text-secondary)" className="font-sans font-bold uppercase" fontSize="16">x1000 RPM</text>

        {/* Speed Ticks */}
        {Array.from({ length: 15 }).map((_, i) => {
            const tickValue = i * 20;
            const tickRatio = tickValue / SPEED_MAX;
            const tickAngle = ANGLE_MIN + tickRatio * (ANGLE_MAX - ANGLE_MIN);
            const isMajor = i % 2 === 0;

            return (
                 <g key={`speed-tick-${i}`} transform={`rotate(${tickAngle} 200 200)`}>
                    <line x1="200" y1="170" x2="200" y2={isMajor ? "160" : "165"} stroke="var(--theme-text-secondary)" strokeWidth="2" />
                </g>
            )
        })}

        {/* Digital Speed & Gear */}
        <foreignObject x="125" y="250" width="150" height="80">
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <div className="font-display font-bold text-6xl text-white" style={{textShadow: '0 0 5px #fff'}}>{speed.toFixed(0)}</div>
                <div className="font-sans text-lg text-gray-400 -mt-2">km/h</div>
            </div>
        </foreignObject>

        {/* RPM Needle */}
        <g transform={`rotate(${rpmAngle} 200 200)`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#classic-tacho-needle-shadow)">
            <path d="M 199 200 L 200 30 L 201 200 Z" fill="var(--theme-needle-color)" />
            <path d="M 198 200 L 200 230 L 202 200 Z" fill="var(--theme-needle-color)" />
        </g>
        <circle cx="200" cy="200" r="18" fill="#444" stroke="#111" strokeWidth="2" />
        <circle cx="200" cy="200" r="10" fill="#222" />
        <circle cx="200" cy="200" r="4" fill="#111" />
      </svg>
    </div>
  );
};

export default ClassicTachometer;