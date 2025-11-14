/**
 * Pointer capture primitive for gesture tracking
 *
 * Handles low-level pointer event capture and coordinate tracking.
 * This is extracted from usePickerPhysics to be reusable
 * and testable in isolation.
 *
 * @module gestures/pointerCapture
 */

import type React from 'react';
import type { PointerType } from './types';

export interface PointerCaptureState {
  /** Whether pointer is currently captured */
  isActive: boolean;
  /** Initial Y coordinate when pointer was captured */
  startY: number;
  /** Current Y coordinate */
  currentY: number;
  /** Type of pointer (mouse, touch, pen) */
  pointerType: PointerType;
  /** Pointer ID for multi-touch scenarios */
  pointerId: number;
}

export interface PointerCaptureCallbacks {
  /** Called when pointer is captured (down event) */
  onCapture?: (state: PointerCaptureState) => void;
  /** Called on pointer move while captured */
  onMove?: (state: PointerCaptureState, deltaY: number) => void;
  /** Called when pointer is released (up event) */
  onRelease?: (state: PointerCaptureState, totalDeltaY: number) => void;
  /** Called if pointer capture is canceled */
  onCancel?: (state: PointerCaptureState) => void;
}

/**
 * Creates pointer capture handlers
 *
 * @param callbacks - Lifecycle callbacks
 * @returns Pointer event handlers
 *
 * @example
 * ```tsx
 * const handlers = createPointerCaptureHandlers({
 *   onCapture: (state) => console.log('Captured at', state.startY),
 *   onMove: (state, deltaY) => updatePosition(deltaY),
 *   onRelease: (state, totalDelta) => applyMomentum(totalDelta),
 * });
 *
 * <div
 *   onPointerDown={handlers.handlePointerDown}
 *   onPointerMove={handlers.handlePointerMove}
 *   onPointerUp={handlers.handlePointerUp}
 * />
 * ```
 */
export function createPointerCaptureHandlers(callbacks: PointerCaptureCallbacks) {
  let state: PointerCaptureState | null = null;

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const element = event.currentTarget;

    // Capture the pointer (prevents scroll, enables move tracking)
    if (element.setPointerCapture) {
      element.setPointerCapture(event.pointerId);
    }

    // Normalize pointer type
    const pointerType: PointerType =
      event.pointerType === 'mouse' ||
      event.pointerType === 'pen' ||
      event.pointerType === 'touch'
        ? event.pointerType
        : '';

    state = {
      isActive: true,
      startY: event.clientY,
      currentY: event.clientY,
      pointerType,
      pointerId: event.pointerId,
    };

    callbacks.onCapture?.(state);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!state || !state.isActive) return;

    const deltaY = event.clientY - state.currentY;
    state.currentY = event.clientY;

    callbacks.onMove?.(state, deltaY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!state || !state.isActive) return;

    const totalDeltaY = event.clientY - state.startY;
    callbacks.onRelease?.(state, totalDeltaY);

    state = null;
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    if (!state || !state.isActive) return;

    callbacks.onCancel?.(state);
    state = null;
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    // Only cancel if pointer wasn't captured
    // (captured pointers follow outside element bounds)
    if (!state || !state.isActive) return;

    const element = event.currentTarget;
    const hasCapture = element.hasPointerCapture?.(event.pointerId);

    if (!hasCapture) {
      callbacks.onCancel?.(state);
      state = null;
    }
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    /** Get current capture state (for debugging/testing) */
    getState: () => state,
    /** Reset state manually (for cleanup) */
    reset: () => {
      state = null;
    },
  };
}
