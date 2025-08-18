import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { SensorDataPoint } from '../../types';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

const RadialStat: React.FC<{ label: string; value: number; unit: string; angle: number }> = ({ label, value, unit, angle }) => {
    const animatedValue = useAnimatedValue(value);
    const positionStyle: React.CSSProperties = {
        transform: `rotate(${angle}deg) translate(14rem) rotate(${-angle}deg)`
    };

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16" style={positionStyle}>
            <div className="flex flex-col items-center justify-center w-full h-full text-center bg-black/50 border-2 border-[var(--theme-accent-primary)]/50 rounded-lg p-2 shadow-glow-theme">
                <span className="text-xs font-sans text-[var(--theme-text-secondary)] uppercase tracking-widest">{label}</span>
                <div>
                    <span className="text-xl font-mono font-bold text-white">
                        {animatedValue.toFixed(label.includes('Temp') ? 1 : (label === 'Lambda' ? 2 : 1))}
                    </span>
                    <span className="ml-1 text-xs text-[var(--theme-text-secondary)]">{unit}</span>
                </div>
            </div>
        </div>
    );
};

const BottomStat: React.FC<{ label: string; value: string | number; unit: string; className?: string }> = ({ label, value, unit, className }) => {
    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="font-display font-bold text-5xl text-white">{value}</div>
            <div className="flex items-center">
                <span className="text-sm font-sans text-[var(--theme-text-secondary)]">{label}</span>
                <span className="ml-2 text-sm font-sans text-[var(--theme-text-secondary)]">{unit}</span>
            </div>
        </div>
    )
};

const IgnitionButton: React.FC = () => {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-black flex flex-col items-center justify-center border-4 border-[var(--theme-accent-primary)]/80 shadow-glow-theme">
             <svg className="w-16 h-16 text-[var(--theme-accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.983 1.527L4.586 9.972l3.429.027-3.44 6.473L15.414 8.028l-3.429-.027 3.44-6.474z"/>
            </svg>
            <span className="text-lg font-display font-bold text-white mt-1">Ignition</span>
        </div>
    )
};

const ModernThemeDashboard: React.FC = () => {
    const { latestData } = useVehicleData();
    const d: SensorDataPoint = latestData;

    const stats = [
        { label: 'Eng Temp', value: d.engineTemp, unit: '°C' },
        { label: 'Oil Temp', value: d.engineTemp + 5, unit: '°C' },
        { label: 'Fuel Temp', value: d.fuelTemp, unit: '°C' },
        { label: 'Air Temp', value: d.inletAirTemp, unit: '°C' },
        { label: 'Trans Temp', value: d.engineTemp - 20, unit: '°C' },
        { label: 'Oil Pres', value: d.oilPressure, unit: 'PSI' },
        { label: 'Boost', value: d.turboBoost * 14.5, unit: 'PSI' }, // bar to PSI
        { label: 'Lambda', value: d.o2SensorVoltage * 2, unit: 'λ' },
    ];
    
    const animatedRpm = useAnimatedValue(d.rpm);
    const animatedFuel = useAnimatedValue(d.fuelUsed);
    const animatedSpeed = useAnimatedValue(d.speed);
    const animatedVoltage = useAnimatedValue(d.batteryVoltage);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--theme-bg)] text-white p-4 font-sans theme-background">
            <div className="w-full text-center mb-4">
                <span className="text-xl font-display uppercase tracking-widest border-b-2 border-[var(--theme-accent-primary)]/50 pb-1">BOOST LEVEL</span>
                 <span className="ml-8 text-xl font-display uppercase tracking-widest border-b-2 border-[var(--theme-accent-primary)]/50 pb-1">RPM LEVEL</span>
            </div>
            
            <div className="relative w-[40rem] h-[40rem] flex-shrink-0">
                <IgnitionButton />
                {stats.map((stat, i) => (
                    <RadialStat 
                        key={stat.label}
                        label={stat.label} 
                        value={stat.value}
                        unit={stat.unit}
                        angle={-135 + i * 45}
                    />
                ))}
            </div>

            <div className="w-full max-w-4xl grid grid-cols-4 gap-4 items-end mt-4 p-4 bg-black/30 border-t-2 border-[var(--theme-accent-primary)]/50">
                 <BottomStat label="RPM" value={animatedRpm.toFixed(0)} unit="" />
                 <BottomStat label="Fuel Level" value={`${(100 - (animatedFuel / 50 * 100)).toFixed(0)}`} unit="%" />
                 <BottomStat label="Battery" value={animatedVoltage.toFixed(1)} unit="V" />
                 <BottomStat label="Speed" value={animatedSpeed.toFixed(0)} unit="km/h" />
            </div>

        </div>
    );
};

export default ModernThemeDashboard;