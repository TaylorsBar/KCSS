import React from 'react';
import { SensorDataPoint } from '../../../types';
import { useAnimatedValue } from '../../../hooks/useAnimatedValue';

const RPM_MAX = 8000;
const SHIFT_POINT_1 = 6000; // Green
const SHIFT_POINT_2 = 6800; // Yellow
const SHIFT_POINT_3 = 7500; // Red
const NUM_RPM_LEDS = 20;

const RpmLeds: React.FC<{ rpm: number }> = ({ rpm }) => {
    const animatedRpm = useAnimatedValue(rpm);
    const activeLeds = Math.round((animatedRpm / RPM_MAX) * NUM_RPM_LEDS);
    const flash = animatedRpm > SHIFT_POINT_3 && Math.floor(Date.now() / 150) % 2 === 0;

    const getLedColor = (i: number) => {
        const ledRpm = (i + 1) * (RPM_MAX / NUM_RPM_LEDS);
        if (ledRpm > SHIFT_POINT_3) return flash ? 'bg-white shadow-[0_0_10px_#fff]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]';
        if (ledRpm > SHIFT_POINT_2) return 'bg-yellow-400 shadow-[0_0_8px_rgba(255,255,0,0.7)]';
        if (ledRpm > SHIFT_POINT_1) return 'bg-green-500 shadow-[0_0_8px_rgba(0,255,0,0.6)]';
        return 'bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.6)]';
    };

    return (
        <div className="flex items-center justify-center">
            <div className="relative w-[500px] h-[250px]">
                {Array.from({ length: NUM_RPM_LEDS }).map((_, i) => {
                    const angle = -150 + (i / (NUM_RPM_LEDS - 1)) * 120;
                    const style = {
                        transform: `rotate(${angle}deg) translate(220px)`,
                    };
                    return (
                        <div key={i} className="absolute top-1/2 left-1/2 -mt-2 -ml-4 w-8 h-4 rounded-sm" style={style}>
                            <div className={`w-full h-full transition-colors duration-100 ${i < activeLeds ? getLedColor(i) : 'bg-gray-800/50'}`}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DataBlock: React.FC<{ label: string; value: number; unit: string; precision?: number }> = ({ label, value, unit, precision = 0 }) => {
    const animatedValue = useAnimatedValue(value);
    return (
        <div className="w-full text-right bg-black/30 p-3 rounded-lg border border-gray-800 glassmorphism-panel">
            <div className="text-gray-400 font-sans text-sm uppercase">{label}</div>
            <div className="font-mono text-white text-3xl font-bold">
                {animatedValue.toFixed(precision)}
                <span className="text-xl text-gray-400 ml-1">{unit}</span>
            </div>
        </div>
    );
};

const RallyGaugeCluster: React.FC<{ latestData: SensorDataPoint }> = ({ latestData }) => {
    const { rpm, speed, gear, turboBoost, engineTemp, oilPressure } = latestData;
    const animatedSpeed = useAnimatedValue(speed);

    return (
        <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="relative w-full flex items-center justify-center">
                <RpmLeds rpm={rpm} />
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <div className="font-display text-white" style={{ fontSize: '10rem', lineHeight: 1, textShadow: '0 0 25px rgba(255,255,255,0.7)' }}>
                        {gear}
                    </div>
                    <div className="font-mono font-bold text-white -mt-4" style={{ fontSize: '5rem', textShadow: '0 0 15px rgba(255,255,255,0.5)' }}>
                        {animatedSpeed.toFixed(0)}
                    </div>
                    <div className="font-sans text-gray-400 text-xl -mt-2">km/h</div>
                </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-4 mt-4">
                <DataBlock label="Boost" value={turboBoost} unit="bar" precision={2} />
                <DataBlock label="Water Temp" value={engineTemp} unit="°C" precision={0} />
                <DataBlock label="Oil Press" value={oilPressure} unit="bar" precision={1} />
            </div>
        </div>
    );
};

export default RallyGaugeCluster;