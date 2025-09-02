import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import ModernGauge from '../../components/gauges/ModernGauge';

const DigitalReadout: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="flex flex-col items-start justify-center">
        <div className="font-display font-bold text-7xl text-[#00ffff]" style={{ textShadow: '0 0 10px #00ffff' }}>
            {value}
        </div>
        <div className="text-xl font-sans text-gray-400 uppercase tracking-widest">{label}</div>
    </div>
);


const ModernGaugeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();
    const animatedSpeed = useAnimatedValue(latestData.speed);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 theme-background gap-8" style={{
            backgroundImage: "radial-gradient(ellipse at center, rgba(10, 20, 40, 0.4) 0%, rgba(13,16,24,0) 60%), url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVjb21wb3NpdGUgb3BlcmF0b3I9ImluIiBpbjI9IlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0idGV4dHVyZSIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')"
        }}>
            <div className="w-full flex justify-center items-center gap-16">
                <ModernGauge
                    value={latestData.rpm}
                    min={0}
                    max={8000}
                    label="RPM"
                    size="large"
                />
                <DigitalReadout
                    label="SPEED"
                    value={animatedSpeed.toFixed(0)}
                />
            </div>
            <div className="w-full max-w-4xl grid grid-cols-2 gap-8 -mt-8">
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
                        label="THROTTLE %"
                        size="small"
                    />
                </div>
            </div>
        </div>
    );
};

export default ModernGaugeDashboard;