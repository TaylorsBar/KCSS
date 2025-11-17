import { useState, useEffect, useRef } from 'react';
import { useVehicleStore } from '../store/useVehicleStore.ts';

const DURATION = 100; // Animation duration should be close to the data update interval

export const useAnimatedValue = (targetValue: number, config: { duration?: number } = {}) => {
  const { duration = DURATION } = config;
  const isGaugeSweeping = useVehicleStore(state => state.isGaugeSweeping);
  const [currentValue, setCurrentValue] = useState(() => targetValue ?? 0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (isGaugeSweeping) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentValue(targetValue);
      return; 
    }

    const startValue = currentValue; 
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const nextValue = startValue + (targetValue - startValue) * easedProgress;
      setCurrentValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (Math.abs(targetValue - startValue) > 0.01) {
        animationFrameRef.current = requestAnimationFrame(animate);
    } else if (currentValue !== targetValue) {
        setCurrentValue(targetValue);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration, isGaugeSweeping]);

  return currentValue;
};
