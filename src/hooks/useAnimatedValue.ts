import { useState, useEffect, useRef } from 'react';
import { useVehicleStore } from '../store/useVehicleStore';

const DURATION = 100; // Animation duration should be close to the data update interval

export const useAnimatedValue = (targetValue: number, config: { duration?: number } = {}) => {
  const { duration = DURATION } = config;
  const isGaugeSweeping = useVehicleStore(state => state.isGaugeSweeping);
  // FIX: Use lazy initialization for useState to resolve a cryptic error where it seemed to be called with no arguments.
  // This ensures the initial value is computed safely during React's initialization phase.
  const [currentValue, setCurrentValue] = useState(() => targetValue);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // If a gauge sweep is active, this hook should not perform its own animation.
    // Instead, it should immediately snap to the target value, which is being
    // animated by the `useSweepValue` hook. This prevents the two animations
    // from fighting each other and causing erratic, jerky movement.
    if (isGaugeSweeping) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentValue(targetValue);
      return; // Bypass the smoothing animation
    }

    const startValue = currentValue; // Capture value when the effect (and animation) starts
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for a nice deceleration effect
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const nextValue = startValue + (targetValue - startValue) * easedProgress;
      setCurrentValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to the final value at the end to ensure accuracy
        setCurrentValue(targetValue);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Only start a new animation if the value has changed significantly
    if (Math.abs(targetValue - startValue) > 0.01) {
        animationFrameRef.current = requestAnimationFrame(animate);
    } else if (currentValue !== targetValue) {
        // Snap to the target value if it's close enough
        setCurrentValue(targetValue);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration, isGaugeSweeping]); // This effect re-runs when targetValue changes

  return currentValue;
};
