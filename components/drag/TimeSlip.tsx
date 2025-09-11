
import React from 'react';
import { DragRaceResult } from '../../types';

interface TimeSlipProps {
    results: DragRaceResult | null;
    onReset: () => void;
}

const ResultRow: React.FC<{ label: string; value: number | null; unit: string; precision?: number }> = ({ label, value, unit, precision = 3 }) => (
    <div className="flex justify-between items-baseline border-b border-dashed border-gray-600 py-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">
            {value !== null ? `${value.toFixed(precision)} ${unit}` : '--'}
        </span>
    </div>
);

const TimeSlip: React.FC<TimeSlipProps> = ({ results, onReset }) => {
    if (!results) return null;

    const isFoul = results.reactionTime !== null && results.reactionTime < 0;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-gray-200 text-black font-mono p-6 rounded-lg shadow-2xl relative animate-fade-in">
                <h2 className="text-center font-bold text-2xl border-b-2 border-black pb-2">TIME SLIP</h2>
                <div className="text-center my-2">
                    <p className="text-xs">KARAPIRO CARTEL SPEED SHOP</p>
                    <p className="text-xs">{new Date().toLocaleString()}</p>
                </div>
                
                <div className="space-y-2 text-lg my-4">
                    {isFoul ? (
                        <div className="text-center font-bold text-5xl text-red-600 py-8">
                            RED LIGHT
                        </div>
                    ) : (
                        <>
                            <ResultRow label="R/T" value={results.reactionTime} unit="" />
                            <ResultRow label="60'" value={results.timeTo60ft} unit="" />
                            <ResultRow label="330'" value={results.timeTo330ft} unit="" />
                            <ResultRow label="1/8 Mile" value={results.timeTo1_8mile} unit="s" />
                            <ResultRow label="1/8 MPH" value={results.speedAt1_8mile} unit="km/h" precision={1} />
                            <ResultRow label="1000'" value={results.timeTo1000ft} unit="s" />
                            <ResultRow label="1/4 Mile" value={results.timeTo1_4mile} unit="s" />
                            <ResultRow label="1/4 MPH" value={results.speedAt1_4mile} unit="km/h" precision={1} />
                        </>
                    )}
                </div>

                <div className="text-center border-t-2 border-black pt-4">
                    <button 
                        onClick={onReset}
                        className="bg-blue-600 text-white font-bold py-2 px-8 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        NEW RUN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSlip;
