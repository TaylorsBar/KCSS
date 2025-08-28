import React from 'react';
import { SensorDataPoint } from '../../../types';
import { useAnimatedValue } from '../../../hooks/useAnimatedValue';

const RPM_MAX = 8000;
const REDLINE_START = 6500;
const NUM_RPM_SEGMENTS = 40;

const RpmBar: React.FC<{ rpm: number }> = ({ rpm }) => {
    const animatedRpm = useAnimatedValue(rpm);
    const activeSegments = Math.round((animatedRpm / RPM_MAX) * NUM_RPM_SEGMENTS);

    const getSegmentColor = (i: number) => {
        const segmentRpm = (i + 1) * (RPM_MAX / NUM_RPM_SEGMENTS);
        if (segmentRpm > REDLINE_START) {
            return 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]';
        }
        if (segmentRpm > 4500) {
            return 'bg-yellow-400';
        }
        return 'bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.6)]';
    };

    return (
        <div className="flex w-full justify-center items-end h-16">
            {Array.from({ length: NUM_RPM_SEGMENTS }).map((_, i) => (
                <div key={i} className="w-2 mx-0.5" style={{ height: `${20 + Math.sin(i / NUM_RPM_SEGMENTS * Math.PI) * 100}%` }}>
                    <div className={`h-full w-full rounded-t-sm transition-colors duration-100 ${i < activeSegments ? getSegmentColor(i) : 'bg-gray-800'}`}></div>
                </div>
            ))}
        </div>
    );
};

const InfoReadout: React.FC<{ label: string; value: string; unit: string; }> = ({ label, value, unit }) => (
    <div className="text-center">
        <div className="text-gray-400 font-sans text-sm">{label}</div>
        <div className="font-mono text-white text-2xl font-bold">
            {value}<span className="text-lg text-gray-400 ml-1">{unit}</span>
        </div>
    </div>
);

const DigitalGaugeCluster: React.FC<{ latestData: SensorDataPoint }> = ({ latestData }) => {
    const { rpm, speed, gear, turboBoost, engineTemp, oilPressure } = latestData;
    const animatedSpeed = useAnimatedValue(speed);
    
    return (
        <div className="w-full max-w-4xl bg-black/50 border-2 border-gray-800 rounded-2xl p-6 shadow-2xl glassmorphism-panel">
            <RpmBar rpm={rpm} />
            <div className="grid grid-cols-3 items-center mt-4">
                <div className="space-y-4">
                    <InfoReadout label="BOOST" value={turboBoost.toFixed(2)} unit="bar" />
                    <InfoReadout label="OIL" value={oilPressure.toFixed(1)} unit="bar" />
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                    <div className="font-display text-white" style={{ fontSize: '10rem', lineHeight: 1, textShadow: '0 0 15px rgba(0,255,255,0.5)' }}>
                        {gear}
                    </div>
                    <div className="font-mono font-bold text-white -mt-4" style={{ fontSize: '4rem', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
                        {animatedSpeed.toFixed(0)}
                    </div>
                    <div className="font-sans text-gray-400 -mt-2">km/h</div>
                </div>

                <div className="space-y-4">
                     <InfoReadout label="WATER" value={engineTemp.toFixed(0)} unit="°C" />
                     {/* Placeholder for another metric */}
                     <InfoReadout label="VOLTS" value={latestData.batteryVoltage.toFixed(1)} unit="V" />
                </div>
            </div>
        </div>
    );
};

export default DigitalGaugeCluster;
