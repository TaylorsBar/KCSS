import React from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useUnitConversion } from '../../hooks/useUnitConversion';
import CarbonTachometer from '../../components/tachometers/CarbonTachometer';
import AuxGauge from '../../components/gauges/AuxGauge';

const ModernGaugeDashboard: React.FC = () => {
    const latestData = useVehicleStore(state => state.latestData);
    const { convertSpeed, getSpeedUnit } = useUnitConversion();

    const speed = convertSpeed(latestData.speed);
    const speedUnit = getSpeedUnit();
    
    // Simulate AFR based on O2 sensor voltage for a more dynamic feel
    const afr = 14.7 + (latestData.o2SensorVoltage - 0.45) * 5;
    
    // Invert fuelUsed to get fuelLevel, ensuring it stays within 0-100 range
    const fuelLevel = Math.max(0, 100 - latestData.fuelUsed);

    return (
        <div 
            className="flex items-center justify-center h-full w-full p-8 theme-background bg-black gap-8"
            style={{
                backgroundImage: "radial-gradient(ellipse at center, rgba(10, 20, 40, 0.2) 0%, rgba(13,16,24,0) 70%)"
            }}
        >
            <div className="flex flex-col gap-4 w-48">
                <AuxGauge label="FUEL" value={fuelLevel} min={0} max={100} unit="%" />
                <AuxGauge label="A/F" value={afr} min={10} max={20} unit="ratio" />
                <AuxGauge label="VOLTS" value={latestData.batteryVoltage} min={11} max={15} unit="v" />
            </div>
            <CarbonTachometer 
                rpm={latestData.rpm} 
                speed={speed}
                gear={latestData.speed < 1 ? 0 : latestData.gear}
                speedUnit={speedUnit}
            />
        </div>
    );
};

export default ModernGaugeDashboard;