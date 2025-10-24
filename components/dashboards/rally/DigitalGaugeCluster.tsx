import React from 'react';
import { SensorDataPoint } from '../../../types';
import { useAnimatedValue } from '../../../hooks/useAnimatedValue';
import { useUnitConversion } from '../../../hooks/useUnitConversion';

const RPM_MAX = 8000;
const SHIFT_POINT_1 = 6000;
const SHIFT_POINT_2 = 6800;
const SHIFT_POINT_3 = 7500;
const NUM_RPM_LEDS = 15;

const RpmShiftLights: React.FC<{ rpm: number }> = ({ rpm }) => {
    const animatedRpm = useAnimatedValue(rpm);
    const activeLeds = Math.round((animatedRpm / RPM_MAX) * NUM_RPM_LEDS);
    const flash = animatedRpm > SHIFT_POINT_3 + 200 && Math.floor(Date.now() / 100) % 2 === 0;

    const getLedColor = (i: number) => {
        const ledRpm = (i + 1) * (RPM_MAX / NUM_RPM_LEDS);
        if (ledRpm > SHIFT_POINT_3) return flash ? '#FFFFFF' : '#FF0000';
        if (ledRpm > SHIFT_POINT_2) return '#FFFF00';
        if (ledRpm > SHIFT_POINT_1) return '#00FF00';
        return '#00FFFF';
    };

    return (
        <div className="w-full h-full">
            <svg viewBox="0 0 500 150">
                <defs>
                    <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <g>
                    {Array.from({ length: NUM_RPM_LEDS }).map((_, i) => {
                        const angle = 202.5 + (i * (135 / (NUM_RPM_LEDS - 1)));
                        const x = 250 + 220 * Math.cos(angle * Math.PI / 180);
                        const y = 250 + 220 * Math.sin(angle * Math.PI / 180);
                        const isActive = i < activeLeds;
                        const color = isActive ? getLedColor(i) : '#1A202C';
                        
                        return (
                             <path
                                key={i}
                                d="M-12 -6 L12 -6 L10 6 L-10 6 Z" // Trapezoid
                                fill={color}
                                transform={`translate(${x}, ${y}) rotate(${angle + 90})`}
                                style={{
                                    transition: 'fill 0.05s linear',
                                    filter: isActive ? 'url(#ledGlow)' : 'none'
                                }}
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};


const RallyDataBlock: React.FC<{ label: string; value: number; unit: string; precision?: number }> = ({ label, value, unit, precision = 0 }) => {
    const animatedValue = useAnimatedValue(value);
    return (
        <div className="w-full text-center bg-black/20 p-3 rounded-lg border border-[var(--theme-panel-border)]">
            <div className="text-gray-400 font-sans text-xs uppercase tracking-widest">{label}</div>
            <div className="font-mono text-white text-3xl font-bold tracking-tighter">
                {animatedValue.toFixed(precision)}
                <span className="text-lg text-gray-400 ml-1">{unit}</span>
            </div>
        </div>
    );
};


const DigitalGaugeCluster: React.FC<{ latestData: SensorDataPoint }> = ({ latestData }) => {
    const { rpm, speed, gear, turboBoost, engineTemp, oilPressure } = latestData;
    const { convertSpeed, getSpeedUnit } = useUnitConversion();

    const animatedSpeed = useAnimatedValue(convertSpeed(speed));

    return (
        <div className="h-full w-full max-w-5xl flex flex-col items-center justify-center p-4 glassmorphism-panel rounded-2xl shadow-glow-theme">
            
            <div className="w-full h-32 -mb-16">
                 <RpmShiftLights rpm={rpm} />
            </div>
            
            <div className="flex flex-col items-center text-center">
                <div className="font-display text-[var(--theme-accent-primary)]" style={{ fontSize: '15rem', lineHeight: 1, textShadow: '0 0 40px var(--theme-glow-color)' }}>
                    {gear === 0 ? 'N' : gear}
                </div>
                <div className="font-mono font-bold text-white -mt-8" style={{ fontSize: '7rem', textShadow: '0 0 20px rgba(255,255,255,0.7)' }}>
                    {animatedSpeed.toFixed(0)}
                </div>
                <div className="font-sans text-gray-400 text-xl -mt-2 uppercase">{getSpeedUnit()}</div>
            </div>
            
            <div className="w-full grid grid-cols-3 gap-4 mt-4">
                 <RallyDataBlock label="Boost" value={turboBoost} unit="bar" precision={2} />
                 <RallyDataBlock label="Water Temp" value={engineTemp} unit="°C" />
                 <RallyDataBlock label="Oil Press" value={oilPressure} unit="bar" precision={1} />
            </div>
        </div>
    );
};

export default DigitalGaugeCluster;