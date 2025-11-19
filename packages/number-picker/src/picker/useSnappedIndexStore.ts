import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { MotionValue } from 'framer-motion';
import { clampIndex, indexFromY } from './utils/math';

/**
 * Server-side snapshot always returns 0 (initial index)
 */
const getServerSnapshot = () => 0;

/**
 * Exposes the snapped picker index via a useSyncExternalStore bridge backed by a MotionValue.
 * @param {MotionValue<number>} ySnap
 * @param {number} rowHeight
 * @param {number} maxTranslate
 * @param {number} lastIndex
 * @returns {number}
 */
export function useSnappedIndexStore(
  ySnap: MotionValue<number>,
  rowHeight: number,
  maxTranslate: number,
  lastIndex: number,
) {
  // ✅ FIX: Initialize with actual current index from MotionValue
  // Without this, indexRef starts at 0 even if ySnap is already at the correct position
  const indexRef = useRef(
    clampIndex(indexFromY(ySnap.get(), rowHeight, maxTranslate), lastIndex)
  );
  const subscribersRef = useRef(new Set<() => void>());

  // ✅ FIX: Sync indexRef when dependencies change (on mount and when picker config updates)
  useEffect(() => {
    const currentY = ySnap.get();
    const correctIndex = clampIndex(indexFromY(currentY, rowHeight, maxTranslate), lastIndex);
    if (correctIndex !== indexRef.current) {
      indexRef.current = correctIndex;
      subscribersRef.current.forEach((notify) => notify());
    }
  }, [ySnap, rowHeight, maxTranslate, lastIndex]);

  useEffect(() => {
    if (typeof ySnap.on !== 'function') {
      return undefined;
    }

    const unsubscribe = ySnap.on('change', (value) => {
      const nextIndex = clampIndex(indexFromY(value, rowHeight, maxTranslate), lastIndex);
      if (nextIndex !== indexRef.current) {
        indexRef.current = nextIndex;
        subscribersRef.current.forEach((notify) => notify());
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [ySnap, rowHeight, maxTranslate, lastIndex]);

  const subscribe = (listener: () => void) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  };

  const getSnapshot = () => indexRef.current;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
