import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { SensorDataPoint } from '../../types';
import DigitalGaugeCluster from '../../components/dashboards/rally/DigitalGaugeCluster';

const RallyThemeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-transparent text-white p-4 font-sans gap-4">
            <DigitalGaugeCluster latestData={latestData} />
        </div>
    );
};

export default RallyThemeDashboard;