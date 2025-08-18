import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ClassicTachometerProps {
  rpm: number;
}

const RPM_MAX = 8000;
const ANGLE_MIN = -135;
const ANGLE_MAX = 135;

const ClassicTachometer: React.FC<ClassicTachometerProps> = ({ rpm }) => {
    const animatedRpm = useAnimatedValue(rpm);
    const valueRatio = Math.max(0, Math.min(animatedRpm, RPM_MAX)) / RPM_MAX;
    const angle = ANGLE_MIN + valueRatio * (ANGLE_MAX - ANGLE_MIN);

    return (
        <div className="relative w-full max-w-xs aspect-square">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="100" style={{ fill: 'var(--theme-gauge-bezel)' }} />
                <circle cx="100" cy="100" r="90" fill="var(--theme-gauge-face)" stroke="#888" strokeWidth="1" />

                {/* Ticks and Labels */}
                {Array.from({ length: 9 }).map((_, i) => {
                    const r = i * 1000;
                    const tickAngle = ANGLE_MIN + (i / 8) * (ANGLE_MAX - ANGLE_MIN);
                    const isMajorTick = i % 1 === 0;
                    return (
                        <g key={`tick-${i}`}>
                            <line
                                transform={`rotate(${tickAngle} 100 100)`}
                                x1="100" y1="20" x2="100" y2={isMajorTick ? "30" : "25"}
                                stroke="var(--theme-gauge-text)" strokeWidth="2"
                            />
                            { isMajorTick &&
                                <text
                                    x={100 + 75 * Math.cos((tickAngle - 90) * Math.PI / 180)}
                                    y={100 + 75 * Math.sin((tickAngle - 90) * Math.PI / 180)}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill="var(--theme-gauge-text)" fontSize="18" className="font-sans font-bold"
                                >
                                    {i}
                                </text>
                            }
                        </g>
                    )
                })}

                <text x="100" y="150" textAnchor="middle" fill="var(--theme-gauge-text)" fontSize="24" className="font-mono font-bold">{animatedRpm.toFixed(0)}</text>
                <text x="100" y="168" textAnchor="middle" fill="var(--theme-gauge-text)" opacity="0.7" fontSize="12" className="font-sans">RPM x1000</text>

                <g transform={`rotate(${angle} 100 100)`} style={{ transition: 'transform 0.1s ease-out' }}>
                    <path d="M 100 100 L 100 20" stroke="var(--theme-needle-color)" strokeWidth="3" strokeLinecap="round" />
                </g>
                <circle cx="100" cy="100" r="8" fill="#444" stroke="var(--theme-gauge-bezel)" strokeWidth="1" />
            </svg>
        </div>
    );
};

export default ClassicTachometer;