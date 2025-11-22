import { useMemo } from 'react';
import { clamp } from '../utils/math';

interface UseVirtualWindowArgs {
  centerIndex: number;
  itemHeight: number;
  optionCount: number;
  slotCount: number;
  overscan: number;
}

/**
 * Computes the virtualized window bounds and offset for the picker column slots.
 * @param {UseVirtualWindowArgs} args
 * @returns {{ startIndex: number, windowLength: number, virtualOffsetY: number }}
 */
export function useVirtualWindow({
  centerIndex,
  itemHeight,
  optionCount,
  slotCount,
  overscan,
}: UseVirtualWindowArgs) {
  const { startIndex, windowLength } = useMemo(() => {
    const available = Math.max(0, optionCount - slotCount);
    const nextStart = clamp(centerIndex - overscan, 0, available);

    return {
      startIndex: nextStart,
      windowLength: Math.min(slotCount, optionCount),
    };
  }, [centerIndex, optionCount, overscan, slotCount]);

  const virtualOffsetY = useMemo(() => startIndex * itemHeight, [itemHeight, startIndex]);

  return { startIndex, windowLength, virtualOffsetY };
}
