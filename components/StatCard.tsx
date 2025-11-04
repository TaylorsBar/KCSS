import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  className?: string;
  children?: React.ReactNode;
}

const DataCard: React.FC<StatCardProps> = ({ title, value, unit, className = '' }) => {
  return (
    <div className={`p-4 rounded-xl shadow-neumorphic-light bg-gradient-to-br from-base-800 to-base-900 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div>
        <span className="text-3xl lg:text-4xl font-bold text-white font-display">{value}</span>
        {unit && <span className="ml-1 text-base text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};

export default DataCard;
