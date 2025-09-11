
import React from 'react';

type TreeState = 'off' | 'staged' | 'c1' | 'c2' | 'c3' | 'go' | 'foul';

interface LightProps {
  color: 'yellow' | 'green' | 'red';
  active: boolean;
  size?: 'small' | 'large';
  glow?: boolean;
}

const Light: React.FC<LightProps> = ({ color, active, size = 'large', glow = false }) => {
  const sizeClass = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';
  const colorClasses = {
    yellow: active ? 'bg-yellow-400' : 'bg-yellow-900/50',
    green: active ? 'bg-green-400' : 'bg-green-900/50',
    red: active ? 'bg-red-500' : 'bg-red-900/50',
  };
  const glowClass = {
      yellow: 'shadow-[0_0_20px_5px_rgba(250,204,21,0.7)]',
      green: 'shadow-[0_0_20px_5px_rgba(74,222,128,0.7)]',
      red: 'shadow-[0_0_20px_5px_rgba(239,68,68,0.7)]',
  }

  return (
    <div
      className={`rounded-full transition-all duration-100 ${sizeClass} ${colorClasses[color]} ${active && glow && glowClass[color]}`}
    />
  );
};

interface ChristmasTreeProps {
  treeState: TreeState;
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ treeState }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center space-y-2 border-2 border-gray-900">
      {/* Staging Lights */}
      <div className="flex flex-col items-center space-y-1">
        <Light color="yellow" active={treeState !== 'off'} size="small" />
        <Light color="yellow" active={treeState !== 'off'} size="small" />
      </div>

      {/* Countdown Lights */}
      <Light color="yellow" active={treeState === 'c1' || treeState === 'c2' || treeState === 'c3'} glow />
      <Light color="yellow" active={treeState === 'c2' || treeState === 'c3'} glow />
      <Light color="yellow" active={treeState === 'c3'} glow />

      {/* Go Light */}
      <Light color="green" active={treeState === 'go'} glow />

      {/* Foul Light */}
      <Light color="red" active={treeState === 'foul'} glow />
    </div>
  );
};

export default ChristmasTree;
