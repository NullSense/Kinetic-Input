import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type React from 'react';
import { usePickerPhysics } from '../usePickerPhysics';

const snapSpies = vi.hoisted(() => ({
  calculate: vi.fn(() => ({ mappedTranslate: 0, inSnapZone: false })),
  reset: vi.fn(),
}));

const velocityState = vi.hoisted(() => ({ value: 0 }));

vi.mock('../useSnapPhysics', () => ({
  useSnapPhysics: () => snapSpies,
}));

vi.mock('../gestures', async () => {
  const actual = await vi.importActual<typeof import('../gestures')>('../gestures');
  return {
    ...actual,
    createVelocityTracker: vi.fn(() => ({
      addSample: vi.fn(),
      getVelocity: () => velocityState.value,
      reset: vi.fn(),
      getSampleCount: vi.fn(() => 0),
    })),
  };
});

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
});
