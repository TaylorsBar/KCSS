
import { useState, useEffect, useRef } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';

// A simple easing function
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// FIX: Changed realValue to be optional to align with the FIX comment and prevent potential runtime errors on initial render.
export const useSweepValue = (realValue: number | undefined, min: number, max: number) => {
  const isGaugeSweeping = useVehicleStore(state => state.isGaugeSweeping);
  // FIX: Using lazy initialization for useState to resolve a cryptic error where it seemed to be called with no arguments.
  // This ensures the initial value is computed safely during React's initialization phase.
  const [displayValue, setDisplayValue] = useState(() => min ?? 0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // When not sweeping, just snap to the real value
    if (!isGaugeSweeping) {
      // FIX: Use nullish coalescing to handle potentially undefined realValue.
      setDisplayValue(realValue ?? min ?? 0);
    }
  }, [realValue, isGaugeSweeping, min]);

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

        // FIX: Guard against undefined min/max during calculations.
        setDisplayValue((min ?? 0) + ((max ?? 0) - (min ?? 0)) * easedProgress);

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
        
        // FIX: Use nullish coalescing to handle potentially undefined realValue during animation.
        const finalValue = realValue ?? min ?? 0;
        // FIX: Guard against undefined values.
        setDisplayValue((max ?? 0) - ((max ?? 0) - finalValue) * easedProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateDown);
        } else {
          // FIX: Snap to the final value, handling undefined.
          setDisplayValue(finalValue); // Snap to final value
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