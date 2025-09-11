import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import ModernGauge from '../../components/gauges/ModernGauge';

const SpeedDisplay: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-24 h-24 bg-black/30 border border-cyan-500/30 rounded-2xl flex items-center justify-center">
            <svg className="w-16 h-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6h-4.5m4.5 0v-4.5m0 4.5L15 9" />
            </svg>
        </div>
        <div className="font-sans uppercase text-sm font-bold tracking-wider text-cyan-400/80">SPEED</div>
    </div>
);


const ModernGaugeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 theme-background" style={{
            // FIX: Cast style object to React.CSSProperties to allow for custom properties
            '--theme-bg': '#05080c',
             backgroundImage: "radial-gradient(ellipse at center, rgba(0, 100, 100, 0.15) 0%, rgba(5,8,12,0) 60%)"
        } as React.CSSProperties}>
            <div className="w-full flex justify-center items-center gap-24">
                <div className="w-64" /> {/* Spacer */}
                <ModernGauge
                    value={latestData.rpm}
                    min={0}
                    max={8000}
                    label="RPM"
                    size="large"
                />
                <div className="w-64">
                    <SpeedDisplay />
                </div>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-2 gap-24 -mt-32">
                <div className="flex justify-end">
                     <ModernGauge
                        value={latestData.turboBoost * 14.5}
                        min={-10}
                        max={30}
                        label="TURBO PSI"
                        size="small"
                    />
                </div>
                <div className="flex justify-start">
                    <ModernGauge
                        value={latestData.engineLoad}
                        min={0}
                        max={100}
                        label="THROTTLE"
                        size="small"
                    />
                </div>
            </div>
        </div>
    );
};

export default ModernGaugeDashboard;