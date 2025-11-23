/**
 * Physics and interaction constants for number picker components
 *
 * Consolidates constants from:
 * - usePickerPhysics.ts
 * - useSnapPhysics.ts
 * - src/constants.ts (legacy)
 */

import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';

// ============ Gesture & Interaction Constants ============

/**
 * Maximum overscroll distance in pixels when dragging beyond bounds
 */
export const MAX_OVERSCROLL_PIXELS = 100;

/**
 * Minimum drag distance in pixels before picker opens (prevents accidental opens)
 */
export const OPENING_DRAG_THRESHOLD_PIXELS = 6;

/**
 * Threshold for detecting click vs drag (as ratio of item height)
 * Used for mouse/pen interactions
 */
export const CLICK_STEP_THRESHOLD_RATIO = 0.3;

/**
 * Threshold for detecting tap vs drag (as ratio of item height)
 * Used for touch interactions - more sensitive than mouse
 */
export const TOUCH_TAP_THRESHOLD_RATIO = 0.1;

/**
 * Minimum movement in pixels to consider a gesture as "moved"
 */
export const MINIMUM_MOVEMENT_PIXELS = 2;

/**
 * DOM WheelEvent deltaMode constants
 */
export const DOM_DELTA_MODE = {
  PIXEL: 0x00,
  LINE: 0x01,
  PAGE: 0x02,
} as const;

// ============ Snap Physics Math Constants ============

/**
 * Exponent for overscroll damping calculation
 * Lower = more resistance, Higher = less resistance
 * 0.85 provides extended travel with smooth resistance
 */
export const OVERSCROLL_DAMPING_EXPONENT = 0.85;

/**
 * Exponent for snap zone intensity calculation
 * Affects how aggressively items snap to center
 */
export const SNAP_ZONE_POWER_BASE = 1.0;

/**
 * Maximum additional power added by centerLock to snap intensity
 * Final exponent = SNAP_ZONE_POWER_BASE + (centerLock * SNAP_ZONE_POWER_SCALE)
 */
export const SNAP_ZONE_POWER_SCALE = 1.5;

/**
 * Proportion of snap zone where aggressive snapping kicks in
 * Values above this threshold get stronger pull toward center
 */
export const SNAP_AGGRESSIVE_ZONE_THRESHOLD = 0.6;

/**
 * Threshold for considering centerLock as "maximum" (prevents floating point errors)
 */
export const CENTER_LOCK_MAX_THRESHOLD = 0.999;

// ============ Snap Physics Presets ============

export const SNAP_PHYSICS = {
  DEFAULT: {
    enabled: true,
    snapRange: 1.4,
    enterThreshold: 0.8,
    exitThreshold: 0.68,
    velocityThreshold: 500, // Higher threshold for boost (was 300)
    velocityScaling: true,
    pullStrength: 1.4,
    velocityReducer: 0.3,
    centerLock: 1,
    rangeScaleIntensity: 0.25, // 250ms base projection (mobile-friendly, was 120ms)
    rangeScaleVelocityCap: 5000, // Allow faster swipes (was 3200)
    rangeScaleVelocityBoost: 2.0, // up to 3.0x projection for fast swipes (was 1.1 → 2.1x)
  },
} as const satisfies { DEFAULT: SnapPhysicsConfig };

// Backwards compatibility export
export const DEFAULT_SNAP_PHYSICS = SNAP_PHYSICS.DEFAULT;

// ============ Momentum Physics Constants ============

/**
 * Friction-based momentum physics for natural deceleration (iOS-like)
 *
 * Based on iOS UIScrollView physics and industry standards:
 * - iOS normal deceleration: 0.998 per millisecond
 * - Apple PastryKit time constant: 325ms
 * - Creates "prize wheel spinning down" feel
 */
export const MOMENTUM_PHYSICS = {
  /**
   * Deceleration rate applied per millisecond (exponential decay)
   * iOS standard values:
   * - normal: 0.998 (less friction, more native feel)
   * - fast: 0.99 (more friction, less native feel)
   * - current: 0.998 (smooth with slightly more friction for precision)
   *
   * At 60fps (16.67ms/frame): velocity *= 0.998^16.67 = velocity *= 0.967 per frame
   */
  decelerationRate: 0.998,

  /**
   * Velocity threshold in px/s below which we stop friction and snap to nearest item
   * Lower = snaps earlier (more precise), Higher = longer momentum phase (more fluid)
   */
  snapVelocityThreshold: 50,

  /**
   * Maximum time in milliseconds to run friction animation before forcing snap
   * Prevents infinite animation from floating point precision issues
   */
  maxDuration: 3000,
} as const;

export type MomentumPhysicsConfig = typeof MOMENTUM_PHYSICS;

/**
 * Calculate velocity scale factor based on picker list size
 *
 * Uses non-linear scaling to reduce max flick velocity for larger lists:
 * - Small lists (5-10 items): Higher velocity (~0.30-0.38)
 * - Medium lists (20-50 items): Moderate velocity (~0.18-0.24)
 * - Large lists (100+ items): Lower velocity (~0.13)
 *
 * This prevents overshooting when flicking through long lists while
 * maintaining responsiveness for short lists.
 *
 * @param itemCount - Number of items in the picker list
 * @returns Velocity scale factor (0.1 to 0.4)
 *
 * @example
 * ```ts
 * const scale = calculateFlickVelocityScale(100); // ~0.13 for 100 items
 * const scale = calculateFlickVelocityScale(10);  // 0.30 for 10 items
 * const adjustedVelocity = rawVelocity * scale;
 * ```
 */
export function calculateFlickVelocityScale(itemCount: number): number {
  // Base scale for a 10-item list
  const baseScale = 0.30;

  // Clamp to reasonable bounds (at least 3 items to avoid division issues)
  const count = Math.max(itemCount, 3);

  // Non-linear power scaling: scale = baseScale * (count / 10)^(-0.35)
  // - Smaller lists get higher multiplier (e.g., 5 items → 1.27x)
  // - Larger lists get lower multiplier (e.g., 100 items → 0.45x)
  const scaleFactor = Math.pow(count / 10, -0.35);

  // Apply scaling with reasonable bounds
  const scale = baseScale * scaleFactor;

  // Clamp to [0.08, 0.40] to prevent extreme values
  return Math.max(0.08, Math.min(0.40, scale));
}
