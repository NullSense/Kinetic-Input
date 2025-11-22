import type React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePickerCoordinator } from '../usePickerCoordinator';
import { usePickerVisibility } from '../usePickerVisibility';

const TIMING = {
  idleTimeout: 1000,
  settleGracePeriod: 200,
  wheelIdleTimeout: 400,
};

const createPointerEvent = (target: EventTarget): React.PointerEvent =>
  ({
    currentTarget: target,
    target,
  }) as unknown as React.PointerEvent;

describe('usePickerCoordinator', () => {
  it('opens and closes the picker through orchestration handlers', () => {
    const { result } = renderHook(() => {
      const visibility = usePickerVisibility({});
      return usePickerCoordinator({
        visibility,
        selectedValue: { value: '1' },
        timing: TIMING,
      });
    });

    expect(result.current.showPicker).toBe(false);

    act(() => {
      result.current.handlePickerOpen();
    });

    expect(result.current.showPicker).toBe(true);

    act(() => {
      result.current.handlePickerClose('test-close');
    });

    expect(result.current.showPicker).toBe(false);
  });

  it('marks pointer gestures as opening interactions', () => {
    const target = document.createElement('div');
    const { result } = renderHook(() => {
      const visibility = usePickerVisibility({});
      return usePickerCoordinator({
        visibility,
        selectedValue: { value: '5' },
        timing: TIMING,
      });
    });

    act(() => {
      result.current.handlePointerDown(createPointerEvent(target));
    });

    expect(result.current.openedViaRef.current).toBe('pointer');
    expect(result.current.isOpeningInteraction.current).toBe(true);
    expect(result.current.showPicker).toBe(true);
  });
});
