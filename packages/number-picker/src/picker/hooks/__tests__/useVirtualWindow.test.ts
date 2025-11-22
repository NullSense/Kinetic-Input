import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useVirtualWindow } from '../useVirtualWindow';

describe('useVirtualWindow', () => {
  const baseProps = {
    centerIndex: 5,
    itemHeight: 48,
    optionCount: 20,
    slotCount: 11,
    overscan: 4,
  };

  it('clamps the start index within the available option range', () => {
    const { result, rerender } = renderHook((props) => useVirtualWindow(props), {
      initialProps: { ...baseProps, centerIndex: 12 },
    });

    expect(result.current.startIndex).toBe(8);
    expect(result.current.windowLength).toBe(11);
    expect(result.current.virtualOffsetY).toBe(8 * baseProps.itemHeight);

    rerender({ ...baseProps, centerIndex: 1 });

    expect(result.current.startIndex).toBe(0);
    expect(result.current.virtualOffsetY).toBe(0);
  });

  it('reduces the window length when option count is smaller than slot count', () => {
    const { result } = renderHook(() =>
      useVirtualWindow({ ...baseProps, optionCount: 4, slotCount: 10 })
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.windowLength).toBe(4);
    expect(result.current.virtualOffsetY).toBe(0);
  });

  it('recomputes the offset when the item height changes', () => {
    const { result, rerender } = renderHook((props) => useVirtualWindow(props), {
      initialProps: baseProps,
    });

    expect(result.current.virtualOffsetY).toBe(48 * 1);

    rerender({ ...baseProps, itemHeight: 56, centerIndex: 6 });

    expect(result.current.startIndex).toBe(2);
    expect(result.current.virtualOffsetY).toBe(112);
  });
});
