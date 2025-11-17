import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type React from 'react';
import { usePickerPhysics } from '../usePickerPhysics';

const snapSpies = vi.hoisted(() => ({
  calculate: vi.fn(() => ({ mappedTranslate: 0, inSnapZone: false })),
  reset: vi.fn(),
}));

const velocityState = vi.hoisted(() => ({ value: 0 }));

const trackerSpies = vi.hoisted(() => ({
  addSample: vi.fn(),
  reset: vi.fn(),
  getVelocity: vi.fn(() => velocityState.value),
  getSampleCount: vi.fn(() => 0),
}));

const frictionMomentumMock = vi.hoisted(() => ({
  animateMomentumWithFriction: vi.fn(() => ({
    stop: vi.fn(),
    getVelocity: vi.fn(() => 0),
    isFrictionPhase: vi.fn(() => true),
  })),
}));

vi.mock('../useSnapPhysics', () => ({
  useSnapPhysics: () => snapSpies,
}));

vi.mock('../../gestures', async () => {
  const actual = await vi.importActual('../../gestures');
  return {
    ...actual,
    createVelocityTracker: vi.fn(() => trackerSpies),
  };
});

vi.mock('../../utils/frictionMomentum', () => frictionMomentumMock);

type Option = { value: string; render: (state: { selected: boolean; visuallySelected: boolean }) => React.ReactNode; props: Record<string, unknown> };
const makeOptions = (count: number): Option[] =>
  Array.from({ length: count }).map((_, index) => ({
    value: `Option ${index + 1}`,
    render: () => `Option ${index + 1}`,
    props: {},
  }));

