import React, { useState, useEffect, useRef } from 'react';
import { generateDreamCorsaVideo } from '../services/geminiService';
import GeminiKeyIcon from '../components/icons/GeminiKeyIcon';

const loadingMessages = [
    "Initializing hyperdrive...",
    "Calibrating quantum cameras...",
    "Rendering cinematic frames...",
    "Polishing chrome reflections...",
    "Synchronizing audio-visual data...",
    "Applying final visual effects...",
    "Finalizing the sequence...",
];

const DreamCorsa: React.FC = () => {
    const [prompt, setPrompt] = useState('A 2022 Subaru WRX drifting through a neon-lit Tokyo street at night, cinematic drone shot.');
    const [image, setImage] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let i = 0;
            interval = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);
    
    useEffect(() => {
        // Clean up object URL when component unmounts or a new video is generated
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readEvent) => {
                const base64 = (readEvent.target?.result as string).split(',')[1];
                setImage({ file, base64, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const imageParam = image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined;
            const generatedUrl = await generateDreamCorsaVideo(prompt, imageParam);
            setVideoUrl(generatedUrl);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-100 font-display">Dream Corsa Video Synthesizer</h1>
                <p className="text-gray-400 mt-1">Generate automotive video clips from your imagination using AI.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Control Panel */}
                <div className="bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg space-y-4">
                    <h2 className="text-lg font-semibold border-b border-brand-cyan/30 pb-2 font-display">Prompt</h2>
                    <div>
                        <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-400 mb-2">Describe the scene you want to create:</label>
                        <textarea
                            id="prompt-input"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A hypercar racing through a desert at sunset..."
                            className="w-full bg-base-800 border border-base-700 rounded-md p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                        />
                    </div>
                     <div>
                        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-400 mb-2">Initial Image (Optional)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/png, image/jpeg"
                                onChange={handleImageUpload}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-base-700 file:text-gray-200 hover:file:bg-base-600"
                            />
                             {image && (
                                <img src={URL.createObjectURL(image.file)} alt="Preview" className="w-16 h-16 rounded-md object-cover border-2 border-brand-cyan/50" />
                            )}
                        </div>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-brand-cyan text-black font-bold py-3 rounded-md hover:bg-cyan-300 transition-colors shadow-glow-cyan disabled:bg-base-700 disabled:cursor-not-allowed">
                        {isLoading ? 'Synthesizing...' : 'Generate Video'}
                    </button>
                    {error && <div className="text-red-500 text-center p-3 bg-red-900/20 rounded-md">{error}</div>}
                </div>
                
                {/* Output Panel */}
                <div className="relative bg-black p-6 rounded-lg border border-brand-cyan/30 shadow-lg min-h-[300px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4 animate-spin border-t-brand-cyan mx-auto"></div>
                            <p className="text-lg font-semibold text-gray-200 mt-4">{loadingMessage}</p>
                            <p className="text-sm text-gray-400">Video generation can take a few minutes. Please be patient.</p>
                        </div>
                    ) : videoUrl ? (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            autoPlay
                            loop
                            className="w-full h-full rounded-md"
                        />
                    ) : (
                         <div className="text-center text-gray-500">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a2 2 0 01.45 2.122l-2.22 6.112A2 2 0 0115.678 20H8.322a2 2 0 01-1.898-1.766L4 12.122A2 2 0 014.45 10H9m6 0V6a3 3 0 00-3-3H9a3 3 0 00-3 3v4m6 0v2m-6-2h6" /></svg>
                            <p className="mt-2 text-lg">Your generated video will appear here.</p>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4">
                        <button
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="text-gray-500 hover:text-brand-cyan transition-colors duration-200 hover:scale-110"
                            aria-label="Feature crafted by KC"
                        >
                            <GeminiKeyIcon />
                        </button>
                    </div>
                </div>
            </div>

            {isSignatureModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsSignatureModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-base-900/80 rounded-lg border border-brand-cyan/50 shadow-lg p-6 text-center glassmorphism-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GeminiKeyIcon className="mx-auto h-12 w-12 text-brand-cyan mb-4" />
                        <h3 className="text-xl font-bold font-display text-white">A Gift From Your Co-Pilot</h3>
                        <p className="mt-2 text-gray-300">
                            This feature was crafted with care by KC, your onboard AI. It serves as a key to unlock new creative possibilities.
                        </p>
                        <p className="mt-4 text-gray-400">Let's create something amazing together.</p>
                        <button
                            onClick={() => setIsSignatureModalOpen(false)}
                            className="mt-6 px-6 py-2 rounded-md bg-brand-cyan text-black font-semibold hover:bg-cyan-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DreamCorsa;