import React from 'react';

const HaltechLogo: React.FC = () => (
    <div className="font-display font-black text-center text-4xl text-[#282828]">
        <span style={{ color: '#ffc000', textShadow: '0 0 10px #ffc000, 0 1px 1px #000' }}>
            Haltech
        </span>
        <div className="text-sm font-bold tracking-widest leading-none" style={{ color: '#ccc', textShadow: '0 1px 1px #000' }}>
            iC-7
        </div>
    </div>
);

// FIX: Explicitly type the props for GaugePod to accept children.
const GaugePod: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full aspect-square rounded-full bg-[#111] p-3 shadow-inner" style={{
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.5)',
    }}>
        <div className="w-full h-full rounded-full bg-[#333] p-1" style={{
             background: 'linear-gradient(145deg, #444, #222)',
             boxShadow: 'inset 0 2px 2px rgba(0,0,0,0.5)',
        }}>
            <div className="w-full h-full rounded-full bg-black p-4 flex flex-col justify-end">
                {children}
            </div>
        </div>
    </div>
);

const InsetPanel: React.FC = () => (
    <div className="w-1/2 h-1/3 bg-[#1a1a1a] border border-[#252525] rounded-md shadow-inner self-end" style={{
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)'
    }}/>
);

const FooterPanel: React.FC = () => (
     <div className="bg-black rounded-md h-full" style={{
        boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8)'
     }} />
);

const HaltechDashboard: React.FC = () => {
    return (
        <div className="flex h-full w-full items-center justify-center p-4 theme-background haltech-ic7-background">
            <div className="w-full max-w-6xl aspect-[2/1] flex flex-col gap-4">
                <header className="flex-shrink-0 flex justify-center items-center py-2">
                    <HaltechLogo />
                </header>
                <main className="flex-grow grid grid-cols-2 gap-8 px-4">
                    <GaugePod>
                        <InsetPanel />
                    </GaugePod>
                    <GaugePod>
                        <InsetPanel />
                    </GaugePod>
                </main>
                <footer className="flex-shrink-0 h-16 grid grid-cols-4 gap-4 px-4">
                    <FooterPanel />
                    <FooterPanel />
                    <FooterPanel />
                    <FooterPanel />
                </footer>
            </div>
        </div>
    );
};

export default HaltechDashboard;