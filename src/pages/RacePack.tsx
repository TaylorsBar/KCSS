import React, { useState, useEffect, useMemo } from 'react';
import { useRaceSession } from '../hooks/useRaceSession.ts';
import * as storage from '../services/storageService.ts';
import { SavedRaceSession, Leaderboard } from '../types.ts';
import { getRaceAnalysis } from '../services/geminiService.ts';
import ReactMarkdown from 'react-markdown';
import HistoryIcon from '../components/icons/HistoryIcon.tsx';
import TrophyIcon from '../components/icons/TrophyIcon.tsx';
import StopwatchIcon from '../components/icons/StopwatchIcon.tsx';
import GpsIcon from '../components/icons/GpsIcon.tsx';
import EngineIcon from '../components/icons/EngineIcon.tsx';
import CameraIcon from '../components/icons/CameraIcon.tsx';
import { useVehicleStore } from '../store/useVehicleStore.ts';
import { useUnitConversion } from '../hooks/useUnitConversion.ts';
import SessionComparison from '../components/SessionComparison.tsx';
import TrackCamera from '../components/TrackCamera.tsx';

const formatTime = (ms: number) => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${minutes}:${seconds}.${milliseconds}`;
};

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-base-800/50 p-3 rounded-md text-center">
    <div className="text-xs text-gray-400">{title}</div>
    <p className="font-mono text-2xl text-white mt-1">{value}</p>
  </div>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({
  label,
  icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-3 py-3 text-sm font-semibold rounded-t-lg transition-all ${
      isActive
        ? 'bg-black text-[var(--theme-accent-primary)] border-b-2 border-[var(--theme-accent-primary)]'
        : 'bg-transparent text-gray-400 hover:bg-base-800/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

const LeaderboardCard: React.FC<{ title: string; entry: { value: number; date: string } | null; format: (v: number) => string }> = ({
  title,
  entry,
  format,
}) => (
  <div className="bg-base-800/50 p-4 rounded-lg">
    <h4 className="text-sm font-semibold text-gray-400">{title}</h4>
    {entry ? (
      <>
        <p className="font-mono text-3xl text-[var(--theme-accent-primary)] mt-1">{format(entry.value)}</p>
        <p className="text-xs text-gray-500 mt-1">Set on {new Date(entry.date).toLocaleDateString()}</p>
      </>
    ) : (
      <p className="text-2xl text-gray-600 mt-2">--</p>
    )}
  </div>
);

const RacePack: React.FC = () => {
  const [activeTab, setActiveTab] = useState('live');
  const { session, startSession, stopSession, recordLap } = useRaceSession();
  const { latestData, vehicleDataHistory } = useVehicleStore((state) => ({
    latestData: state.latestData,
    vehicleDataHistory: state.data,
  }));
  const { convertSpeed, getSpeedUnit } = useUnitConversion();

  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [sessionToSave, setSessionToSave] = useState<SavedRaceSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedRaceSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>({
    zeroToHundredKmh: null,
    zeroToSixtyMph: null,
    sixtyToHundredThirtyMph: null,
    hundredToTwoHundredKmh: null,
    quarterMileTime: null,
    quarterMileSpeed: null,
  });
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const sessionsForComparison = useMemo(
    () => savedSessions.filter((s) => selectedForCompare.includes(s.id)),
    [savedSessions, selectedForCompare]
  );
  const [analysisResult, setAnalysisResult] = useState<{
    session: SavedRaceSession | null;
    analysis: string | null;
    isLoading: boolean;
    error?: string;
  }>({ session: null, analysis: null, isLoading: false });

  useEffect(() => {
    setSavedSessions(storage.getSavedSessions());
    setLeaderboard(storage.getLeaderboard());
  }, []);

  const handleStop = () => {
    stopSession();
    const { data, _internal, ...summary } = session as typeof session & { _internal?: unknown };
    const now = new Date();
    const sessionSnapshot: SavedRaceSession = {
      id: now.toISOString(),
      date: now.toLocaleString(),
      totalTime: summary.elapsedTime,
      maxSpeed: Math.max(0, ...data.map((d) => d.speed)),
      distance: data.length > 0 ? data[data.length - 1].distance : 0,
      data,
      zeroToHundredKmhTime: summary.zeroToHundredKmhTime,
      zeroToSixtyMphTime: summary.zeroToSixtyMphTime,
      sixtyToHundredThirtyMphTime: summary.sixtyToHundredThirtyMphTime,
      hundredToTwoHundredKmhTime: summary.hundredToTwoHundredKmhTime,
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

  const handleCompareSelect = (sessionId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(sessionId)) return prev.filter((id) => id !== sessionId);
      const next = [...prev, sessionId];
      return next.length > 2 ? next.slice(1) : next;
    });
  };

  const handleAnalyzeSession = async (sessionToAnalyze: SavedRaceSession) => {
    setAnalysisResult({ session: sessionToAnalyze, analysis: null, isLoading: true });
    try {
      const result = await getRaceAnalysis(sessionToAnalyze);
      setAnalysisResult({ session: sessionToAnalyze, analysis: result, isLoading: false });
    } catch (e) {
      setAnalysisResult({
        session: sessionToAnalyze,
        analysis: null,
        isLoading: false,
        error: e instanceof Error ? e.message : 'An unknown error occurred.',
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 font-display">Race Pack</h1>
        <p className="text-gray-400 mt-1">High-precision performance timing and data logging.</p>
      </div>

      <div className="bg-base-800/30 rounded-t-lg flex flex-wrap">
        <TabButton label="Live Session" icon={<StopwatchIcon />} isActive={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <TabButton label="Track Camera" icon={<CameraIcon />} isActive={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
        <TabButton label="GPS" icon={<GpsIcon />} isActive={activeTab === 'gps'} onClick={() => setActiveTab('gps')} />
        <TabButton label="History" icon={<HistoryIcon />} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <TabButton label="Leaderboard" icon={<TrophyIcon />} isActive={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
      </div>

      <div className="p-4 bg-black/30 rounded-b-lg">
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-black p-6 rounded-lg border border-[var(--theme-accent-primary)]/30 shadow-lg space-y-4">
              <h2 className="text-lg font-semibold border-b border-[var(--theme-accent-primary)]/30 pb-2 font-display">Session Control</h2>
              <div className="text-center bg-base-800/50 rounded-md p-4">
                <p className="text-sm text-gray-400">Elapsed Time</p>
                <p className="font-mono text-5xl text-[var(--theme-accent-primary)] tracking-wider">{formatTime(session.elapsedTime)}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {!session.isActive ? (
                  <button onClick={startSession} className="btn btn-success">
                    Start Session
                  </button>
                ) : (
                  <button onClick={handleStop} className="btn btn-danger">
                    Stop Session
                  </button>
                )}
                <button onClick={recordLap} disabled={!session.isActive} className="btn btn-action">
                  Record Lap
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--theme-accent-primary)]/30">
                <StatCard title="0-100 km/h" value={session.zeroToHundredKmhTime ? `${session.zeroToHundredKmhTime.toFixed(2)}s` : '--'} />
                <StatCard title="0-60 mph" value={session.zeroToSixtyMphTime ? `${session.zeroToSixtyMphTime.toFixed(2)}s` : '--'} />
                <StatCard title="1/4 Mile" value={session.quarterMileTime ? `${session.quarterMileTime.toFixed(2)}s` : '--'} />
                <StatCard title={`Speed (${getSpeedUnit()})`} value={`${convertSpeed(latestData.speed).toFixed(0)}`} />
              </div>
            </div>
            <div className="lg:col-span-2 bg-black p-6 rounded-lg border border-[var(--theme-accent-primary)]/30 shadow-lg">
              <h3 className="text-md font-semibold mb-2 font-display">Lap Times</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {session.lapTimes.length > 0 ? (
                  session.lapTimes.map((lap) => (
                    <div key={lap.lap} className="flex justify-between items-center p-2 rounded-md font-mono bg-base-800/50">
                      <span className="text-gray-400">Lap {lap.lap}</span>
                      <span className="text-white text-lg">{formatTime(lap.time)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 pt-10">No laps recorded.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'camera' &&
          (session.isActive ? (
            <TrackCamera
              latestData={session.data[session.data.length - 1]}
              gpsPath={session.gpsPath}
              lapTimes={session.lapTimes}
              elapsedTime={session.elapsedTime}
            />
          ) : (
            <div className="text-center text-gray-400 p-10 bg-black rounded-lg border border-[var(--theme-accent-primary)]/30">
              Start a live session to use the track camera.
            </div>
          ))}

        {activeTab === 'gps' && (
          <div className="h-[50vh] bg-black p-4 rounded-lg border border-[var(--theme-accent-primary)]/30 flex items-center justify-center text-gray-400">
            GPS points logged: {vehicleDataHistory.filter((d) => d.latitude && d.longitude).length}
            <span className="ml-2 text-sm">(map surface uses live session path when available)</span>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-black p-4 rounded-lg border border-[var(--theme-accent-primary)]/30">
              <h2 className="text-lg font-semibold border-b border-[var(--theme-accent-primary)]/30 pb-2 mb-2 font-display">Saved Sessions</h2>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {savedSessions.length > 0 ? (
                  savedSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`p-3 rounded-md ${selectedForCompare.includes(s.id) ? 'bg-[var(--theme-accent-primary)]/80' : 'bg-base-800/50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selectedForCompare.includes(s.id)} onChange={() => handleCompareSelect(s.id)} />
                        <div>
                          <p className="font-semibold text-white">{s.date}</p>
                          <p className="text-xs text-gray-400">
                            {s.lapTimes.length} Laps — {formatTime(s.totalTime)}
                          </p>
                          <button
                            onClick={() => handleAnalyzeSession(s)}
                            className="mt-2 text-xs bg-[var(--theme-accent-primary)]/80 text-black px-2 py-1 rounded font-semibold flex items-center gap-1"
                          >
                            <EngineIcon className="w-4 h-4" /> AI Race Coach
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center pt-10">No saved sessions.</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2 bg-black p-4 rounded-lg border border-[var(--theme-accent-primary)]/30">
              <h2 className="text-lg font-semibold border-b border-[var(--theme-accent-primary)]/30 pb-2 mb-2 font-display">Session Comparison</h2>
              {sessionsForComparison.length === 2 ? (
                <SessionComparison sessions={[sessionsForComparison[0], sessionsForComparison[1]]} />
              ) : (
                <p className="text-gray-500 text-center pt-10">Select two sessions to compare.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-black p-6 rounded-lg border border-[var(--theme-accent-primary)]/30">
            <h2 className="text-lg font-semibold border-b border-[var(--theme-accent-primary)]/30 pb-2 mb-6 font-display">Personal Bests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <LeaderboardCard title="0-100 km/h" entry={leaderboard.zeroToHundredKmh} format={(v) => `${v.toFixed(2)}s`} />
              <LeaderboardCard title="0-60 mph" entry={leaderboard.zeroToSixtyMph} format={(v) => `${v.toFixed(2)}s`} />
              <LeaderboardCard title="1/4 Mile Time" entry={leaderboard.quarterMileTime} format={(v) => `${v.toFixed(2)}s`} />
              <LeaderboardCard
                title="1/4 Mile Speed"
                entry={leaderboard.quarterMileSpeed}
                format={(v) => `${convertSpeed(v).toFixed(0)} ${getSpeedUnit()}`}
              />
            </div>
          </div>
        )}
      </div>

      {isSummaryVisible && sessionToSave && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-base-900 rounded-lg border border-[var(--theme-accent-primary)] shadow-lg p-6">
            <h2 className="text-2xl font-bold font-display text-[var(--theme-accent-primary)]">Session Summary</h2>
            <p className="text-gray-400 mb-4">{sessionToSave.date}</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Total Time" value={formatTime(sessionToSave.totalTime)} />
              <StatCard title={`Max Speed (${getSpeedUnit()})`} value={`${convertSpeed(sessionToSave.maxSpeed).toFixed(0)}`} />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setIsSummaryVisible(false)} className="btn btn-secondary">
                Discard
              </button>
              <button onClick={handleSaveSession} className="btn btn-primary">
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {analysisResult.session && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setAnalysisResult({ session: null, analysis: null, isLoading: false })}
        >
          <div className="w-full max-w-2xl bg-base-900 rounded-lg border border-[var(--theme-accent-primary)] shadow-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold font-display text-[var(--theme-accent-primary)]">AI Race Coach</h2>
            <p className="text-gray-400 mb-4">Session from {analysisResult.session.date}</p>
            <div className="h-[50vh] overflow-y-auto">
              {analysisResult.isLoading ? (
                <p className="text-center text-gray-400">Analyzing...</p>
              ) : analysisResult.error ? (
                <p className="text-red-400">{analysisResult.error}</p>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{analysisResult.analysis || ''}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RacePack;
