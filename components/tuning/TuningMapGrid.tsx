import React, { useState, useMemo } from 'react';
import { TuningMap } from '../../types';

interface TuningMapGridProps {
    map: TuningMap;
    liveRpm: number;
    liveLoad: number;
    onDataChange: (newData: number[][]) => void;
}

const findCell = (value: number, axisValues: number[]): number => {
    return axisValues.findIndex((v, i) => value >= v && (i === axisValues.length - 1 || value < axisValues[i + 1]));
};

const getColorForValue = (value: number, min: number, max: number) => {
    if (min === max) return 'bg-cyan-700';
    const ratio = (value - min) / (max - min);
    // Simple gradient: Blue -> Cyan -> Green -> Yellow -> Red
    const h = (1 - ratio) * 240; // Hue from 0 (red) to 240 (blue)
    return `hsl(${h}, 80%, 50%)`;
};

const TuningMapGrid: React.FC<TuningMapGridProps> = ({ map, liveRpm, liveLoad, onDataChange }) => {
    const [selectedCell, setSelectedCell] = useState<{ x: number, y: number } | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    
    const liveX = findCell(liveRpm, map.xAxis.values);
    const liveY = findCell(liveLoad, map.yAxis.values);
    
    const [minVal, maxVal] = useMemo(() => {
        const allValues = map.data.flat();
        return [Math.min(...allValues), Math.max(...allValues)];
    }, [map.data]);

    const handleCellClick = (x: number, y: number) => {
        setSelectedCell({ x, y });
        setEditingValue(map.data[y][x].toString());
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingValue(e.target.value);
    };

    const handleBlur = () => {
        if (selectedCell) {
            const { x, y } = selectedCell;
            const newValue = parseFloat(editingValue);
            if (!isNaN(newValue)) {
                const newData = map.data.map((row, rowIndex) =>
                    rowIndex === y ? row.map((cell, colIndex) => (colIndex === x ? newValue : cell)) : row
                );
                onDataChange(newData);
            }
        }
        setSelectedCell(null);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-100 font-display mb-2">{map.name} ({map.unit})</h3>
            <div className="flex-grow overflow-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="sticky top-0 bg-base-800 z-10">
                            <th className="p-2 border border-base-700 text-xs text-gray-400 font-normal">{map.yAxis.label} / {map.xAxis.label}</th>
                            {map.xAxis.values.map((rpm, i) => (
                                <th key={i} className="p-2 border border-base-700 text-xs text-gray-400 font-normal">{rpm}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {map.yAxis.values.map((load, y) => (
                            <tr key={y}>
                                <td className="p-2 border border-base-700 text-xs text-gray-400 font-normal sticky left-0 bg-base-800">{load}</td>
                                {map.xAxis.values.map((_, x) => {
                                    const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                                    const isLive = liveX === x && liveY === y;
                                    const value = map.data[y][x];
                                    const bgColor = getColorForValue(value, minVal, maxVal);
                                    
                                    return (
                                        <td
                                            key={x}
                                            onClick={() => handleCellClick(x, y)}
                                            className={`p-0 border border-base-700 text-center text-sm font-mono cursor-pointer relative`}
                                            style={{ backgroundColor: bgColor }}
                                        >
                                            {isLive && <div className="absolute inset-0 border-2 border-white animate-pulse" />}
                                            {isSelected ? (
                                                <input
                                                    type="number"
                                                    value={editingValue}
                                                    onChange={handleValueChange}
                                                    onBlur={handleBlur}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="w-full h-full bg-transparent text-white text-center outline-none"
                                                />
                                            ) : (
                                                <div className="py-2">{value.toFixed(1)}</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TuningMapGrid;
