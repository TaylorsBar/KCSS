
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import RallyThemeDashboard from './dashboards/RallyThemeDashboard';
import ModernThemeDashboard from './dashboards/ModernThemeDashboard';
import ClassicThemeDashboard from './dashboards/ClassicThemeDashboard';

const Dashboard: React.FC = () => {
  const { theme } = useContext(ThemeContext);

  const renderDashboard = () => {
    switch (theme) {
      case 'rally':
        return <RallyThemeDashboard />;
      case 'modern':
        return <ModernThemeDashboard />;
      case 'classic':
        return <ClassicThemeDashboard />;
      default:
        return <RallyThemeDashboard />;
    }
  };

  return <div className="h-full w-full">{renderDashboard()}</div>;
};

export default Dashboard;