/**
 * Event emitter helper for picker gestures
 *
 * Provides utilities for creating and emitting gesture events
 * with consistent timestamps and type safety.
 *
 * @module gestures/eventEmitter
 */

import type {
  PickerGestureEvent,
  DragStartEvent,
  DragEndEvent,
  BoundaryHitEvent,
  VisualValueChangeEvent,
  ValueCommitEvent,
  GestureSource,
  PickerGestureHandler,
} from './types';

/**
 * Creates a drag:start event
 *
 * @param source - The gesture source (pointer/wheel/keyboard)
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns DragStartEvent
 */
export function createDragStartEvent(
  source: GestureSource,
  timestamp: number = Date.now()
): DragStartEvent {
  return {
    type: 'drag:start',
    timestamp,
    source: source || 'pointer', // Default to pointer if null
  };
}

/**
 * Creates a drag:end event
 *
 * @param hasMoved - Whether the drag resulted in movement
 * @param velocity - Final velocity in pixels/second
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns DragEndEvent
 */
export function createDragEndEvent(
  hasMoved: boolean,
  velocity: number = 0,
  timestamp: number = Date.now()
): DragEndEvent {
  return {
    type: 'drag:end',
    timestamp,
    hasMoved,
    velocity,
  };
}

/**
 * Creates a boundary:hit event
 *
 * @param boundary - Which boundary was hit ('min' or 'max')
 * @param value - The value at the boundary
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns BoundaryHitEvent
 */
export function createBoundaryHitEvent(
  boundary: 'min' | 'max',
  value: string | number | undefined,
  timestamp: number = Date.now()
): BoundaryHitEvent {
  return {
    type: 'boundary:hit',
    timestamp,
    boundary,
    value,
  };
}

/**
 * Creates a value:visual event
 *
 * @param value - The visually centered value
 * @param index - The index of the centered item
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns VisualValueChangeEvent
 */
export function createVisualValueChangeEvent(
  value: string | number,
  index: number,
  timestamp: number = Date.now()
): VisualValueChangeEvent {
  return {
    type: 'value:visual',
    timestamp,
    value,
    index,
  };
}

/**
 * Creates a value:commit event
 *
 * @param value - The committed value
 * @param index - The index of the committed item
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns ValueCommitEvent
 */
export function createValueCommitEvent(
  value: string | number,
  index: number,
  timestamp: number = Date.now()
): ValueCommitEvent {
  return {
    type: 'value:commit',
    timestamp,
    value,
    index,
  };
}

/**
 * Creates a gesture event emitter that safely handles optional handlers
 *
 * @param handler - Optional gesture handler function
 * @returns Object with emit methods for each event type
 *
 * @example
 * ```ts
 * const emitter = createGestureEmitter(props.onGesture);
 *
 * // Emit events
 * emitter.dragStart('pointer');
 * emitter.dragEnd(true, 1200);
 * emitter.boundaryHit('max', 100);
 * ```
 */
export function createGestureEmitter(handler?: PickerGestureHandler) {
  const emit = (event: PickerGestureEvent) => {
    handler?.(event);
  };

  return {
    /** Emit drag:start event */
    dragStart: (source: GestureSource = 'pointer') => {
      emit(createDragStartEvent(source));
    },

    /** Emit drag:end event */
    dragEnd: (hasMoved: boolean, velocity: number = 0) => {
      emit(createDragEndEvent(hasMoved, velocity));
    },

    /** Emit boundary:hit event */
    boundaryHit: (boundary: 'min' | 'max', value?: string | number) => {
      emit(createBoundaryHitEvent(boundary, value));
    },

    /** Emit value:visual event */
    visualChange: (value: string | number, index: number) => {
      emit(createVisualValueChangeEvent(value, index));
    },

    /** Emit value:commit event */
    valueCommit: (value: string | number, index: number) => {
      emit(createValueCommitEvent(value, index));
    },

    /** Direct emit (for custom events or testing) */
    emit,
  };
}
