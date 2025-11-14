/**
 * Gesture event system for picker interactions
 *
 * This module defines a unified event-driven interface for all picker gestures,
 * replacing the previous callback-based approach. This enables:
 * - Clearer separation of concerns (physics vs orchestration)
 * - Easier testing (events are serializable)
 * - Simpler debugging (event logs are readable)
 * - Flexible consumption (different consumers handle different events)
 *
 * @module gestures/types
 */

// ============ Event Types ============

/**
 * Emitted when a drag gesture starts (pointer down + threshold exceeded)
 */
export interface DragStartEvent {
  type: 'drag:start';
  /** Timestamp when drag started */
  timestamp: number;
  /** Source of the drag (pointer, wheel, or keyboard) */
  source: 'pointer' | 'wheel' | 'keyboard';
}

/**
 * Emitted when a drag gesture ends (pointer up or momentum settled)
 */
export interface DragEndEvent {
  type: 'drag:end';
  /** Timestamp when drag ended */
  timestamp: number;
  /** Whether the value actually changed during this drag */
  hasMoved: boolean;
  /** Final velocity at end of drag (pixels/second) */
  velocity: number;
}

/**
 * Emitted when picker hits min/max boundary during scrolling
 */
export interface BoundaryHitEvent {
  type: 'boundary:hit';
  /** Timestamp when boundary was hit */
  timestamp: number;
  /** Which boundary was hit */
  boundary: 'min' | 'max';
  /** The value at the boundary (first or last option) */
  value: string | number | undefined;
}

/**
 * Emitted on every frame during scrolling for visual feedback
 * (e.g., haptic feedback on iOS during rapid scrolling)
 */
export interface VisualValueChangeEvent {
  type: 'value:visual';
  /** Timestamp of the visual change */
  timestamp: number;
  /** The visually centered value (may not be committed yet) */
  value: string | number;
  /** Index of the visually centered item */
  index: number;
}

/**
 * Emitted when a value is committed (selected and confirmed)
 */
export interface ValueCommitEvent {
  type: 'value:commit';
  /** Timestamp of the commit */
  timestamp: number;
  /** The committed value */
  value: string | number;
  /** Index of the committed item */
  index: number;
}

/**
 * Union of all gesture events
 */
export type PickerGestureEvent =
  | DragStartEvent
  | DragEndEvent
  | BoundaryHitEvent
  | VisualValueChangeEvent
  | ValueCommitEvent;

// ============ Event Handler Type ============

/**
 * Function signature for gesture event handlers
 *
 * @param event - The gesture event
 *
 * @example
 * ```tsx
 * const handleGesture: PickerGestureHandler = (event) => {
 *   switch (event.type) {
 *     case 'drag:start':
 *       console.log('Drag started at', event.timestamp);
 *       break;
 *     case 'value:commit':
 *       console.log('Value committed:', event.value);
 *       break;
 *   }
 * };
 *
 * <Picker.Column onGesture={handleGesture} />
 * ```
 */
export type PickerGestureHandler = (event: PickerGestureEvent) => void;

// ============ Gesture Source Tracking ============

/**
 * Tracks the current input source for gesture disambiguation
 */
export type GestureSource = 'pointer' | 'wheel' | 'keyboard' | null;

/**
 * Pointer type detection (mouse, touch, pen)
 */
export type PointerType = 'mouse' | 'pen' | 'touch' | '';

// ============ Utility Types ============

/**
 * Extract events of a specific type from the union
 *
 * @example
 * ```ts
 * type DragEvents = ExtractEvent<PickerGestureEvent, 'drag:start' | 'drag:end'>;
 * // Result: DragStartEvent | DragEndEvent
 * ```
 */
export type ExtractEvent<
  TEvent extends PickerGestureEvent,
  TType extends PickerGestureEvent['type']
> = Extract<TEvent, { type: TType }>;

/**
 * Type guard to check if event matches a specific type
 *
 * @param event - The event to check
 * @param type - The expected event type
 * @returns True if event matches type
 *
 * @example
 * ```ts
 * if (isGestureEvent(event, 'drag:start')) {
 *   // TypeScript knows event is DragStartEvent
 *   console.log(event.source);
 * }
 * ```
 */
export function isGestureEvent<T extends PickerGestureEvent['type']>(
  event: PickerGestureEvent,
  type: T
): event is Extract<PickerGestureEvent, { type: T }> {
  return event.type === type;
}
