import type React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useGestureCoordination } from '../useGestureCoordination';

const createMachineMock = () => ({
  state: 'closed' as const,
  isInteracting: false,
  isSettling: false,
  shouldBlockClose: false,
  handleWheelStart: vi.fn(),
  handleWheelIdle: vi.fn(),
  handlePointerDown: vi.fn(),
  handlePointerUp: vi.fn(),
  handleMomentumEnd: vi.fn(),
  handleExternalClose: vi.fn(),
  resetIdleTimer: vi.fn(),
  forceClose: vi.fn(),
});

const createPointerEvent = (target: EventTarget): React.PointerEvent =>
  ({
    currentTarget: target,
    target,
  }) as unknown as React.PointerEvent;

describe('useGestureCoordination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('opens picker on pointer down when closed', () => {
    const wrapper = document.createElement('div');
    const refs = {
      openedViaRef: { current: null } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      currentGestureSource: { current: null } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      isOpeningInteraction: { current: false } as React.MutableRefObject<boolean>,
      deferGestureCloseRef: { current: false } as React.MutableRefObject<boolean>,
    };
    const handlePickerOpen = vi.fn();
    const machine = createMachineMock();

    const { result } = renderHook(() =>
      useGestureCoordination({
        showPicker: false,
        wrapperRef: { current: wrapper },
        handlePickerOpen,
        stateMachine: machine,
        selectedValue: { value: '1' },
        wheelIdleTimeout: 100,
        ...refs,
      })
    );

    act(() => result.current.handlePointerDown(createPointerEvent(wrapper)));

    expect(handlePickerOpen).toHaveBeenCalled();
    expect(refs.openedViaRef.current).toBe('pointer');
    expect(refs.isOpeningInteraction.current).toBe(true);
  });

  it('handles wheel events by opening picker and scheduling idle timeout', () => {
    const wrapper = document.createElement('div');
    const refs = {
      openedViaRef: { current: null } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      currentGestureSource: { current: null } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      isOpeningInteraction: { current: false } as React.MutableRefObject<boolean>,
      deferGestureCloseRef: { current: false } as React.MutableRefObject<boolean>,
    };
    const handlePickerOpen = vi.fn();
    const machine = createMachineMock();

    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useGestureCoordination({
          showPicker: isOpen,
          wrapperRef: { current: wrapper },
          handlePickerOpen,
          stateMachine: machine,
          selectedValue: { value: '1' },
          wheelIdleTimeout: 200,
          ...refs,
        }),
      { initialProps: { isOpen: false } }
    );

    act(() => {
      wrapper.dispatchEvent(new WheelEvent('wheel'));
      rerender({ isOpen: true });
    });

    expect(handlePickerOpen).toHaveBeenCalled();
    expect(machine.handleWheelStart).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(machine.handleWheelIdle).toHaveBeenCalled();
  });

  it('resets gesture state after momentum completes', () => {
    const wrapper = document.createElement('div');
    const refs = {
      openedViaRef: { current: 'pointer' } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      currentGestureSource: { current: 'pointer' } as React.MutableRefObject<
        'pointer' | 'wheel' | 'keyboard' | null
      >,
      isOpeningInteraction: { current: true } as React.MutableRefObject<boolean>,
      deferGestureCloseRef: { current: true } as React.MutableRefObject<boolean>,
    };
    const handlePickerOpen = vi.fn();
    const machine = createMachineMock();

    const { result } = renderHook(() =>
      useGestureCoordination({
        showPicker: true,
        wrapperRef: { current: wrapper },
        handlePickerOpen,
        stateMachine: machine,
        selectedValue: { value: '5' },
        wheelIdleTimeout: 200,
        ...refs,
      })
    );

    act(() => {
      result.current.onGesture({
        type: 'boundary:hit',
        boundary: 'max',
        value: '9',
        timestamp: Date.now(),
      });
      result.current.onGesture({
        type: 'drag:end',
        hasMoved: true,
        velocity: 0,
        timestamp: Date.now(),
      });
    });

    act(() => {
      result.current.resetGestureState();
    });

    expect(refs.openedViaRef.current).toBeNull();
    expect(refs.currentGestureSource.current).toBeNull();
    expect(refs.isOpeningInteraction.current).toBe(false);
    expect(refs.deferGestureCloseRef.current).toBe(false);
  });
});
