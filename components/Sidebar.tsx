import React from 'react';
// FIX: The project uses react-router-dom v7 (via importmap), but the NavLink was using v5 syntax.
// Updating NavLink to use a function for className and children to handle active state.
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

// Custom SVG Logo Components - V4 "CartelWorx" Banner with new animation
const LogoCartelWorx: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>CartelWorx Logo</title>
    <defs>
      <filter id="logo-glow-cw" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      {/* Animated gradient for a sideways letter-by-letter illumination */}
      <linearGradient id="scanline-grad-cw" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0%" stopColor="var(--theme-accent-primary)" stopOpacity="0" />
         <stop offset="45%" stopColor="var(--theme-accent-secondary)" stopOpacity="0.7" />
         <stop offset="50%" stopColor="var(--theme-accent-primary)" stopOpacity="1" />
         <stop offset="55%" stopColor="var(--theme-accent-secondary)" stopOpacity="0.7" />
         <stop offset="100%" stopColor="var(--theme-accent-primary)" stopOpacity="0" />
         <animate attributeName="x1" from="-0.5" to="1.5" dur="4s" repeatCount="indefinite" />
         <animate attributeName="x2" from="0.5" to="2.5" dur="4s" repeatCount="indefinite" />
      </linearGradient>

      <mask id="text-mask-cw">
        <rect width="220" height="50" fill="white" />
        <text x="110" y="32" fontFamily="Orbitron, sans-serif" fontSize="28" fontWeight="900" fill="black" textAnchor="middle">
          CARTELW<tspan dx="-4">O</tspan><tspan dx="4">RX</tspan>
        </text>
      </mask>
      
      <linearGradient id="text-grad-cw" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#B0B0B0" />
      </linearGradient>
    </defs>
    
    {/* Main Text */}
    <text x="110" y="32" fontFamily="Orbitron, sans-serif" fontSize="28" fontWeight="900" fill="url(#text-grad-cw)" textAnchor="middle">
      CARTELW<tspan dx="-4">O</tspan><tspan dx="4">RX</tspan>
    </text>

    {/* Koru inside the 'O' */}
    <g transform="translate(120, 18.5) scale(0.25)">
      <path
        d="M50,50 C60,50 65,40 65,35 C65,25 50,25 50,32"
        stroke="var(--theme-accent-primary)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        filter="url(#logo-glow-cw)"
      >
        <animate attributeName="stroke" values="var(--theme-accent-primary);#fff;var(--theme-accent-primary)" dur="4s" repeatCount="indefinite" />
      </path>
    </g>

    {/* Animated Scanline Effect */}
    <g mask="url(#text-mask-cw)">
       <rect x="0" y="0" width="220" height="50" fill="url(#scanline-grad-cw)" />
    </g>
  </svg>
);


const LogoBanner: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Karapiro Cartel Speed Shop Banner</title>
     <defs>
        <linearGradient id="shimmer" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
            {/* Replicating the scanline effect with neutral colors for a subtle, high-tech shimmer */}
            <stop offset="0%" stopColor="#777" stopOpacity="0" />
            <stop offset="45%" stopColor="#999" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#BBB" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#999" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#777" stopOpacity="0" />
            {/* Synchronized animation values */}
            <animate attributeName="x1" from="-0.5" to="1.5" dur="4s" repeatCount="indefinite" />
            <animate attributeName="x2" from="0.5" to="2.5" dur="4s" repeatCount="indefinite" />
        </linearGradient>
    </defs>

    {/* Left side pattern: Puhoro/Circuit fusion */}
    <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
        <path d="M0,20 Q10,10 20,20 T40,20" />
        <path d="M5,15 Q15,5 25,15 T45,15" />
        <path d="M5,25 Q15,35 25,25 T45,25" />
        <rect x="10" y="18" width="5" height="4" rx="1" />
        <rect x="25" y="13" width="5" height="4" rx="1" />
    </g>
    
    {/* Right side pattern: Stylized Piston */}
    <g fill="currentColor" opacity="0.6">
        <path d="M160 8 h30 v24 h-30 Z M165 11 h20 v3 h-20 Z M165 26 h20 v3 h-20 Z" />
        <circle cx="175" cy="20" r="4" fill="#0A0A0F" stroke="currentColor" strokeWidth="0.5"/>
    </g>
    
    <text x="100" y="20" fontFamily="Orbitron, sans-serif" fontSize="14" fill="currentColor" textAnchor="middle" letterSpacing="1">
      KARAPIRO CARTEL
    </text>
     <text x="100" y="32" fontFamily="Inter, sans-serif" fontSize="8" fill="currentColor" textAnchor="middle" letterSpacing="0.5" opacity="0.8">
      SPEED SHOP
    </text>

     {/* Shimmer Overlay */}
    <rect x="0" y="0" width="200" height="40" fill="url(#shimmer)" />
  </svg>
);


const Sidebar: React.FC = () => {
  return (
    <div className="w-20 md:w-64 carbon-background border-r border-black/50 flex flex-col shadow-inner z-10">
      <div className="flex items-center justify-center h-20 border-b border-black/50 px-4">
        <LogoCartelWorx className="w-full h-auto text-gray-200" />
      </div>
      <nav className="flex-1 px-2 md:px-4 py-4 space-y-2">
        {navigation.map((item) => (
          // FIX: Updated NavLink to use v7 syntax with function props for className and children.
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'} // `end` prop replaces `exact` for matching the end of the URL
            className={({ isActive }) =>
              `group relative flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
                isActive
                  ? 'bg-base-800/50 text-white'
                  : 'text-gray-400 hover:bg-base-800/30 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-accent-primary)] rounded-r-full shadow-glow-theme"></div>
                )}
                <item.icon className="h-6 w-6 mr-0 md:mr-3" aria-hidden="true" />
                <span className="hidden md:block">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-black/50">
        <div className="hidden md:block">
           <LogoBanner className="w-full h-auto text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);