describe('usePickerPhysics velocity wiring', () => {
  beforeEach(() => {
    snapSpies.calculate.mockClear();
    snapSpies.reset.mockClear();
    velocityState.value = 0;
    trackerSpies.addSample.mockClear();
    trackerSpies.reset.mockClear();
    trackerSpies.getVelocity.mockClear();
    trackerSpies.getSampleCount.mockClear();
    frictionMomentumMock.animateMomentumWithFriction.mockClear();
  });

  const baseConfig = {
    key: 'test',
    itemHeight: 40,
    height: 200,
    isPickerOpen: true,
    wheelSensitivity: 1,
    wheelDeltaCap: 1.25,
    changeValue: vi.fn(),
    virtualization: { slotCount: 11, overscan: 5 },
  };

  it('passes pointer velocity into snap physics calculations', () => {
    const options = makeOptions(10);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 3 })
    );

    const columnNode = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({ top: 0, bottom: 200, height: 200, width: 100, left: 0, right: 100, x: 0, y: 0, toJSON: () => {} }),
    } as unknown as HTMLDivElement;
    act(() => {
      result.current.columnRef.current = columnNode;
    });

    const pointerEvent = (clientY: number) => ({
      pointerId: 1,
      pointerType: 'touch',
      clientY,
      currentTarget: columnNode,
      target: columnNode,
    }) as React.PointerEvent<HTMLDivElement>;

    velocityState.value = 640;
    act(() => {
      result.current.handlePointerDown(pointerEvent(100));
      result.current.handlePointerMove(pointerEvent(60));
    });

    const lastCall = snapSpies.calculate.mock.calls.at(-1);
    expect(lastCall?.[0].velocityY).toBe(640);
  });

  it('wheel scrolling never uses momentum - always velocity 0', () => {
    vi.useFakeTimers();
    const options = makeOptions(10);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 4 })
    );

    const wheelEvent = {
      deltaY: 6,
      deltaMode: 0,
      preventDefault: vi.fn(),
    } as unknown as WheelEvent;

    // Even if velocity tracker reports high velocity, wheel should ignore it
    velocityState.value = -320;
    act(() => {
      result.current.handleWheel(wheelEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Wheel scrolling should NEVER trigger friction momentum animation
    // (wheel uses direct positioning, no coasting)
    expect(frictionMomentumMock.animateMomentumWithFriction).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('projects release distance using the measured velocity when a pointer settles', () => {
    const options = makeOptions(6);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 2 })
    );

    const columnNode = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 200,
        height: 200,
        width: 100,
        left: 0,
        right: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.columnRef.current = columnNode;
    });

    const pointerEvent = (clientY: number) =>
      ({
        pointerId: 5,
        pointerType: 'touch',
        clientY,
        currentTarget: columnNode,
        target: columnNode,
      }) as React.PointerEvent<HTMLDivElement>;

    velocityState.value = 880;
    act(() => {
      result.current.handlePointerDown(pointerEvent(120));
      result.current.handlePointerMove(pointerEvent(80));
      result.current.handlePointerUp(pointerEvent(80));
    });

    // Friction momentum should be called with scaled velocity (880 * 0.35 = 308)
    const momentumCall = frictionMomentumMock.animateMomentumWithFriction.mock.calls.at(-1);
    expect(momentumCall?.[0].initialVelocity).toBeCloseTo(880 * 0.35, 1);
  });

  // NOTE: rangeScale config test removed - friction momentum uses simpler physics
  // (decelerationRate + snapVelocityThreshold only, no projection configs)

  it('applies gentle snap physics to wheel for satisfying tactile feel', () => {
    const options = makeOptions(7);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 3 })
    );

    const wheelEvent = {
      deltaY: 2,
      deltaMode: 0,
      preventDefault: vi.fn(),
    } as unknown as WheelEvent;

    act(() => {
      result.current.handleWheel(wheelEvent);
    });

    // Snap physics SHOULD be applied during wheel scrolling for magnetic "thunk" feel
    expect(snapSpies.calculate).toHaveBeenCalled();
  });

  it('wheel events still track velocity internally but never use it for momentum', () => {
    const options = makeOptions(5);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 2 })
    );

    const wheelEvent = {
      deltaY: 4,
      deltaMode: 0,
      preventDefault: vi.fn(),
    } as unknown as WheelEvent;

    act(() => {
      result.current.handleWheel(wheelEvent);
    });

    // Velocity is tracked (for potential debugging/metrics) but never used
    // The velocity tracker gets samples, but wheel settling always uses velocity=0
    expect(trackerSpies.addSample).toHaveBeenCalled();
  });

  it('multi-gesture mode: fast swipe projects further than slow swipe (CRITICAL)', () => {
    // This test verifies the user's reported issue: "even in multi mode, fast and slow swipes travel identical distances"
    const options = makeOptions(50); // Large list to avoid boundary clamping

    const { result } = renderHook(() =>
      usePickerPhysics({
        ...baseConfig,
        options,
        selectedIndex: 25, // Middle of list
        isPickerOpen: true, // ALREADY OPEN = multi-gesture mode
      })
    );

    const columnNode = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({ top: 0, bottom: 200, height: 200, width: 100, left: 0, right: 100, x: 0, y: 0, toJSON: () => {} }),
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.columnRef.current = columnNode;
    });

    // Scenario 1: SLOW swipe (200 px/s velocity)
    velocityState.value = 200;
    frictionMomentumMock.animateMomentumWithFriction.mockClear();

    act(() => {
      result.current.handlePointerDown({ pointerId: 1, pointerType: 'touch', clientY: 100, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
      result.current.handlePointerMove({ pointerId: 1, pointerType: 'touch', clientY: 80, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
      result.current.handlePointerUp({ pointerId: 1, pointerType: 'touch', clientY: 80, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    const slowMomentumCall = frictionMomentumMock.animateMomentumWithFriction.mock.calls[0];
    expect(slowMomentumCall).toBeDefined();
    const slowVelocityUsed = slowMomentumCall[0].initialVelocity;

    // Scenario 2: FAST swipe (3000 px/s velocity)
    velocityState.value = 3000;
    frictionMomentumMock.animateMomentumWithFriction.mockClear();

    act(() => {
      result.current.handlePointerDown({ pointerId: 2, pointerType: 'touch', clientY: 100, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
      result.current.handlePointerMove({ pointerId: 2, pointerType: 'touch', clientY: 80, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
      result.current.handlePointerUp({ pointerId: 2, pointerType: 'touch', clientY: 80, currentTarget: columnNode, target: columnNode } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    const fastMomentumCall = frictionMomentumMock.animateMomentumWithFriction.mock.calls[0];
    expect(fastMomentumCall).toBeDefined();
    const fastVelocityUsed = fastMomentumCall[0].initialVelocity;

    // CRITICAL ASSERTION: Fast velocity should be significantly higher than slow velocity
    expect(Math.abs(fastVelocityUsed)).toBeGreaterThan(Math.abs(slowVelocityUsed) * 5);

    // Verify velocities are not zero (momentum is enabled)
    expect(Math.abs(slowVelocityUsed)).toBeGreaterThan(0);
    expect(Math.abs(fastVelocityUsed)).toBeGreaterThan(0);

    // Verify friction momentum was called with scaled velocities (velocity * 0.35)
    expect(Math.abs(slowVelocityUsed)).toBeCloseTo(200 * 0.35, 0);
    expect(Math.abs(fastVelocityUsed)).toBeCloseTo(3000 * 0.35, 0);
  });
});
