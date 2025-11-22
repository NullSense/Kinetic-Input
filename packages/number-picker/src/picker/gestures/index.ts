/**
 * Gesture system for picker interactions
 *
 * This module provides an event-driven gesture system to replace
 * the callback-based approach. See README.md for full documentation.
 *
 * @module gestures
 */

// ============ Types ============
export type {
  PickerGestureEvent,
  DragStartEvent,
  DragEndEvent,
  BoundaryHitEvent,
  VisualValueChangeEvent,
  ValueCommitEvent,
  PickerGestureHandler,
  GestureSource,
  PointerType,
  ExtractEvent,
} from './types';

export { isGestureEvent } from './types';

// ============ Primitives ============
export type { PointerCaptureState, PointerCaptureCallbacks } from './pointerCapture';

export { createPointerCaptureHandlers } from './pointerCapture';

export type { VelocityTrackerConfig } from './velocityTracker';

export { createVelocityTracker } from './velocityTracker';

// ============ Event Helpers ============
export {
  createDragStartEvent,
  createDragEndEvent,
  createBoundaryHitEvent,
  createVisualValueChangeEvent,
  createValueCommitEvent,
  createGestureEmitter,
} from './eventEmitter';
