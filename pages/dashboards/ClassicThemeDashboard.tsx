import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { SensorDataPoint } from '../../types/index';
import ClassicTachometer from '../../components/tachometers/ClassicTachometer';

const ClassicAuxGauge: React.FC<{ label: string; value: number; unit: string; min: number; max: number }> = ({ label, value, unit, min, max }) => {
  const valueRatio = (Math.max(min, Math.min(value, max)) - min) / (max - min);
  const angle = -120 + valueRatio * 240;

  return (
    <div className="w-full aspect-square relative">
      <svg viewBox="0 0 100 100">
        <defs>
          <radialGradient id="classic-aux-face">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <filter id="classic-needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.7"/>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#444" />
        <circle cx="50" cy="50" r="47" fill="#111" />
        <circle cx="50" cy="50" r="44" fill="url(#classic-aux-face)" />
        {/* Ticks */}
        {[-120, -60, 0, 60, 120].map(a => (
          <line key={a} x1="50" y1="10" x2="50" y2="16" stroke="var(--theme-text-secondary)" strokeWidth="1.5" transform={`rotate(${a} 50 50)`} />
        ))}
        <text x="50" y="70" textAnchor="middle" fill="var(--theme-text-secondary)" fontSize="8" className="font-sans uppercase font-bold">{label}</text>
        <text x="50" y="82" textAnchor="middle" fill="var(--theme-text-primary)" fontSize="14" className="font-display">{value.toFixed(0)}</text>
        
        {/* Needle */}
        <g transform={`rotate(${angle} 50 50)`} style={{ transition: 'transform 0.1s ease-out' }} filter="url(#classic-needle-shadow)">
            <path d="M 49.5 50 L 50 10 L 50.5 50 Z" fill="var(--theme-needle-color)" />
            <path d="M 49 50 L 50 58 L 51 50 Z" fill="var(--theme-needle-color)" />
        </g>
        <circle cx="50" cy="50" r="5" fill="#222" stroke="#444" strokeWidth="1"/>
        <circle cx="50" cy="50" r="2" fill="#111"/>
      </svg>
    </div>
  );
};


const ClassicThemeDashboard: React.FC = () => {
  const { latestData } = useVehicleData();
  const d: SensorDataPoint = latestData;

  return (
    <div className="flex h-full w-full items-center justify-center p-4 md:p-8 theme-background">
      <div 
        className="w-full max-w-screen-xl aspect-[16/9] p-4 flex items-center justify-center gap-12 glassmorphism-panel rounded-lg"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div className="w-1/4 flex flex-col justify-between h-full py-4 gap-4">
            <ClassicAuxGauge label="Fuel Lvl" value={d.fuelUsed} unit="%" min={0} max={100} />
            <ClassicAuxGauge label="Oil Press" value={d.oilPressure * 14.5} unit="psi" min={0} max={100} />
        </div>
        <div className="w-1/2 h-full">
            <ClassicTachometer rpm={d.rpm} speed={d.speed} />
        </div>
        <div className="w-1/4 flex flex-col justify-between h-full py-4 gap-4">
            <ClassicAuxGauge label="Water Temp" value={d.engineTemp} unit="°C" min={40} max={120} />
            <ClassicAuxGauge label="Voltage" value={d.batteryVoltage} unit="V" min={10} max={16} />
        </div>
      </div>
    </div>
  );
};

export default ClassicThemeDashboard;