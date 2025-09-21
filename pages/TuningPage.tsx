import React, { useState, useCallback, useMemo } from 'react';
import { useVehicleData } from '../hooks/useVehicleData';
import { TuningMap } from '../types';
import TuningMapGrid from '../components/tuning/TuningMapGrid';
import AiTuningAssistant from '../components/tuning/AiTuningAssistant';
import DataLogger from '../components/tuning/DataLogger';
import { MOCK_TUNING_MAPS } from '../components/tuning/mockTuningData';

type ActiveMapView = 've' | 'ignition' | 'afr';

const TuningPage: React.FC = () => {
    const { latestData } = useVehicleData();
    const [tuningMaps, setTuningMaps] = useState<Record<ActiveMapView, TuningMap>>(MOCK_TUNING_MAPS);
    const [activeMapView, setActiveMapView] = useState<ActiveMapView>('ve');

    const handleMapDataChange = useCallback((mapId: ActiveMapView, newData: number[][]) => {
        setTuningMaps(prev => ({
            ...prev,
            [mapId]: {
                ...prev[mapId],
                data: newData,
            }
        }));
    }, []);
    
    const activeMap = useMemo(() => tuningMaps[activeMapView], [tuningMaps, activeMapView]);

    return (
        <div className="flex h-full w-full p-4 gap-4">
            {/* Left Sidebar: Map Selection */}
            <div className="w-48 flex-shrink-0 bg-black p-4 rounded-lg border border-brand-cyan/30 flex flex-col gap-2">
                 <h2 className="text-lg font-bold text-gray-100 font-display border-b border-brand-cyan/30 pb-2 mb-2">Maps</h2>
                 {Object.values(tuningMaps).map(map => (
                     <button
                        key={map.id}
                        onClick={() => setActiveMapView(map.id)}
                        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeMapView === map.id ? 'bg-brand-blue text-white' : 'text-gray-400 hover:bg-base-800'}`}
                     >
                         {map.name}
                     </button>
                 ))}
                 <div className="mt-auto flex flex-col gap-2">
                    <button className="w-full bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600 text-sm">Load Tune</button>
                    <button className="w-full bg-base-700 text-white font-semibold py-2 rounded-md hover:bg-base-600 text-sm">Save Tune</button>
                    <button className="w-full bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-500 text-sm">Write to ECU</button>
                 </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-grow flex flex-col gap-4">
                {/* Top: Tuning Map Grid */}
                <div className="h-2/3 bg-black p-4 rounded-lg border border-brand-cyan/30 flex flex-col">
                    <TuningMapGrid
                        key={activeMap.id} // Force re-render on map change
                        map={activeMap}
                        liveRpm={latestData.rpm}
                        liveLoad={latestData.engineLoad}
                        onDataChange={(newData) => handleMapDataChange(activeMap.id, newData)}
                    />
                </div>
                
                {/* Bottom: Data Logger */}
                <div className="h-1/3 bg-black p-4 rounded-lg border border-brand-cyan/30">
                    <DataLogger />
                </div>
            </div>

            {/* Right Sidebar: AI Assistant & Vitals */}
            <div className="w-72 flex-shrink-0 bg-black p-4 rounded-lg border border-brand-cyan/30">
                <AiTuningAssistant latestData={latestData} />
            </div>
        </div>
    );
};

export default TuningPage;
