/**
 * Snap physics configuration presets
 *
 * Consolidates constants from:
 * - src/constants.ts
 */

import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';

export const SNAP_PHYSICS = {
  DEFAULT: {
    enabled: true,
    snapRange: 1.4,
    enterThreshold: 0.8,
    exitThreshold: 0.68,
    velocityThreshold: 300,
    velocityScaling: true,
    pullStrength: 1.4,
    velocityReducer: 0.3,
    centerLock: 1,
    rangeScaleIntensity: 0.12, // 120ms base projection
    rangeScaleVelocityCap: 3200,
    rangeScaleVelocityBoost: 1.1, // up to 2.1x projection once velocity crosses the threshold
  },
} as const satisfies { DEFAULT: SnapPhysicsConfig };

// Backwards compatibility export
export const DEFAULT_SNAP_PHYSICS = SNAP_PHYSICS.DEFAULT;
