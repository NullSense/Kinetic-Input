/**
 * Haptic feedback adapter for picker interactions
 *
 * Tree-shakeable: This module is only included in the bundle when
 * haptics are enabled via the enableHaptics prop.
 */

type VibratePattern = number | number[];

export interface HapticAdapter {
  /**
   * Trigger a haptic pulse for value changes
   * @param isSettle - Whether this is a settle event (stronger feedback)
   */
  trigger: (isSettle?: boolean) => void;

  /**
   * Cleanup resources (no-op for haptics, but included for consistency)
   */
  cleanup: () => void;
}

/**
 * Creates a haptic feedback adapter using the Vibration API
 *
 * @returns Haptic adapter or null if vibration is not supported
 *
 * @example
 * ```ts
 * const haptics = createHapticAdapter();
 * if (haptics) {
 *   haptics.trigger(); // Vibrate on value change
 * }
 * ```
 */
export interface HapticAdapterOptions {
  /** Pattern for regular scroll haptics */
  pattern?: VibratePattern;
  /** Pattern for settle haptics (stronger feedback when picker comes to rest) */
  settlePattern?: VibratePattern;
}

const DEFAULT_PATTERN: VibratePattern = [3, 2, 1];
const DEFAULT_SETTLE_PATTERN: VibratePattern = [8, 3, 5];

export function createHapticAdapter(options: HapticAdapterOptions = {}): HapticAdapter | null {
  // SSR guard
  if (typeof navigator === 'undefined') {
    return null;
  }

  // Feature detection
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return null;
  }

  return {
    trigger: (isSettle?: boolean) => {
      try {
        const pattern = isSettle
          ? (options.settlePattern ?? DEFAULT_SETTLE_PATTERN)
          : (options.pattern ?? DEFAULT_PATTERN);
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration failures (e.g., permissions, battery saver mode)
      }
    },

    cleanup: () => {
      // No cleanup needed for vibration API
      // (included for interface consistency with audio adapter)
    },
  };
}
