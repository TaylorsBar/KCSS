import React, { useState, useEffect, useRef } from 'react';
import { SensorDataPoint, GpsPoint } from '../types';
import { useUnitConversion } from '../hooks/useUnitConversion';

interface TrackCameraProps {
    latestData: SensorDataPoint;
    gpsPath: GpsPoint[];
}

const drawTelemetryOverlay = (ctx: CanvasRenderingContext2D, data: SensorDataPoint, path: GpsPoint[], convertSpeed: (s: number) => number, getSpeedUnit: () => string) => {
    const { width, height } = ctx.canvas;
    
    // --- Main data display (bottom left) ---
    ctx.font = 'bold 48px "Orbitron", sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, height - 130, 300, 120);
    
    ctx.fillStyle = '#00FFFF';
    ctx.textBaseline = 'middle';
    
    const speed = convertSpeed(data.speed).toFixed(0);
    ctx.fillText(`${speed}`, 25, height - 75);
    
    ctx.font = 'bold 24px "Orbitron", sans-serif';
    ctx.fillText(getSpeedUnit(), 25 + ctx.measureText(speed).width + 5, height - 75);

    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`${data.rpm.toFixed(0)} RPM`, 25, height - 35);
    ctx.fillText(`GEAR: ${data.gear > 0 ? data.gear : 'N'}`, 200, height - 35);

    // --- G-Force Meter (bottom right) ---
    const gForceX = width - 80;
    const gForceY = height - 80;
    const gForceRadius = 60;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(gForceX, gForceY, gForceRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    const gDotX = gForceX; // Assuming G-force is primarily longitudinal for now
    const gDotY = gForceY - data.gForce * (gForceRadius * 0.8);
    ctx.fillStyle = '#FF00FF';
    ctx.beginPath();
    ctx.arc(gDotX, gDotY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // --- GPS Mini-Map (top right) ---
    if (path.length > 1) {
        const mapSize = 200;
        const mapPadding = 10;
        const mapX = width - mapSize - mapPadding;
        const mapY = mapPadding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = '#00FFFF';
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        const lats = path.map(p => p.latitude);
        const lons = path.map(p => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        const latRange = maxLat - minLat || 1;
        const lonRange = maxLon - minLon || 1;
        const range = Math.max(latRange, lonRange);

        ctx.beginPath();
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        path.forEach((point, index) => {
            const px = mapX + mapPadding + ((point.longitude - minLon) / range) * (mapSize - mapPadding*2);
            const py = mapY + (mapSize-mapPadding) - ((point.latitude - minLat) / range) * (mapSize - mapPadding*2);
            if (index === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });
        ctx.stroke();
    }
};

const TrackCamera: React.FC<TrackCameraProps> = ({ latestData, gpsPath }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const { convertSpeed, getSpeedUnit } = useUnitConversion();

    const [isRecording, setIsRecording] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                
                const drawFrame = () => {
                    if (!canvasRef.current || !videoRef.current) return;
                    const ctx = canvasRef.current.getContext('2d');
                    if (!ctx) return;
                    
                    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    drawTelemetryOverlay(ctx, latestData, gpsPath, convertSpeed, getSpeedUnit);
                    
                    animationFrameRef.current = requestAnimationFrame(drawFrame);
                };
                drawFrame();

            } catch (err) {
                console.error("Camera access denied:", err);
                setError("Camera access is required. Please enable it in your browser settings.");
            }
        };

        setupCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [latestData, gpsPath, convertSpeed, getSpeedUnit]);

    const handleStartRecording = () => {
        if (!canvasRef.current) return;
        setVideoUrl(null);
        recordedChunksRef.current = [];

        const stream = canvasRef.current.captureStream(30); // 30 FPS
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return (
        <div className="w-full h-full bg-black p-4 rounded-lg border border-brand-cyan/30 shadow-lg flex flex-col gap-4">
            {error && <div className="text-red-500 text-center">{error}</div>}
            <div className="relative w-full aspect-video">
                <video ref={videoRef} className="absolute inset-0 w-full h-full hidden" playsInline autoPlay muted />
                <canvas ref={canvasRef} width="1280" height="720" className="w-full h-full rounded-md" />
            </div>
            <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                    <button onClick={handleStartRecording} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-red-500 transition-colors">Start Recording</button>
                ) : (
                    <button onClick={handleStopRecording} className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors">Stop Recording</button>
                )}
                {videoUrl && (
                    <a href={videoUrl} download={`CartelWorx-TrackDay-${new Date().toISOString()}.webm`} className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors">
                        Download Video
                    </a>
                )}
            </div>
        </div>
    );
};

export default TrackCamera;