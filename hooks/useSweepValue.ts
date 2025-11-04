import { useState, useEffect, useRef } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';

// A simple easing function
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const useSweepValue = (realValue: number, min: number, max: number) => {
  const isGaugeSweeping = useVehicleStore(state => state.isGaugeSweeping);
  // FIX: The previous lazy initialization of useState was causing a runtime error.
  // Initializing with `realValue` directly fixes the error and also prevents a flicker on initial render.
  // FIX: Make initialization robust by providing a fallback value in case `realValue` is undefined on first render.
  const [displayValue, setDisplayValue] = useState(realValue ?? min);
  const animationRef = useRef<number | undefined>();

  useEffect(() => {
    // When not sweeping, just snap to the real value
    if (!isGaugeSweeping) {
      setDisplayValue(realValue);
    }
  }, [realValue, isGaugeSweeping]);

  useEffect(() => {
    if (isGaugeSweeping) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      let startTime: number | undefined;
      const sweepUpDuration = 800;
      const sweepDownDuration = 600;

      const animateUp = (timestamp: number) => {
        if (startTime === undefined) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / sweepUpDuration, 1);
        const easedProgress = easeOutCubic(progress);

        setDisplayValue(min + (max - min) * easedProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateUp);
        } else {
          // Start sweep down
          startTime = undefined; // Reset for next animation phase
          animationRef.current = requestAnimationFrame(animateDown);
        }
      };
      
      const animateDown = (timestamp: number) => {
        if (startTime === undefined) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / sweepDownDuration, 1);
        const easedProgress = easeOutCubic(progress);
        
        setDisplayValue(max - (max - realValue) * easedProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateDown);
        } else {
          setDisplayValue(realValue); // Snap to final value
        }
      };
      
      // Start the sweep up animation
      animationRef.current = requestAnimationFrame(animateUp);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [isGaugeSweeping, min, max, realValue]);

  return displayValue;
};
