import React from 'react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface PowerChargeMeterProps {
    powerKw: number;
}

const POWER_MAX = 350; // Max power output in kW
const REGEN_MAX = 80;  // Max regeneration in kW

const PowerChargeMeter: React.FC<PowerChargeMeterProps> = ({ powerKw }) => {
    const animatedPower = useAnimatedValue(powerKw);
    
    const isCharging = animatedPower < 0;
    const powerPercentage = isCharging
        ? Math.min(100, (Math.abs(animatedPower) / REGEN_MAX) * 100)
        : Math.min(100, (animatedPower / POWER_MAX) * 100);

    return (
        <div className="w-full flex items-center gap-4">
            <div className="text-center w-24">
                <div className="font-sans text-lg text-green-400">CHARGE</div>
                <div className="font-mono text-3xl font-bold text-white">
                    {isCharging ? Math.abs(animatedPower).toFixed(0) : '0'}
                </div>
                <div className="text-sm text-gray-400">kW</div>
            </div>

            <div className="flex-grow h-12 bg-base-900/50 rounded-full overflow-hidden border border-base-700 flex items-center relative">
                {/* Charge side */}
                <div className="h-full bg-gradient-to-l from-green-500/50 to-green-500 transition-all duration-150 ease-linear" style={{ width: `${isCharging ? powerPercentage / 2 : 0}%`, marginLeft: `${50 - (isCharging ? powerPercentage / 2 : 0)}%` }} />
                {/* Power side */}
                 <div className="h-full bg-gradient-to-r from-cyan-500/50 to-cyan-500 transition-all duration-150 ease-linear" style={{ width: `${!isCharging ? powerPercentage / 2 : 0}%` }} />
                 <div className="absolute w-px h-full bg-base-700 left-1/2" />
            </div>

            <div className="text-center w-24">
                 <div className="font-sans text-lg text-cyan-400">POWER</div>
                 <div className="font-mono text-3xl font-bold text-white">
                    {!isCharging ? animatedPower.toFixed(0) : '0'}
                 </div>
                 <div className="text-sm text-gray-400">kW</div>
            </div>
        </div>
    );
};

export default PowerChargeMeter;
