

import React from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useUnitConversion } from '../../hooks/useUnitConversion';
import HaltechTachometer from '../../components/tachometers/HaltechTachometer';
import HaltechSideBarGauge from '../../components/gauges/HaltechSideBarGauge';

const HaltechDashboard: React.FC = () => {
    const latestData = useVehicleStore(state => state.latestData);
    const { convertSpeed, getSpeedUnit } = useUnitConversion();

    return (
        <div className="flex h-full w-full p-4 gap-4 items-center justify-center">
            <div className="w-full flex items-stretch justify-center gap-4">
                {/* Left Gauges */}
                <div className="flex flex-col justify-between w-1/6 gap-4">
                    <HaltechSideBarGauge
                        label="BOOST"
                        value={latestData.turboBoost}
                        unit="BAR"
                        min={-1}
                        max={2}
                        warning={1.2}
                        danger={1.5}
                    />
                    <HaltechSideBarGauge
                        label="OIL PRESS"
                        value={latestData.oilPressure}
                        unit="BAR"
                        min={0}
                        max={8}
                        warning={1.5}
                    />
                </div>

                {/* Center Tachometer */}
                <div className="w-4/6">
                    <HaltechTachometer
                        rpm={latestData.rpm}
                        speed={convertSpeed(latestData.speed)}
                        gear={latestData.speed > 1 ? latestData.gear : 0}
                        speedUnit={getSpeedUnit()}
                    />
                </div>

                {/* Right Gauges */}
                <div className="flex flex-col justify-between w-1/6 gap-4">
                     <HaltechSideBarGauge
                        label="COOLANT"
                        value={latestData.engineTemp}
                        unit="°C"
                        min={40}
                        max={120}
                        warning={100}
                        danger={110}
                    />
                     <HaltechSideBarGauge
                        label="VOLTAGE"
                        value={latestData.batteryVoltage}
                        unit="V"
                        min={11}
                        max={15}
                        warning={12}
                    />
                </div>
            </div>
        </div>
    );
};

export default HaltechDashboard;