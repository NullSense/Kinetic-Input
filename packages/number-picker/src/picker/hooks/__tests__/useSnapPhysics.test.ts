import { describe, it, expect } from 'vitest';
import { useSnapPhysics } from '../../hooks/useSnapPhysics';
import { renderHook } from '@testing-library/react';

const cfg = {
  enabled: true,
  snapRange: 1,
  enterThreshold: 0.4,
  exitThreshold: 0.6,
  pullStrength: 0.6,
  velocityScaling: true,
  velocityReducer: 0.5,
  velocityThreshold: 500,
  centerLock: 0.5,
};

describe('useSnapPhysics', () => {
  it('returns raw delta when disabled', () => {
    const { result, rerender } = renderHook(({ enabled }) => useSnapPhysics({ ...cfg, enabled }), {
      initialProps: { enabled: false },
    });
    const { calculate } = result.current;
    const frame = { deltaY: 100, velocityY: 0, totalPixelsMoved: 0 };
    const r1 = calculate(frame, 0, 40);
    expect(r1.mappedTranslate).toBe(100);
    expect(r1.inSnapZone).toBe(false);

    rerender({ enabled: true });
  });

  it('applies hysteresis enter/exit thresholds', () => {
    const { result } = renderHook(() => useSnapPhysics(cfg));
    const { calculate, reset } = result.current;

    // Enter
    let r = calculate({ deltaY: 14, velocityY: 0, totalPixelsMoved: 0 }, 0, 40); // 14 < enter(16)
    expect(r.inSnapZone).toBe(true);

    // Within exit threshold => still in zone due to hysteresis
    r = calculate({ deltaY: 23, velocityY: 0, totalPixelsMoved: 0 }, 0, 40); // 23 < exit(24)
    expect(r.inSnapZone).toBe(true);

    // Farther out -> exit
    r = calculate({ deltaY: 26, velocityY: 0, totalPixelsMoved: 0 }, 0, 40); // 26 > exit(24)
    expect(r.inSnapZone).toBe(false);

    reset();
  });

  it('scales pull strength with velocity and caps via threshold', () => {
    const { result } = renderHook(() => useSnapPhysics(cfg));
    const { calculate } = result.current;

    const slow = calculate({ deltaY: 10, velocityY: 50, totalPixelsMoved: 0 }, 0, 40);
    const fast = calculate({ deltaY: 10, velocityY: 2000, totalPixelsMoved: 0 }, 0, 40);

    // With higher velocity, pull is reduced -> stays further from snap target
    expect(Math.abs(fast.mappedTranslate - 0)).toBeGreaterThan(Math.abs(slow.mappedTranslate - 0));
  });

  it('locks to center when centerLock ~ 1 and clamps within bounds', () => {
    const { result } = renderHook(() => useSnapPhysics({ ...cfg, centerLock: 1 }));
    const { calculate } = result.current;

    // Must be in snap zone for center lock to apply (within enter threshold)
    const r = calculate({ deltaY: 10, velocityY: 0, totalPixelsMoved: 0 }, 0, 40);
    expect(r.mappedTranslate).toBe(0);
    expect(r.inSnapZone).toBe(true);
  });
});
