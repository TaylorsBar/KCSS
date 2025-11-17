

import React, { useContext } from 'react';
import { AppearanceContext } from '../contexts/AppearanceContext.tsx';
import RallyThemeDashboard from './dashboards/RallyThemeDashboard.tsx';
import ModernGaugeDashboard from './dashboards/ModernGaugeDashboard.tsx';
import ClassicThemeDashboard from './dashboards/ClassicThemeDashboard.tsx';
import HaltechDashboard from './dashboards/HaltechDashboard.tsx';
import MinimalistDashboard from './dashboards/MinimalistDashboard.tsx';
import Ic7Dashboard from './dashboards/Ic7Dashboard.tsx';

const Dashboard: React.FC = () => {
  const { theme } = useContext(AppearanceContext);

  const renderDashboard = () => {
    switch (theme) {
      case 'modern':
        return <ModernGaugeDashboard />;
      case 'classic':
        return <ClassicThemeDashboard />;
      case 'haltech':
        return <HaltechDashboard />;
      case 'minimalist':
        return <MinimalistDashboard />;
      case 'ic7':
        return <Ic7Dashboard />;
      case 'rally':
      default:
        return <RallyThemeDashboard />;
    }
  };

  return (
    <div className="h-full w-full">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;