

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRaceSession } from '../hooks/useRaceSession';
import * as storage from '../services/storageService';
import { SavedRaceSession, Leaderboard, GpsPoint, LapTime, DragRaceResult } from '../types/index';
import Map from '../components/Map';
import RouteMap from '../components/RouteMap';
import HistoryIcon from '../components/icons/HistoryIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import StopwatchIcon from '../components/icons/StopwatchIcon';
import TuneIcon from '../components/icons/TuneIcon';
import { useDragVehicleData } from '../hooks/useDragVehicleData';
import ChristmasTree from '../components/drag/ChristmasTree';
import NosSwitch from '../components/drag/NosSwitch';
import TimeSlip from '../components/drag/TimeSlip';
import { useAnimatedValue } from '../hooks/useAnimatedValue';


const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
};

const StatCard: React.FC<{ title: string; value: string; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-base-800/50 p-4 rounded-md text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            {icon}
            <span>{title}</span>
        </div>
        <p className="font-mono text-3xl text-white mt-1">{value}</p>
    </div>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-3 py-3 text-sm font-semibold rounded-t-lg transition-colors ${
            isActive ? 'bg-black text-brand-cyan border-b-2 border-brand-cyan' : 'bg-transparent text-gray-400 hover:bg-base-800/50'
        }`}
    >
        {icon}
        {label}
    </button>
);

// --- Drag Mode Components ---
type RaceState = 'idle' | 'staging' | 'countdown' | 'go' | 'foul' | 'finished';
type TreeState = 'off' | 'staged' | 'c1' | 'c2' | 'c3' | 'go' | 'foul';

const DISTANCE_MILESTONES = {
    '60ft': 18.288,
    '330ft': 100.584,
    '1/8mile': 201.168,
    '1000ft': 304.8,
    '1/4mile': 402.336,
};

const DigitalGauge: React.FC<{ value: number, label: string }> = ({ value, label }) => {
    const animatedValue = useAnimatedValue(value);
    return (
        <div className="text-center">
            <div className="font-mono text-8xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 10px #fff' }}>
                {animatedValue.toFixed(0)}
            </div>
            <div className="text-xl text-gray-400 uppercase -mt-2">{label}</div>
        </div>
    );
};

const DragMode: React.FC = () => {
    const [raceState, setRaceState] = useState<RaceState>('idle');
    const [treeState, setTreeState] = useState<TreeState>('off');
    const [isLaunched, setIsLaunched] = useState(false);
    const [isNosArmed, setIsNosArmed] = useState(false);
    const [isNosActive, setIsNosActive] = useState(false);
    const [results, setResults] = useState<DragRaceResult | null>(null);

    const { latestData, nosLevel, reset: resetVehicle } = useDragVehicleData({ isLaunched, isNosActive });
    const greenLightTime = useRef<number | null>(null);
    const resultsRef = useRef<DragRaceResult>({
        reactionTime: null, timeTo60ft: null, timeTo330ft: null, timeTo1_8mile: null,
        speedAt1_8mile: null, timeTo1000ft: null, timeTo1_4mile: null, speedAt1_4mile: null
    });

    const startCountdown = useCallback(() => {
        setRaceState('countdown');
        setTimeout(() => setTreeState('c1'), 500);
        setTimeout(() => setTreeState('c2'), 1000);
        setTimeout(() => setTreeState('c3'), 1500);
        setTimeout(() => {
            setTreeState('go');
            setRaceState('go');
            greenLightTime.current = performance.now();
        }, 2000);
    }, []);

    const handleStage = () => {
        if (raceState === 'idle') {
            setRaceState('staging');
            setTreeState('staged');
            startCountdown();
        }
    };
    
    const handleLaunch = () => {
        if (raceState === 'staging' || raceState === 'countdown') {
            setRaceState('foul');
            setTreeState('foul');
            resultsRef.current.reactionTime = -0.001; // Indicate a foul
            setResults({ ...resultsRef.current });
            setTimeout(() => setRaceState('finished'), 1500);
        } else if (raceState === 'go') {
            if (greenLightTime.current) {
                resultsRef.current.reactionTime = (performance.now() - greenLightTime.current) / 1000;
            }
            setIsLaunched(true);
        }
    };
    
    const resetRun = useCallback(() => {
        setRaceState('idle');
        setTreeState('off');
        setIsLaunched(false);
        setIsNosArmed(false);
        setIsNosActive(false);
        setResults(null);
        greenLightTime.current = null;
        resultsRef.current = {
            reactionTime: null, timeTo60ft: null, timeTo330ft: null, timeTo1_8mile: null,
            speedAt1_8mile: null, timeTo1000ft: null, timeTo1_4mile: null, speedAt1_4mile: null
        };
        resetVehicle();
    }, [resetVehicle]);
    
    useEffect(() => {
        if (!isLaunched || !greenLightTime.current || raceState === 'finished') return;
    
        const startTime = greenLightTime.current - (resultsRef.current.reactionTime || 0) * 1000;
        
        if (latestData.distance >= DISTANCE_MILESTONES['60ft'] && resultsRef.current.timeTo60ft === null) {
            resultsRef.current.timeTo60ft = (latestData.time - startTime) / 1000;
        }
        if (latestData.distance >= DISTANCE_MILESTONES['330ft'] && resultsRef.current.timeTo330ft === null) {
            resultsRef.current.timeTo330ft = (latestData.time - startTime) / 1000;
        }
        if (latestData.distance >= DISTANCE_MILESTONES['1/8mile'] && resultsRef.current.timeTo1_8mile === null) {
            resultsRef.current.timeTo1_8mile = (latestData.time - startTime) / 1000;
            resultsRef.current.speedAt1_8mile = latestData.speed;
        }
        if (latestData.distance >= DISTANCE_MILESTONES['1000ft'] && resultsRef.current.timeTo1000ft === null) {
            resultsRef.current.timeTo1000ft = (latestData.time - startTime) / 1000;
        }
        if (latestData.distance >= DISTANCE_MILESTONES['1/4mile'] && resultsRef.current.timeTo1_4mile === null) {
            resultsRef.current.timeTo1_4mile = (latestData.time - startTime) / 1000;
            resultsRef.current.speedAt1_4mile = latestData.speed;
            setIsLaunched(false);
            setRaceState('finished');
            setResults({ ...resultsRef.current });
        }
      }, [latestData, isLaunched, raceState]);

    return (
        <div className="h-[75vh] w-full flex flex-col items-center justify-between p-4 bg-gray-900/50 relative overflow-hidden rounded-b-lg">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{backgroundImage: "url('https://images.unsplash.com/photo-1598967399033-5c3176312523?q=80&w=2070&auto=format&fit=crop')"}}
            />
            
            <div className="w-full flex justify-center gap-16 z-10">
                <DigitalGauge value={latestData.rpm} label="RPM" />
                <DigitalGauge value={latestData.speed} label="KM/H" />
            </div>

            <div className="w-full flex items-end justify-between z-10">
                <ChristmasTree treeState={treeState} />

                <div className="flex flex-col items-center gap-4">
                    {raceState === 'idle' &&
                        <button onClick={handleStage} className="bg-yellow-400 text-black font-bold text-2xl px-12 py-4 rounded-md shadow-lg hover:bg-yellow-300">
                            STAGE
                        </button>
                    }
                     {(raceState === 'staging' || raceState === 'countdown' || raceState === 'go') &&
                        <button onClick={handleLaunch} className="bg-green-500 text-white font-bold text-2xl px-12 py-4 rounded-md shadow-lg hover:bg-green-400 animate-pulse">
                            LAUNCH
                        </button>
                    }
                </div>

                <NosSwitch 
                    isArmed={isNosArmed}
                    isActive={isNosActive}
                    nosLevel={nosLevel}
                    onArm={() => setIsNosArmed(prev => !prev)}
                    onToggle={() => setIsNosActive(prev => !prev)}
                />
            </div>

            {raceState === 'finished' && <TimeSlip results={results} onReset={resetRun} />}
        </div>
    );
};


const RacePack: React.FC = () => {
    const [activeTab, setActiveTab] = useState('live');
    const { session, startSession, stopSession, recordLap } = useRaceSession();
    
    const [isSummaryVisible, setIsSummaryVisible] = useState(false);
    const [sessionToSave, setSessionToSave] = useState<SavedRaceSession | null>(null);
    const [savedSessions, setSavedSessions] = useState<SavedRaceSession[]>([]);
    const [leaderboard, setLeaderboard] = useState<Leaderboard>({ zeroToHundred: null, quarterMileTime: null, quarterMileSpeed: null });
    const [selectedSession, setSelectedSession] = useState<SavedRaceSession | null>(null);

    useEffect(() => {
        setSavedSessions(storage.getSavedSessions());
        setLeaderboard(storage.getLeaderboard());
    }, []);

    const handleStop = () => {
        stopSession();
        const { data, ...summary } = session;
        const now = new Date();
        const sessionSnapshot: SavedRaceSession = {
            id: now.toISOString(),
            date: now.toLocaleString(),
            totalTime: summary.elapsedTime,
            maxSpeed: Math.max(0, ...data.map(d => d.speed)),
            distance: data.length > 0 ? data[data.length - 1].distance : 0,
            data,
            zeroToHundredTime: summary.zeroToHundredTime,
            quarterMileTime: summary.quarterMileTime,
            quarterMileSpeed: summary.quarterMileSpeed,
            lapTimes: summary.lapTimes,
            gpsPath: summary.gpsPath,
        };
        setSessionToSave(sessionSnapshot);
        setIsSummaryVisible(true);
    };

    const handleSaveSession = () => {
        if (sessionToSave) {
            storage.saveSession(sessionToSave);
            storage.updateLeaderboard(sessionToSave);
            setSavedSessions(storage.getSavedSessions());
            setLeaderboard(storage.getLeaderboard());
        }
        setIsSummaryVisible(false);
        setSessionToSave(null);
    };
    
    const bestLap = useMemo(() => {
        if (!session.lapTimes || session.lapTimes.length === 0) return null;
        return session.lapTimes.reduce((best, current) => current.time < best.time ? current : best, session.lapTimes[0]);
    }, [session.lapTimes]);


    const renderLiveSession = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-black/30 rounded-b-lg">
            <div className="lg:col-span-1 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-4">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 font-display">Session Control</h2>
                <div className="text-center bg-base-800/50 rounded-md p-4">
                    <p className="text-sm text-gray-400">Elapsed Time</p>
                    <p className="font-mono text-5xl text-brand-cyan tracking-wider">{formatTime(session.elapsedTime)}</p>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    {!session.isActive ? (
                        <button onClick={startSession} className="col-span-2 bg-green-600 text-white font-semibold py-3 rounded-md hover:bg-green-500 transition-colors">Start Session</button>
                    ) : (
                        <button onClick={handleStop} className="col-span-2 bg-red-600 text-white font-semibold py-3 rounded-md hover:bg-red-500 transition-colors">Stop Session</button>
                    )}
                    <button onClick={recordLap} disabled={!session.isActive} className="col-span-2 bg-brand-blue text-white font-semibold py-3 rounded-md hover:bg-blue-500 transition-colors disabled:bg-base-700 disabled:cursor-not-allowed">Record Lap</button>
                </div>
                 <div className="space-y-2 pt-4 border-t border-brand-cyan/30">
                    <StatCard title="0-100 km/h" value={session.zeroToHundredTime ? `${session.zeroToHundredTime.toFixed(2)}s` : '--'} />
                    <StatCard title="1/4 Mile Time" value={session.quarterMileTime ? `${session.quarterMileTime.toFixed(2)}s` : '--'} />
                </div>
            </div>
            <div className="lg:col-span-2 bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="h-full flex flex-col">
                        <h3 className="text-md font-semibold mb-2 font-display">Lap Times</h3>
                        <div className="space-y-2 flex-grow overflow-y-auto bg-base-900/50 p-2 rounded-md">
                        {session.lapTimes.length > 0 ? (
                            session.lapTimes.map(lap => (
                                <div key={lap.lap} className={`flex justify-between items-center p-2 rounded-md font-mono ${bestLap?.lap === lap.lap ? 'bg-purple-800/50' : 'bg-base-800/50'}`}>
                                    <span className="text-gray-400">Lap {lap.lap}</span>
                                    <span className="text-white text-lg">{formatTime(lap.time)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 pt-10">No laps recorded.</div>
                        )}
                        </div>
                    </div>
                    <div className="h-full">
                         {session.gpsPath.length > 0 ? <Map lat={session.gpsPath[session.gpsPath.length - 1].latitude} lon={session.gpsPath[session.gpsPath.length - 1].longitude} /> : <div className="w-full h-full bg-base-800/50 rounded-md flex items-center justify-center text-gray-500">Waiting for GPS...</div> }
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-black/30 rounded-b-lg">
            <div className="md:col-span-1 bg-black p-4 rounded-lg border border-brand-cyan/30 shadow-lg">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-2 font-display">Saved Sessions</h2>
                <div className="space-y-2 h-[60vh] overflow-y-auto">
                    {savedSessions.length > 0 ? savedSessions.map(s => (
                        <button key={s.id} onClick={() => setSelectedSession(s)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedSession?.id === s.id ? 'bg-brand-blue/80' : 'bg-base-800/50 hover:bg-base-800'}`}>
                            <p className="font-semibold text-white">{s.date}</p>
                            <p className="text-xs text-gray-400">{s.lapTimes.length} Laps - {formatTime(s.totalTime)}</p>
                        </button>
                    )) : <p className="text-gray-500 text-center pt-10">No saved sessions.</p>}
                </div>
            </div>
            <div className="md:col-span-2 bg-black p-4 rounded-lg border border-brand-cyan/30 shadow-lg">
                <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-2 font-display">Session Details</h2>
                {selectedSession ? (
                    <div className="grid grid-cols-2 gap-4 h-[60vh]">
                        <div className="space-y-3">
                           <StatCard title="Total Time" value={formatTime(selectedSession.totalTime)} />
                           <StatCard title="Max Speed" value={`${selectedSession.maxSpeed.toFixed(0)} km/h`} />
                           <StatCard title="Distance" value={`${(selectedSession.distance / 1000).toFixed(2)} km`} />
                           <div className="text-md font-semibold font-display pt-2">Lap Times</div>
                           <div className="space-y-1 overflow-y-auto max-h-40 bg-base-900/50 p-2 rounded-md">
                               {selectedSession.lapTimes.map(l => <div key={l.lap} className="flex justify-between font-mono text-sm p-1"><span>Lap {l.lap}</span><span>{formatTime(l.time)}</span></div>)}
                           </div>
                        </div>
                        <RouteMap path={selectedSession.gpsPath} />
                    </div>
                ) : <p className="text-gray-500 text-center pt-10">Select a session to view details.</p>}
            </div>
        </div>
    );
    
    const renderLeaderboard = () => (
        <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg">
             <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 mb-6 font-display">Personal Bests</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LeaderboardCard title="0-100 km/h" entry={leaderboard.zeroToHundred} format={v => `${v.toFixed(2)}s`} />
                <LeaderboardCard title="1/4 Mile Time" entry={leaderboard.quarterMileTime} format={v => `${v.toFixed(2)}s`} />
                <LeaderboardCard title="1/4 Mile Speed" entry={leaderboard.quarterMileSpeed} format={v => `${v.toFixed(0)} km/h`} />
             </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100 font-display">Race Pack</h1>
                    <p className="text-gray-400 mt-1">High-precision performance timing and data logging.</p>
                </div>
            </div>
            <div className="bg-base-800/30 rounded-t-lg flex">
                <TabButton label="Circuit Mode" icon={<StopwatchIcon />} isActive={activeTab === 'live'} onClick={() => setActiveTab('live')} />
                <TabButton label="Drag Mode" icon={<TuneIcon className="h-5 w-5" />} isActive={activeTab === 'drag'} onClick={() => setActiveTab('drag')} />
                <TabButton label="History" icon={<HistoryIcon />} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <TabButton label="Leaderboard" icon={<TrophyIcon />} isActive={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
            </div>

            <div>
                {activeTab === 'live' && renderLiveSession()}
                {activeTab === 'drag' && <DragMode />}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'leaderboard' && renderLeaderboard()}
            </div>

            {isSummaryVisible && sessionToSave && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-base-900 rounded-lg border border-brand-cyan shadow-lg p-6">
                         <h2 className="text-2xl font-bold font-display text-brand-cyan">Session Summary</h2>
                         <p className="text-gray-400 mb-4">{sessionToSave.date}</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh]">
                            <div className="space-y-3">
                                <StatCard title="Total Time" value={formatTime(sessionToSave.totalTime)} />
                                <div className="grid grid-cols-2 gap-3">
                                <StatCard title="0-100" value={sessionToSave.zeroToHundredTime ? `${sessionToSave.zeroToHundredTime.toFixed(2)}s` : '--'} />
                                <StatCard title="1/4 Mile" value={sessionToSave.quarterMileTime ? `${sessionToSave.quarterMileTime.toFixed(2)}s` : '--'} />
                                <StatCard title="Max Speed" value={`${sessionToSave.maxSpeed.toFixed(0)} km/h`} />
                                <StatCard title="Distance" value={`${(sessionToSave.distance / 1000).toFixed(2)} km`} />
                                </div>
                            </div>
                            <RouteMap path={sessionToSave.gpsPath} />
                         </div>
                         <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsSummaryVisible(false)} className="px-6 py-2 rounded-md bg-base-700 text-white font-semibold hover:bg-base-600">Discard</button>
                            <button onClick={handleSaveSession} className="px-6 py-2 rounded-md bg-brand-blue text-white font-semibold hover:bg-blue-600">Save Session</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LeaderboardCard: React.FC<{title: string, entry: Leaderboard['zeroToHundred'], format: (v: number) => string}> = ({title, entry, format}) => (
    <div className="bg-base-800/50 p-6 rounded-lg text-center border-2 border-transparent hover:border-yellow-400/50 transition-colors">
        <TrophyIcon className="w-10 h-10 mx-auto text-yellow-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-300">{title}</h3>
        {entry ? (
            <>
                <p className="font-mono text-5xl text-white my-2">{format(entry.value)}</p>
                <p className="text-sm text-gray-500">Set on: {new Date(entry.date).toLocaleDateString()}</p>
            </>
        ) : (
            <p className="font-mono text-5xl text-gray-600 my-2">--</p>
        )}
    </div>
);


export default RacePack;