

import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Diagnostics from './pages/Diagnostics';
import MaintenanceLog from './pages/MaintenanceLog';
import TuningPage from './pages/TuningPage';
import AIEngine from './pages/AIEngine';
import Security from './pages/Security';
import ARAssistant from './pages/ARAssistant';
import Hedera from './pages/Hedera';
import Appearance from './pages/Appearance';
import Accessories from './pages/Accessories';
import { AppearanceProvider } from './contexts/AppearanceContext';
import CoPilot from './components/CoPilot';
import RacePack from './pages/RacePack';
import { useVehicleStore } from './store/useVehicleStore';
import { ConnectionStatus } from './types';

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const connectionStatus = useVehicleStore(state => state.connectionStatus);

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
        return 'border-gray-600 shadow-none';
    }
  };

  return (
    <AppearanceProvider>
      <HashRouter>
        <div className="flex h-screen bg-black text-gray-200">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <main className="flex-1 overflow-hidden carbon-background p-4">
              <div className={`h-full w-full rounded-lg border-2 overflow-y-auto transition-all duration-500 ${mainFrameClasses()}`}>
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
                </Routes>
              </div>
            </main>
            <CoPilot />
          </div>
        </div>
      </HashRouter>
    </AppearanceProvider>
  );
};

export default App;