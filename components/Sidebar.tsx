
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

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className={`carbon-background border-r border-black/50 flex flex-col shadow-inner z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-24 py-4 border-b border-black/50 overflow-hidden">
        <div className={`font-display font-black leading-tight text-center whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'text-2xl' : 'text-4xl'}`}>
            <span className="text-white tracking-tighter">{isCollapsed ? 'C' : 'CARTEL'}</span>
            <span className="text-[var(--theme-accent-primary)]">{isCollapsed ? 'W' : 'WORXX'}</span>
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

      <div className="p-2 border-t border-black/50 mt-auto">
        <div className={`text-center py-2 transition-all duration-200 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-12'}`}>
            <div className="font-classic text-sm tracking-[0.2em] text-gray-400 whitespace-nowrap">KARAPIRO CARTEL</div>
            <div className="font-mono text-[10px] text-gray-500 whitespace-nowrap">STATEHIGHWAY SPEEDSHOP</div>
        </div>
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center w-full p-2 text-gray-400 rounded-md hover:bg-base-800/30 hover:text-white"
        >
          <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
