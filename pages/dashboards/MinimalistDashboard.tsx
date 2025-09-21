import React, { useState } from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { SensorDataPoint } from '../../types';
import MinimalistGauge from '../../components/gauges/MinimalistGauge';
import Map from '../../components/Map';
import PowerChargeMeter from '../../components/ev/PowerChargeMeter';
import TirePressureDisplay from '../../components/ev/TirePressureDisplay';
import MediaPlayer from '../../components/ev/MediaPlayer';

type DriveMode = 'P' | 'R' | 'N' | 'D';

const AdvancedEvDashboard: React.FC = () => {
    const { latestData } = useVehicleData();
    const d: SensorDataPoint = latestData;
    const [driveMode, setDriveMode] = useState<DriveMode>('D');

    return (
        <div className="flex h-full w-full items-center justify-center p-4 md:p-6 theme-background bg-[#0A0B0F]">
            <div className="w-full h-full max-w-screen-2xl grid grid-cols-12 grid-rows-6 gap-6">
                
                {/* Vitals Panel */}
                <div className="col-span-3 row-span-6 glassmorphism-panel p-6 flex flex-col gap-6">
                    <TirePressureDisplay
                        fl={d.tireFL || 0}
                        fr={d.tireFR || 0}
                        rl={d.tireRL || 0}
                        rr={d.tireRR || 0}
                    />
                    <div className="flex-grow flex flex-col justify-center items-center gap-4">
                        <div className="text-8xl font-display font-bold text-white" style={{ textShadow: '0 0 8px #fff'}}>272<span className="text-4xl ml-2">mi</span></div>
                        <div className="text-2xl font-sans text-gray-400">Estimated Range</div>
                    </div>
                     <div className="w-full h-24 bg-base-900/50 rounded-lg p-2 flex items-center gap-2 border border-base-700">
                         <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md" style={{width: '82%'}}/>
                         <div className="text-4xl font-display font-bold text-white">82%</div>
                     </div>
                </div>

                {/* Main Cluster */}
                <div className="col-span-6 row-span-4 flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                         <MinimalistGauge 
                            value={d.speed}
                            min={0}
                            max={160}
                            unit="mph"
                            size="large"
                        />
                        <div className="absolute font-display text-8xl font-bold text-white">{driveMode}</div>
                    </div>
                </div>

                 {/* Power Meter */}
                <div className="col-span-6 row-start-5 row-span-2 flex items-center justify-center px-8">
                     <PowerChargeMeter powerKw={d.powerOutputKw || 0} />
                </div>
                
                {/* Navigation */}
                <div className="col-span-3 row-span-4 glassmorphism-panel overflow-hidden">
                    <Map lat={d.latitude} lon={d.longitude} zoom={17} />
                </div>

                {/* Media Player */}
                <div className="col-span-3 row-start-5 row-span-2 glassmorphism-panel p-6">
                    <MediaPlayer />
                </div>

            </div>
        </div>
    );
};

export default AdvancedEvDashboard;
