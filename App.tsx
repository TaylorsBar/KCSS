
import React, { Suspense } from 'react';
// FIX: The project uses react-router-dom v7 (via importmap), but the code was written for v5.
// Updating imports and syntax to be compatible with v7.
// 'Switch' is replaced by 'Routes', and `component` prop is replaced by `element`.
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AppearanceProvider } from './contexts/AppearanceContext';
import CoPilot from './components/CoPilot';
import { useVehicleData } from './hooks/useVehicleData';
import { MOCK_ALERTS } from './data/mockAlerts'; // Mock alerts for context

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Diagnostics = React.lazy(() => import('./pages/Diagnostics'));
const MaintenanceLog = React.lazy(() => import('./pages/MaintenanceLog'));
const TuningPage = React.lazy(() => import('./pages/TuningPage'));
const AIEngine = React.lazy(() => import('./pages/AIEngine'));
const Security = React.lazy(() => import('./pages/Security'));
const ARAssistant = React.lazy(() => import('./pages/ARAssistant'));
const Hedera = React.lazy(() => import('./pages/Hedera'));
const Appearance = React.lazy(() => import('./pages/Appearance'));
const Accessories = React.lazy(() => import('./pages/Accessories'));
const RacePack = React.lazy(() => import('./pages/RacePack'));
const DreamCorsa = React.lazy(() => import('./pages/DreamCorsa'));
const Marketplace = React.lazy(() => import('./pages/Marketplace'));

const LoadingSpinner: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-transparent">
    <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 animate-spin border-t-brand-cyan"></div>
  </div>
);

const App: React.FC = () => {
  const { latestData, hasActiveFault } = useVehicleData();

  // Filter alerts based on the active fault state from the simulation
  const activeAlerts = hasActiveFault 
    ? MOCK_ALERTS.filter(alert => alert.isFaultRelated) 
    : [];

  return (
    <AppearanceProvider>
      <HashRouter>
        <div className="flex h-screen bg-black text-gray-200">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <main className="flex-1 overflow-x-hidden overflow-y-auto theme-background carbon-background">
              <Suspense fallback={<LoadingSpinner />}>
                {/* FIX: Use Routes instead of Switch for react-router-dom v7 */}
                <Routes>
                  {/* FIX: Use `element` prop for v7 */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/diagnostics" element={<Diagnostics />} />
                  <Route path="/logbook" element={<MaintenanceLog />} />
                  <Route path="/tuning" element={<TuningPage />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/ai-engine" element={<AIEngine />} />
                  <Route path="/ar-assistant" element={<ARAssistant latestData={latestData} />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/hedera" element={<Hedera />} />
                  <Route path="/race-pack" element={<RacePack />} />
                  <Route path="/dream-corsa" element={<DreamCorsa />} />
                  <Route path="/accessories" element={<Accessories />} />
                  <Route path="/appearance" element={<Appearance />} />
                </Routes>
              </Suspense>
            </main>
            <CoPilot latestVehicleData={latestData} activeAlerts={activeAlerts} />
          </div>
        </div>
      </HashRouter>
    </AppearanceProvider>
  );
};

export default App;