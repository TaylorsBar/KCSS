import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import ModernGauge from '../../components/gauges/ModernGauge';

const ModernGaugeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 theme-background">
            <div className="w-full max-w-5xl h-[85%] p-8 rounded-2xl glassmorphism-panel flex flex-col items-center justify-center">
                <ModernGauge
                    value={latestData.rpm}
                    min={0}
                    max={8000}
                    label="RPM"
                    size="large"
                    centerValue={latestData.speed.toFixed(0)}
                    centerUnit="km/h"
                />
                <div className="w-full flex justify-center gap-16 -mt-16">
                    <ModernGauge
                        value={latestData.turboBoost * 14.5}
                        min={-10}
                        max={30}
                        label="BOOST (PSI)"
                        size="small"
                    />
                    <ModernGauge
                        value={latestData.engineLoad}
                        min={0}
                        max={100}
                        label="THROTTLE (%)"
                        size="small"
                    />
                </div>
            </div>
        </div>
    );
};

export default ModernGaugeDashboard;