
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
import FilmIcon from './icons/FilmIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';

const navigation = [
  { name: 'Dashboard', href: '/', icon: GaugeIcon },
  { name: 'Race Pack', href: '/race-pack', icon: StopwatchIcon },
  { name: 'AI Engine', href: '/ai-engine', icon: EngineIcon },
  { name: 'AR Assistant', href: '/ar-assistant', icon: ARIcon },
  { name: 'Dream Corsa', href: '/dream-corsa', icon: FilmIcon },
  { name: 'Diagnostics', href: '/diagnostics', icon: ChatIcon },
  { name: 'Logbook', href: '/logbook', icon: WrenchIcon },
  { name: 'Tuning', href: '/tuning', icon: TuningForkIcon },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
  { name: 'Accessories', href: '/accessories', icon: SoundWaveIcon },
  { name: 'Appearance', href: '/appearance', icon: PaintBrushIcon },
  { name: 'Security', href: '/security', icon: ShieldIcon },
  { name: 'Hedera DLT', href: '/hedera', icon: HederaIcon },
];

const logoBase64 = `data:image/jpeg;base64,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igCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCii-==`;

const Sidebar: React.FC = () => {
  return (
    <div className="w-20 md:w-64 carbon-background border-r border-black/50 flex flex-col shadow-inner z-10">
      <div className="flex items-center justify-center md:justify-start h-20 border-b border-black/50 px-6">
        <div className="relative">
          <img src={logoBase64} alt="Karapiro Cartel Logo" className="w-12 h-12 rounded-full md:mr-3 object-cover border-2 border-gray-700" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
        </div>
        <div className="hidden md:flex md:flex-col">
           <h1 className="text-lg font-bold text-gray-100 font-display leading-tight">Karapiro Cartel</h1>
           <p className="text-xs text-gray-400 leading-tight">Speed Shop</p>
        </div>
      </div>
      <nav className="flex-1 px-2 md:px-4 py-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `group relative flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
                isActive
                  ? 'bg-base-800/50 text-white'
                  : 'text-gray-400 hover:bg-base-800/30 hover:text-white'
              }`
            }
          >
            {({isActive}) => (
              <>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-accent-primary)] rounded-r-full shadow-glow-theme"></div>}
                <item.icon className="h-6 w-6 mr-0 md:mr-3" aria-hidden="true" />
                <span className="hidden md:block">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-black/50">
        <div className="hidden md:block">
            <p className="text-xs text-gray-500">© 2024 Karapiro Cartel</p>
            <p className="text-xs text-gray-500">Vehicle OS v1.2</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
