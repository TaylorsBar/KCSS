
import { renderHook, act } from '@testing-library/react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useAnimatedValue', () => {
  beforeEach(() => {
    // Use fake timers to control requestAnimationFrame
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  it('should initialize with the target value', () => {
    const { result } = renderHook(() => useAnimatedValue(100));
    expect(result.current).toBe(100);
  });

  it('should animate towards the target value over time', () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value, { duration: 100 }), {
      initialProps: { value: 0 },
    });

    expect(result.current).toBe(0);

    // Rerender with a new target value to start the animation
    rerender({ value: 100 });

    // Advance time by 50ms (halfway through the animation)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    
    // The value should be partway to the target
    // The ease-out cubic function is 1 - (1 - t)^3. At t=0.5, progress is 1 - (0.5)^3 = 0.875
    // So the value should be 0 + (100 - 0) * 0.875 = 87.5
    expect(result.current).toBeCloseTo(87.5);

    // Advance time to the end of the animation
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // The value should now be at the target
    expect(result.current).toBe(100);
  });

  it('should snap to the target value if the change is insignificant', () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedValue(value), {
      initialProps: { value: 100 },
    });

    rerender({ value: 100.001 });

    // Since the change is less than 0.01, it should snap directly without animating
    expect(result.current).toBe(100.001);
  });
});
