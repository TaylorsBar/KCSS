import React from 'react';

const MediaPlayer: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-left text-[var(--theme-text-secondary)] mb-4">
                Now Playing
            </h3>
            <div className="flex-grow flex flex-col items-center justify-center gap-4">
                <div className="w-32 h-32 bg-base-800 rounded-lg shadow-lg">
                    <img src="https://i.scdn.co/image/ab67616d0000b273bba70e065763568a3a41c305" alt="Album Art" className="w-full h-full object-cover rounded-lg"/>
                </div>
                <div>
                    <p className="text-lg font-semibold text-white text-center">Genesis</p>
                    <p className="text-sm text-gray-400 text-center">Grimes</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-8 mt-4 text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6h2v12h-2zm-4.5 6l-8.5 6V6z"/></svg>
            </div>
        </div>
    );
};

export default MediaPlayer;
