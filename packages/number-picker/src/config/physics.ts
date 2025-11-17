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
export const MAX_OVERSCROLL_PIXELS = 80;

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
 */
export const OVERSCROLL_DAMPING_EXPONENT = 0.8;

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
