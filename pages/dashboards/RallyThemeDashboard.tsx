import React from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import RallyGaugeCluster from '../../components/dashboards/rally/DigitalGaugeCluster';

const RallyThemeDashboard: React.FC = () => {
    const latestData = useVehicleStore(state => state.latestData);

    return (
        <div className="h-full w-full bg-transparent text-white font-sans p-4 md:p-6 flex items-center justify-center">
            <RallyGaugeCluster latestData={latestData} />
        </div>
    );
};

export default RallyThemeDashboard;