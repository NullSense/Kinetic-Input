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

type ReleaseMomentumConfig = import('../utils/releaseMomentum').ReleaseMomentumConfig;

const releaseMomentumMock = vi.hoisted(() => ({
  projectReleaseTranslate: vi.fn(
    (current: number, velocity: number, config: ReleaseMomentumConfig) =>
      Math.max(
        config.minTranslate,
        Math.min(config.maxTranslate, current + velocity * (config.projectionSeconds ?? 0)),
      ),
  ),
}));

vi.mock('../useSnapPhysics', () => ({
  useSnapPhysics: () => snapSpies,
}));

vi.mock('../gestures', async () => {
  const actual = await vi.importActual<typeof import('../gestures')>('../gestures');
  return {
    ...actual,
    createVelocityTracker: vi.fn(() => trackerSpies),
  };
});

vi.mock('../utils/releaseMomentum', () => releaseMomentumMock);

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
    releaseMomentumMock.projectReleaseTranslate.mockClear();
  });

  const baseConfig = {
    key: 'test',
    itemHeight: 40,
    height: 200,
    isPickerOpen: true,
    wheelMode: 'natural' as const,
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

  it('passes wheel velocity into snap physics calculations', () => {
    const options = makeOptions(10);
    const { result } = renderHook(() =>
      usePickerPhysics({ ...baseConfig, options, selectedIndex: 4 })
    );

    const wheelEvent = {
      deltaY: 4,
      deltaMode: 0,
      preventDefault: vi.fn(),
    } as unknown as WheelEvent;

    velocityState.value = -320;
    act(() => {
      result.current.handleWheel(wheelEvent);
    });

    const lastCall = snapSpies.calculate.mock.calls.at(-1);
    expect(lastCall?.[0].velocityY).toBe(-320);
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

    const projectionCall = releaseMomentumMock.projectReleaseTranslate.mock.calls.at(-1);
    expect(projectionCall?.[1]).toBe(880);
  });

  it('keeps wheel micro-scroll deltas intact instead of snapping to full rows', () => {
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

    const snapFrame = snapSpies.calculate.mock.calls.at(-1)?.[0];
    expect(snapFrame?.deltaY).toBeGreaterThan(0);
    expect(snapFrame?.deltaY).toBeLessThan(baseConfig.itemHeight);
    expect(snapFrame?.totalPixelsMoved).toBeCloseTo(0.2, 5);
  });

  it('samples wheel translate using raw motion values so velocity is accurate', () => {
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

    const lastSample = trackerSpies.addSample.mock.calls.at(-1)?.[0];
    expect(lastSample).toBeCloseTo(0.4, 5);
  });
});
