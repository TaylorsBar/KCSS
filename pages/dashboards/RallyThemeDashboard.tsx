import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import RallyGaugeCluster from '../../components/dashboards/rally/DigitalGaugeCluster';

const RallyThemeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();

    return (
        <div className="h-full w-full bg-transparent text-white font-sans p-4 md:p-6 flex items-center justify-center">
            <div className="w-full max-w-5xl p-6 rounded-2xl glassmorphism-panel">
                <RallyGaugeCluster latestData={latestData} />
            </div>
        </div>
    );
};

export default RallyThemeDashboard;