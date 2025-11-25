/**
 * Unified picker configuration for the demo site
 * All pickers use these defaults unless overridden
 */

export const DEMO_PICKER_DEFAULTS = {
  // Range & behavior
  min: 0,
  max: 200,
  step: 1,

  // Physics & feedback
  enableSnapPhysics: true,
  enableHaptics: true,
  enableAudioFeedback: true,

  // Visual
  itemHeight: 40,
} as const;

/**
 * Standard picker configurations used across the demo
 */
export const DEMO_PICKERS = {
  weight: {
    ...DEMO_PICKER_DEFAULTS,
    initialValue: 70,
    label: 'WEIGHT',
    unit: 'kg',
  },
  reps: {
    ...DEMO_PICKER_DEFAULTS,
    min: 1,
    max: 50,
    initialValue: 8,
    label: 'REPS',
    unit: 'reps',
  },
  distance: {
    ...DEMO_PICKER_DEFAULTS,
    max: 100,
    step: 0.5,
    initialValue: 5,
    label: 'DISTANCE',
    unit: 'km',
  },
} as const;
