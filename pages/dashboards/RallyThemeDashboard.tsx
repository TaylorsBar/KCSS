import React from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import CyberGauge from '../../components/tachometers/AnalogTachometer'; // Repurposed for CyberGauge
import DataCard from '../../components/StatCard'; // Repurposed for DataCard
import { useUnitConversion } from '../../hooks/useUnitConversion';

const RallyThemeDashboard: React.FC = () => {
    const latestData = useVehicleStore(state => state.latestData);
    const { convertSpeed, getSpeedUnit } = useUnitConversion();
    const d = latestData;

    return (
        <div className="h-full w-full p-4 md:p-6 flex flex-col items-center justify-center gap-6">
            <div className="w-full flex-grow flex items-center justify-center">
                <CyberGauge 
                    rpm={d.rpm}
                    speed={convertSpeed(d.speed)}
                    gear={d.speed < 1 ? 0 : d.gear}
                    speedUnit={getSpeedUnit()}
                />
            </div>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0 px-4">
                <DataCard title="Boost" value={d.turboBoost.toFixed(2)} unit="bar" />
                <DataCard title="Oil Pressure" value={d.oilPressure.toFixed(1)} unit="bar" />
                <DataCard title="Coolant Temp" value={d.engineTemp.toFixed(0)} unit="°C" />
                <DataCard title="Voltage" value={d.batteryVoltage.toFixed(1)} unit="V" />
            </div>
        </div>
    );
};

export default RallyThemeDashboard;