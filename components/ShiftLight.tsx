import React from 'react';

interface ShiftLightProps {
  rpm: number;
}

const SHIFT_LIGHT_ON_RPM = 6500;
const SHIFT_LIGHT_FLASH_RPM = 7500;

const ShiftLight: React.FC<ShiftLightProps> = ({ rpm }) => {
  const isOn = rpm >= SHIFT_LIGHT_ON_RPM;
  const isFlashing = rpm >= SHIFT_LIGHT_FLASH_RPM;

  const flashClass = isFlashing && Math.floor(Date.now() / 150) % 2 === 0 ? 'animate-pulse' : '';

  const lensStyle: React.CSSProperties = {
    backgroundColor: isOn ? '#ff0000' : '#4d0000',
    boxShadow: isOn
      ? 'inset 0 0 5px rgba(0,0,0,0.5), 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #d40000'
      : 'inset 0 0 5px rgba(0,0,0,0.7)',
    transition: 'background-color 0.1s ease-in-out, box-shadow 0.1s ease-in-out',
  };

  return (
    <div className="absolute top-[45%] right-[-10%] w-24 h-24 transform -translate-y-1/2">
      <div className="relative w-full h-full">
        {/* Mounting Bracket */}
        <div 
          className="absolute top-1/2 left-[-20px] w-8 h-12 bg-gray-600 rounded-l-md transform -translate-y-1/2 border-r-2 border-gray-800 z-0"
          style={{ background: 'linear-gradient(to right, #6b7280, #4b5563)' }}
        ></div>

        {/* Light Body */}
        <div 
          className="absolute top-1/2 left-0 w-full h-20 bg-gray-400 rounded-md transform -translate-y-1/2 border-2 border-gray-500 shadow-lg z-10"
          style={{ background: 'linear-gradient(160deg, #d1d5db, #9ca3af 60%, #6b7280)' }}
        >
            {/* Lens */}
            <div 
              className={`absolute top-1/2 right-[-2px] w-[70px] h-[70px] bg-red-900 rounded-full transform -translate-y-1/2 flex items-center justify-center ${flashClass}`}
              style={lensStyle}
            >
                {/* Lens Glare */}
                <div 
                    className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full"
                    style={{ filter: 'blur(3px)' }}
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftLight;
