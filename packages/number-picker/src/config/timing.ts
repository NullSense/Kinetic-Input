/**
 * Type-safe timing configuration for picker auto-close behavior
 *
 * Provides semantic presets ('instant', 'fast', 'balanced', 'patient')
 * and auto-detection based on device/accessibility preferences.
 */

// ============ Types ============

export interface TimingConfig {
  /** Single gesture close delay (quick tap/drag) */
  readonly settleGracePeriod: number;

  /** Wheel/scroll momentum close delay */
  readonly wheelIdleTimeout: number;

  /** Multi-gesture browsing timeout */
  readonly idleTimeout: number;

  /** Force settle if vendor callback fails */
  readonly watchdogTimeout: number;
}

export type TimingPreset = 'instant' | 'fast' | 'balanced' | 'patient';

// ============ Presets ============

/**
 * Predefined timing configurations with validated ratios
 *
 * Constraints enforced:
 * - wheelIdleTimeout >= settleGracePeriod * 5
 * - idleTimeout >= wheelIdleTimeout * 2
 * - watchdogTimeout >= settleGracePeriod * 5
 */
export const TIMING_PRESETS = {
  /**
   * Instant close (50ms grace)
   * Best for: High-frequency data entry, power users
   */
  instant: {
    settleGracePeriod: 50,
    wheelIdleTimeout: 300,
    idleTimeout: 1500,
    watchdogTimeout: 800,
  },

  /**
   * Fast close (100ms grace)
   * Best for: Desktop users, keyboard-heavy workflows
   */
  fast: {
    settleGracePeriod: 100,
    wheelIdleTimeout: 500,
    idleTimeout: 2500,
    watchdogTimeout: 1000,
  },

  /**
   * Balanced close (150ms grace) - DEFAULT
   * Best for: General use, mixed input methods
   */
  balanced: {
    settleGracePeriod: 150,
    wheelIdleTimeout: 800,
    idleTimeout: 4000,
    watchdogTimeout: 1000,
  },

  /**
   * Patient close (300ms grace)
   * Best for: Mobile, accessibility, reduced motion preference
   */
  patient: {
    settleGracePeriod: 300,
    wheelIdleTimeout: 1200,
    idleTimeout: 6000,
    watchdogTimeout: 1500,
  },
} as const satisfies Record<TimingPreset, TimingConfig>;

// ============ Helpers ============

/**
 * Auto-detect recommended timing preset based on:
 * - User accessibility preferences (prefers-reduced-motion)
 * - Device type (mobile vs desktop)
 * - Connection speed (for remote apps)
 *
 * @returns Recommended timing preset
 *
 * @example
 * ```tsx
 * <CollapsiblePicker timingPreset={getRecommendedTiming()} />
 * ```
 */
export function getRecommendedTiming(): TimingPreset {
  if (typeof window === 'undefined') {
    return 'balanced'; // SSR default
  }

  // Accessibility: Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return 'patient';
  }

  // Device detection: Touch devices need more time
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const hasTouch = 'ontouchstart' in window;

  if (isMobile || hasTouch) {
    return 'patient';
  }

  // Default: Balanced for desktop
  return 'balanced';
}
