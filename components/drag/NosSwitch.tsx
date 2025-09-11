
import React from 'react';

interface NosSwitchProps {
    isArmed: boolean;
    isActive: boolean;
    onArm: () => void;
    onToggle: () => void;
    nosLevel: number; // 0-100
}

const NosSwitch: React.FC<NosSwitchProps> = ({ isArmed, isActive, onArm, onToggle, nosLevel }) => {
    
    return (
        <div className="flex items-center gap-4">
            {/* NOS Level Gauge */}
            <div className="w-8 h-40 bg-base-900 border-2 border-gray-600 rounded-md p-1 flex flex-col-reverse">
                <div 
                    className="bg-brand-blue w-full rounded-sm transition-all duration-200"
                    style={{ height: `${nosLevel}%`, boxShadow: '0 0 8px #007FFF' }}
                />
            </div>

            {/* Switch Assembly */}
            <div className="flex flex-col items-center gap-2" style={{ perspective: '400px' }}>
                <div 
                    onClick={onArm}
                    className="w-20 h-14 bg-red-700 rounded-t-md border-x-2 border-t-2 border-red-900/50 cursor-pointer relative transition-transform duration-300"
                    style={{ transform: `rotateX(${isArmed ? '-90deg' : '0deg'})`, transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-red-600 to-red-800 rounded-t-md flex items-center justify-center">
                        <span className="font-bold text-white text-lg tracking-widest" style={{ textShadow: '1px 1px 2px #000' }}>NOS</span>
                    </div>
                    {/* Cover front face */}
                    <div 
                        className="absolute w-full h-4 bg-red-800 bottom-0"
                        style={{ transform: 'rotateX(90deg)', transformOrigin: 'top center' }}
                    />
                </div>
                
                <div className="w-24 h-28 bg-gray-700 rounded-md border-2 border-gray-900 p-2 flex flex-col items-center justify-end relative shadow-inner">
                    <div 
                        onClick={isArmed ? onToggle : undefined}
                        className={`w-8 h-16 rounded-md border-2 transition-all duration-200 relative ${isArmed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        style={{
                            background: 'linear-gradient(to right, #e0e0e0, #a0a0a0)',
                            borderColor: '#555 #aaa #aaa #555',
                            transform: `translateY(${isActive ? '-10px' : '10px'})`
                        }}
                    >
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${isActive ? 'bg-brand-cyan shadow-[0_0_8px_#00FFFF]' : 'bg-gray-500'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NosSwitch;
