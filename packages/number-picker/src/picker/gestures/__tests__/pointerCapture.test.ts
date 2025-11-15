import { describe, expect, it, vi } from 'vitest';
import { createPointerCaptureHandlers } from '../pointerCapture';
import type React from 'react';

// Helper to create mock pointer events
function createMockPointerEvent(
  overrides: Partial<React.PointerEvent<HTMLElement>> = {}
): React.PointerEvent<HTMLElement> {
  const mockElement = {
    setPointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
  } as unknown as HTMLElement;

  return {
    currentTarget: mockElement,
    clientY: 100,
    pointerId: 1,
    pointerType: 'touch',
    ...overrides,
  } as React.PointerEvent<HTMLElement>;
}

describe('createPointerCaptureHandlers', () => {
  describe('Pointer capture lifecycle', () => {
    it('captures pointer on pointer down', () => {
      const onCapture = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture });

      const event = createMockPointerEvent({ clientY: 150, pointerId: 42 });
      handlers.handlePointerDown(event);

      expect(event.currentTarget.setPointerCapture).toHaveBeenCalledWith(42);
      expect(onCapture).toHaveBeenCalledWith({
        isActive: true,
        startY: 150,
        currentY: 150,
        pointerType: 'touch',
        pointerId: 42,
      });
    });

    it('tracks pointer movement and calculates delta', () => {
      const onMove = vi.fn();
      const handlers = createPointerCaptureHandlers({ onMove });

      // Start at Y=100
      handlers.handlePointerDown(createMockPointerEvent({ clientY: 100 }));

      // Move to Y=120 (delta = +20)
      handlers.handlePointerMove(createMockPointerEvent({ clientY: 120 }));
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ currentY: 120 }),
        20 // deltaY
      );

      // Move to Y=90 (delta = -30 from 120)
      handlers.handlePointerMove(createMockPointerEvent({ clientY: 90 }));
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ currentY: 90 }),
        -30 // deltaY
      );
    });

    it('calculates total delta on pointer up', () => {
      const onRelease = vi.fn();
      const handlers = createPointerCaptureHandlers({ onRelease });

      // Start at Y=100
      handlers.handlePointerDown(createMockPointerEvent({ clientY: 100 }));

      // Move through several positions
      handlers.handlePointerMove(createMockPointerEvent({ clientY: 120 }));
      handlers.handlePointerMove(createMockPointerEvent({ clientY: 110 }));

      // Release at Y=150
      handlers.handlePointerUp(createMockPointerEvent({ clientY: 150 }));

      expect(onRelease).toHaveBeenCalledWith(
        expect.objectContaining({ startY: 100 }),
        50 // total delta: 150 - 100
      );
    });

    it('resets state after pointer up', () => {
      const handlers = createPointerCaptureHandlers({});

      handlers.handlePointerDown(createMockPointerEvent());
      expect(handlers.getState()).not.toBeNull();

      handlers.handlePointerUp(createMockPointerEvent());
      expect(handlers.getState()).toBeNull();
    });

    it('calls onCancel when pointer is canceled', () => {
      const onCancel = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCancel });

      handlers.handlePointerDown(createMockPointerEvent({ clientY: 100 }));
      handlers.handlePointerCancel(createMockPointerEvent());

      expect(onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ startY: 100 })
      );
      expect(handlers.getState()).toBeNull();
    });
  });

  describe('Pointer type detection', () => {
    it('correctly identifies mouse pointers', () => {
      const onCapture = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture });

      handlers.handlePointerDown(
        createMockPointerEvent({ pointerType: 'mouse' })
      );

      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({ pointerType: 'mouse' })
      );
    });

    it('correctly identifies touch pointers', () => {
      const onCapture = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture });

      handlers.handlePointerDown(
        createMockPointerEvent({ pointerType: 'touch' })
      );

      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({ pointerType: 'touch' })
      );
    });

    it('correctly identifies pen pointers', () => {
      const onCapture = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture });

      handlers.handlePointerDown(createMockPointerEvent({ pointerType: 'pen' }));

      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({ pointerType: 'pen' })
      );
    });

    it('normalizes unknown pointer types to empty string', () => {
      const onCapture = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture });

      handlers.handlePointerDown(
        createMockPointerEvent({ pointerType: 'unknown' as unknown as React.PointerEvent<HTMLElement>['pointerType'] })
      );

      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({ pointerType: '' })
      );
    });
  });

  describe('Edge cases', () => {
    it('ignores pointer move when not active', () => {
      const onMove = vi.fn();
      const handlers = createPointerCaptureHandlers({ onMove });

      // Move without capturing first
      handlers.handlePointerMove(createMockPointerEvent());

      expect(onMove).not.toHaveBeenCalled();
    });

    it('ignores pointer up when not active', () => {
      const onRelease = vi.fn();
      const handlers = createPointerCaptureHandlers({ onRelease });

      // Release without capturing first
      handlers.handlePointerUp(createMockPointerEvent());

      expect(onRelease).not.toHaveBeenCalled();
    });

    it('handles pointer leave only when not captured', () => {
      const onCancel = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCancel });

      handlers.handlePointerDown(createMockPointerEvent());

      // If pointer is captured, leave should not cancel
      const eventWithCapture = createMockPointerEvent();
      (eventWithCapture.currentTarget.hasPointerCapture as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
      handlers.handlePointerLeave(eventWithCapture);
      expect(onCancel).not.toHaveBeenCalled();

      // If pointer is NOT captured, leave should cancel
      const eventWithoutCapture = createMockPointerEvent();
      (eventWithoutCapture.currentTarget.hasPointerCapture as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        false
      );
      handlers.handlePointerLeave(eventWithoutCapture);
      expect(onCancel).toHaveBeenCalled();
    });

    it('allows manual reset', () => {
      const handlers = createPointerCaptureHandlers({});

      handlers.handlePointerDown(createMockPointerEvent());
      expect(handlers.getState()).not.toBeNull();

      handlers.reset();
      expect(handlers.getState()).toBeNull();
    });
  });

  describe('Multiple gesture sequences', () => {
    it('handles sequential pointer captures correctly', () => {
      const onCapture = vi.fn();
      const onRelease = vi.fn();
      const handlers = createPointerCaptureHandlers({ onCapture, onRelease });

      // First gesture: 100 -> 150
      handlers.handlePointerDown(createMockPointerEvent({ clientY: 100 }));
      handlers.handlePointerUp(createMockPointerEvent({ clientY: 150 }));

      expect(onRelease).toHaveBeenCalledWith(expect.anything(), 50);

      // Second gesture: 200 -> 180
      handlers.handlePointerDown(createMockPointerEvent({ clientY: 200 }));
      handlers.handlePointerUp(createMockPointerEvent({ clientY: 180 }));

      expect(onRelease).toHaveBeenCalledWith(expect.anything(), -20);
    });
  });
});
