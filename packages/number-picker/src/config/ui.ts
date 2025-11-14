/**
 * UI constants for picker components
 *
 * Consolidates constants from:
 * - src/quick/constants.ts
 */

export const UI = {
  /** Default item height in pixels */
  ITEM_HEIGHT: 40,

  /** Movement threshold for highlight tap detection (px) */
  HIGHLIGHT_TAP_MOVEMENT_THRESHOLD: 4,

  /** Delay before processing click outside (ms) */
  CLICK_OUTSIDE_DELAY: 100,

  /** Boundary settle delay for overscroll bounce (ms) */
  BOUNDARY_SETTLE_DELAY: 150,

  /** Wheel/scroll close delay (ms) */
  WHEEL_CLOSE_DELAY: 800,
} as const;

// Individual exports for backwards compatibility
export const ITEM_HEIGHT = UI.ITEM_HEIGHT;
export const HIGHLIGHT_TAP_MOVEMENT_THRESHOLD = UI.HIGHLIGHT_TAP_MOVEMENT_THRESHOLD;
export const CLICK_OUTSIDE_DELAY = UI.CLICK_OUTSIDE_DELAY;
export const BOUNDARY_SETTLE_DELAY = UI.BOUNDARY_SETTLE_DELAY;
export const WHEEL_CLOSE_DELAY = UI.WHEEL_CLOSE_DELAY;
