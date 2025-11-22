import { useCallback, useRef } from 'react';

interface HighlightTapTracker {
  pointerId: number;
  startX: number;
  startY: number;
  startedInHighlight: boolean;
  moved: boolean;
}

interface HighlightTapOptions {
  enabled: boolean;
  getHighlightRect: () => DOMRect | null;
  movementThreshold: number;
  onTap: () => void;
}

/**
 * Detects taps confined to the highlight overlay while ignoring drags outside the hotspot.
 * @param {HighlightTapOptions} options
 * @returns {{ onPointerDownCapture: Function, onPointerMoveCapture: Function, onPointerUpCapture: Function, onPointerCancelCapture: Function }} Capture handlers.
 */
export const useHighlightTap = ({
  enabled,
  getHighlightRect,
  movementThreshold,
  onTap,
}: HighlightTapOptions) => {
  const trackerRef = useRef<HighlightTapTracker | null>(null);

  const isPointInside = useCallback(
    (clientX: number, clientY: number) => {
      const rect = getHighlightRect();
      if (!rect) return false;
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [getHighlightRect]
  );

  const handlePointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) {
        trackerRef.current = null;
        return;
      }
      trackerRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedInHighlight: isPointInside(event.clientX, event.clientY),
        moved: false,
      };
    },
    [enabled, isPointInside]
  );

  const handlePointerMoveCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const tracker = trackerRef.current;
      if (!tracker || tracker.pointerId !== event.pointerId || tracker.moved) return;
      const deltaX = Math.abs(event.clientX - tracker.startX);
      const deltaY = Math.abs(event.clientY - tracker.startY);
      if (deltaX > movementThreshold || deltaY > movementThreshold) {
        tracker.moved = true;
      }
    },
    [movementThreshold]
  );

  const handlePointerUpCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const tracker = trackerRef.current;
      if (!tracker || tracker.pointerId !== event.pointerId) {
        return;
      }
      const endedInHighlight = isPointInside(event.clientX, event.clientY);
      const shouldClose =
        tracker.startedInHighlight && !tracker.moved && endedInHighlight && enabled;

      trackerRef.current = null;

      if (shouldClose) {
        onTap();
      }
    },
    [enabled, isPointInside, onTap]
  );

  const handlePointerCancelCapture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const tracker = trackerRef.current;
    if (tracker && tracker.pointerId === event.pointerId) {
      trackerRef.current = null;
    }
  }, []);

  return {
    onPointerDownCapture: handlePointerDownCapture,
    onPointerMoveCapture: handlePointerMoveCapture,
    onPointerUpCapture: handlePointerUpCapture,
    onPointerCancelCapture: handlePointerCancelCapture,
  };
};
