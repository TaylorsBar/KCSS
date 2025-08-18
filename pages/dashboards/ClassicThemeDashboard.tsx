import React from 'react';
import { useVehicleData } from '../../hooks/useVehicleData';
import { SensorDataPoint } from '../../types';
import ClassicTachometer from '../../components/tachometers/ClassicTachometer';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

const AnalogGauge: React.FC<{
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  size?: number;
}> = ({ label, value, unit, min, max, size = 120 }) => {
  const animatedValue = useAnimatedValue(value);
  const ANGLE_MIN = -135;
  const ANGLE_MAX = 135;
  const range = max - min;
  const valueRatio = (Math.max(min, Math.min(animatedValue, max)) - min) / range;
  const angle = ANGLE_MIN + valueRatio * (ANGLE_MAX - ANGLE_MIN);

  return (
    <div className="flex flex-col items-center p-2 rounded-full shadow-lg" style={{ background: 'var(--theme-panel-bg)'}}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="58" style={{ fill: 'var(--theme-gauge-bezel)' }} />
        <circle cx="60" cy="60" r="52" fill="var(--theme-gauge-face)" stroke="#888" strokeWidth="1" />
        
        {/* Ticks */}
        {Array.from({length: 9}).map((_, i) => {
            const tickAngle = ANGLE_MIN + i * ((ANGLE_MAX - ANGLE_MIN) / 8);
            return (
                 <line
                    key={i}
                    transform={`rotate(${tickAngle} 60 60)`}
                    x1="60" y1="12" x2="60" y2="18"
                    stroke="var(--theme-gauge-text)" strokeWidth="1.5"
                />
            )
        })}

        <g transform={`rotate(${angle} 60 60)`} style={{ transition: 'transform 0.1s ease-out' }}>
          <path d="M 60 60 L 60 15" stroke="var(--theme-needle-color)" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="60" r="4" fill="#333" stroke="var(--theme-gauge-bezel)" strokeWidth="1" />
        
        <text x="60" y="80" textAnchor="middle" fill="var(--theme-gauge-text)" fontSize="14" fontWeight="bold" className="font-mono">{animatedValue.toFixed(0)}</text>
      </svg>
      <div className="mt-2 text-center">
        <div className="text-sm font-bold text-black">{label}</div>
        <div className="text-xs text-gray-600">{unit}</div>
      </div>
    </div>
  );
};

const BarMeter: React.FC<{label: string, value: number, max: number}> = ({label, value, max}) => {
    const animatedValue = useAnimatedValue(value);
    const percentage = (animatedValue / max) * 100;
    return (
        <div className="bg-[#1a1a1a] p-3 border-t-2 border-b-2 border-gray-600 shadow-inner w-full">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-gray-300 font-bold">{label}</span>
                <span className="font-mono text-lg font-bold text-white">{animatedValue.toFixed(1)}</span>
            </div>
            <div className="w-full h-4 bg-black border border-gray-700 flex items-center p-0.5">
                <div className="h-full bg-red-600 transition-all duration-100" style={{width: `${percentage}%`}}></div>
            </div>
        </div>
    );
};

const StatusLight: React.FC<{label: string, active: boolean}> = ({label, active}) => (
     <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full border-2 border-gray-800 ${active ? 'bg-green-500 shadow-[0_0_5px_#38A169]' : 'bg-green-900'}`}></div>
        <span className="text-sm font-bold text-gray-300">{label}</span>
    </div>
)

const ClassicThemeDashboard: React.FC = () => {
  const { latestData } = useVehicleData();
  const d: SensorDataPoint = latestData;

  return (
    <div className="grid grid-cols-3 gap-6 h-full w-full p-6 theme-background">
      {/* Left Column */}
      <div className="flex flex-col items-center justify-around">
        <AnalogGauge label="Water Temp" value={d.engineTemp} unit="°C" min={40} max={120} size={150} />
        <AnalogGauge label="Oil Pressure" value={d.oilPressure} unit="Bar" min={0} max={8} size={150} />
      </div>

      {/* Center Column */}
      <div className="flex flex-col items-center justify-center gap-6">
        <ClassicTachometer rpm={d.rpm} />
        <div className="flex gap-8">
            <StatusLight label="Closed Loop" active={true} />
            <StatusLight label="O2 Learn" active={true} />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col items-center justify-around gap-4">
        <AnalogGauge label="Fuel Level" value={100 - (d.fuelUsed / 50 * 100)} unit="%" min={0} max={100} size={150} />
        <AnalogGauge label="Voltage" value={d.batteryVoltage} unit="V" min={10} max={16} size={150} />
      </div>
    </div>
  );
};

export default ClassicThemeDashboard;