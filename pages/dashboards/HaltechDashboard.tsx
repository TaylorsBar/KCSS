

import React from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import HaltechGauge from '../../components/tachometers/HaltechGauge';
import { useUnitConversion } from '../../hooks/useUnitConversion';

const DigitalReadout: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
    <div className="bg-[var(--theme-haltech-dark-gray)] p-2 rounded-md text-center border-2 border-[var(--theme-haltech-yellow)]">
        <div className="text-sm font-sans text-[var(--theme-text-secondary)] uppercase">{label}</div>
        <div className="font-mono text-3xl font-bold text-[var(--theme-haltech-yellow)] tracking-wider">{value}</div>
        <div className="text-xs text-[var(--theme-text-secondary)]">{unit}</div>
    </div>
);

const HaltechDashboard: React.FC = () => {
    const latestData = useVehicleStore(state => state.latestData);
    const { convertSpeed, getSpeedUnit, unitSystem } = useUnitConversion();

    const oilPressure = useAnimatedValue(latestData.oilPressure);
    const fuelPressure = useAnimatedValue(latestData.fuelPressure);
    const engineTemp = useAnimatedValue(latestData.engineTemp);
    const inletAirTemp = useAnimatedValue(latestData.inletAirTemp);
    const batteryVoltage = useAnimatedValue(latestData.batteryVoltage);

    const speedConfig = unitSystem === 'imperial' 
        ? { max: 150, redline: 125 }
        : { max: 240, redline: 200 };

    return (
        <div className="flex flex-col h-full w-full p-4 gap-4 theme-background items-center justify-center haltech-ic7-background">
            <div className="w-full max-w-7xl flex items-center justify-center gap-4">
                <HaltechGauge
                    value={latestData.turboBoost}
                    min={-1}
                    max={2}
                    redlineStart={1.5}
                    label="MAP"
                    unit="bar"
                    size="small"
                />
                <HaltechGauge
                    value={latestData.rpm}
                    min={0}
                    max={8000}
                    redlineStart={7000}
                    label="RPM"
                    unit=""
                    size="large"
                />
                <HaltechGauge
                    value={convertSpeed(latestData.speed)}
                    min={0}
                    max={speedConfig.max}
                    redlineStart={speedConfig.redline}
                    label="SPEED"
                    unit={getSpeedUnit()}
                    size="small"
                />
            </div>
            <div className="w-full max-w-7xl grid grid-cols-5 gap-4 mt-4">
                <DigitalReadout label="Oil Pressure" value={oilPressure.toFixed(1)} unit="bar" />
                <DigitalReadout label="Fuel Pressure" value={fuelPressure.toFixed(1)} unit="bar" />
                <DigitalReadout label="Coolant Temp" value={engineTemp.toFixed(0)} unit="°C" />
                <DigitalReadout label="Air Temp" value={inletAirTemp.toFixed(0)} unit="°C" />
                <DigitalReadout label="Battery" value={batteryVoltage.toFixed(1)} unit="V" />
            </div>
        </div>
    );
};

export default HaltechDashboard;