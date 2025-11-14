/**
 * Haptic feedback adapter for picker interactions
 *
 * Tree-shakeable: This module is only included in the bundle when
 * haptics are enabled via the enableHaptics prop.
 */

export interface HapticAdapter {
  /**
   * Trigger a subtle haptic pulse for value changes
   */
  trigger: () => void;

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
export function createHapticAdapter(): HapticAdapter | null {
  // SSR guard
  if (typeof navigator === 'undefined') {
    return null;
  }

  // Feature detection
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return null;
  }

  return {
    trigger: () => {
      try {
        // Subtle triple-pulse pattern (3ms, pause 2ms, 1ms)
        // This is gentle enough for rapid scrolling but noticeable
        navigator.vibrate([3, 2, 1]);
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
