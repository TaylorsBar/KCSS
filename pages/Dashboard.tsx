import React, { useContext } from 'react';
import { AppearanceContext } from '../contexts/AppearanceContext';
import RallyThemeDashboard from './dashboards/RallyThemeDashboard';
import ModernGaugeDashboard from './dashboards/ModernGaugeDashboard';
import ClassicThemeDashboard from './dashboards/ClassicThemeDashboard';
import LiveTuning from './LiveTuning';
import MinimalistDashboard from './dashboards/MinimalistDashboard';

const Dashboard: React.FC = () => {
  const { theme } = useContext(AppearanceContext);

  const renderDashboard = () => {
    switch (theme) {
      case 'rally':
        return <RallyThemeDashboard />;
      case 'modern':
        return <ModernGaugeDashboard />;
      case 'classic':
        return <ClassicThemeDashboard />;
      case 'haltech':
        return <LiveTuning />;
      case 'minimalist':
        return <MinimalistDashboard />;
      default:
        return <RallyThemeDashboard />;
    }
  };

  return <div className="h-full w-full">{renderDashboard()}</div>;
};

export default Dashboard;