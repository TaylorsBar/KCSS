import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import { AppearanceProvider } from './contexts/AppearanceContext.tsx';
import CoPilot from './components/CoPilot.tsx';
import { useVehicleStore } from './store/useVehicleStore.ts';
import { ConnectionStatus } from './types.ts';
import StartupOverlay from './components/StartupOverlay.tsx';
import BottomNavBar from './components/Tachometer.tsx'; // Repurposed for BottomNavBar

import Dashboard from './pages/Dashboard.tsx';
import Diagnostics from './pages/Diagnostics.tsx';
import MaintenanceLog from './pages/MaintenanceLog.tsx';
import TuningPage from './pages/TuningPage.tsx';
import AIEngine from './pages/AIEngine.tsx';
import Security from './pages/Security.tsx';
import ARAssistant from './pages/ARAssistant.tsx';
import Hedera from './pages/Hedera.tsx';
import Appearance from './pages/Appearance.tsx';
import Accessories from './pages/Accessories.tsx';
import RacePack from './pages/RacePack.tsx';
import Training from './pages/LiveTuning.tsx';

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { connectionStatus, triggerGaugeSweep } = useVehicleStore(state => ({
    connectionStatus: state.connectionStatus,
    triggerGaugeSweep: state.triggerGaugeSweep,
  }));
  const [isStartingUp, setIsStartingUp] = useState(true);

  useEffect(() => {
    // This sequence is timed to match the animations in StartupOverlay.tsx
    const sequenceTimer = setTimeout(() => {
      // After logo animation (3.5s), trigger the gauge sweep
      triggerGaugeSweep();
    }, 3500);

    const finalTimer = setTimeout(() => {
      // After the entire sequence is over (5s), remove the overlay
      setIsStartingUp(false);
    }, 5000);

    return () => {
      clearTimeout(sequenceTimer);
      clearTimeout(finalTimer);
    };
  }, [triggerGaugeSweep]);


  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const mainFrameClasses = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'border-[var(--theme-accent-primary)] shadow-glow-theme';
      case ConnectionStatus.CONNECTING:
        return 'border-brand-yellow shadow-glow-yellow animate-pulse';
      case ConnectionStatus.ERROR:
        return 'border-brand-red shadow-glow-red';
      case ConnectionStatus.DISCONNECTED:
      default:
        return 'border-gray-800 shadow-none';
    }
  };

  return (
    <AppearanceProvider>
      <HashRouter>
        <StartupOverlay isVisible={isStartingUp} />
        <div className="h-screen bg-black text-gray-200">
          <div className="flex h-full md:gap-4 md:p-4">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <main className="flex-1 overflow-hidden md:rounded-2xl theme-background">
                <div className={`h-full w-full md:rounded-2xl border-0 md:border-2 overflow-y-auto transition-all duration-500 pb-20 md:pb-0 ${mainFrameClasses()}`}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/diagnostics" element={<Diagnostics />} />
                    <Route path="/logbook" element={<MaintenanceLog />} />
                    <Route path="/tuning" element={<TuningPage />} />
                    <Route path="/ai-engine" element={<AIEngine />} />
                    <Route path="/ar-assistant" element={<ARAssistant />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/hedera" element={<Hedera />} />
                    <Route path="/race-pack" element={<RacePack />} />
                    <Route path="/accessories" element={<Accessories />} />
                    <Route path="/appearance" element={<Appearance />} />
                    <Route path="/training" element={<Training />} />
                  </Routes>
                </div>
              </main>
              <CoPilot />
            </div>
          </div>
          <BottomNavBar />
        </div>
      </HashRouter>
    </AppearanceProvider>
  );
};

export default App;
