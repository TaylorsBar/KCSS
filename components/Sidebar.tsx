import React from 'react';
import { NavLink } from 'react-router-dom';
import GaugeIcon from './icons/GaugeIcon';
import ChatIcon from './icons/ChatIcon';
import WrenchIcon from './icons/WrenchIcon';
import TuningForkIcon from './icons/TuningForkIcon';
import EngineIcon from './icons/EngineIcon';
import ShieldIcon from './icons/ShieldIcon';
import ARIcon from './icons/ARIcon';
import HederaIcon from './icons/HederaIcon';
import StopwatchIcon from './icons/StopwatchIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import SoundWaveIcon from './icons/SoundWaveIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import { useVehicleStore } from '../store/useVehicleStore';
import { ConnectionStatus } from '../types';

const navigation = [
  { name: 'Dashboard', href: '/', icon: GaugeIcon },
  { name: 'Race Pack', href: '/race-pack', icon: StopwatchIcon },
  { name: 'AI Engine', href: '/ai-engine', icon: EngineIcon },
  { name: 'AR Assistant', href: '/ar-assistant', icon: ARIcon },
  { name: 'Diagnostics', href: '/diagnostics', icon: ChatIcon },
  { name: 'Logbook', href: '/logbook', icon: WrenchIcon },
  { name: 'Tuning', href: '/tuning', icon: TuningForkIcon },
  { name: 'Accessories', href: '/accessories', icon: SoundWaveIcon },
  { name: 'Appearance', href: '/appearance', icon: PaintBrushIcon },
  { name: 'Security', href: '/security', icon: ShieldIcon },
  { name: 'Hedera DLT', href: '/hedera', icon: HederaIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ConnectionIndicator: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const connectionStatus = useVehicleStore(state => state.connectionStatus);

  const statusInfo = {
    [ConnectionStatus.CONNECTED]: { color: 'bg-green-500', text: 'Connected' },
    [ConnectionStatus.CONNECTING]: { color: 'bg-yellow-500', text: 'Connecting' },
    [ConnectionStatus.DISCONNECTED]: { color: 'bg-gray-500', text: 'Disconnected' },
    [ConnectionStatus.ERROR]: { color: 'bg-red-500', text: 'Error' },
  };

  const { color, text } = statusInfo[connectionStatus];
  const isConnecting = connectionStatus === ConnectionStatus.CONNECTING;

  return (
    <div className={`flex items-center gap-2 p-2 mb-2 border-y border-black/50 ${isCollapsed ? 'justify-center' : 'px-4'}`} title={text}>
      <div className={`w-3 h-3 rounded-full ${color} ${isConnecting ? 'animate-pulse' : ''}`}></div>
      {!isCollapsed && <span className="text-sm text-gray-300">{text}</span>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className={`carbon-background border-r border-black/50 flex flex-col shadow-inner z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="relative flex items-center justify-center h-24 py-4 border-b border-black/50 overflow-hidden">
        {/* Expanded Logo */}
        <div className={`absolute transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="font-classic text-4xl whitespace-nowrap">
            <span className="text-gray-300 tracking-tighter">Cartel</span>
            <span className="text-[var(--theme-accent-primary)] tracking-normal">Worx</span>
          </div>
        </div>
        {/* Collapsed Logo */}
        <div className={`absolute transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="font-classic text-4xl">
            <span className="text-gray-300 tracking-tighter">C</span>
            <span className="text-[var(--theme-accent-primary)] tracking-normal">W</span>
          </div>
        </div>
      </div>
      <nav className={`flex-1 py-4 space-y-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `group relative flex items-center py-3 text-sm font-medium rounded-md transition-all duration-150 ease-in-out ${isCollapsed ? 'px-3 justify-center' : 'px-4'} ${
                isActive
                  ? 'bg-base-800/50 text-white'
                  : 'text-gray-400 hover:bg-base-800/30 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {!isCollapsed && isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-accent-primary)] rounded-r-full shadow-glow-theme"></div>}
                <item.icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'}`}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <ConnectionIndicator isCollapsed={isCollapsed} />
        <div className="p-2">
            <button
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-full p-2 text-gray-400 rounded-md hover:bg-base-800/30 hover:text-white"
            >
            <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;