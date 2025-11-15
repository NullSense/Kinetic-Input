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
    exitThreshold: 0.58,
    velocityThreshold: 300,
    velocityScaling: true,
    pullStrength: 1.4,
    velocityReducer: 0.3,
    centerLock: 1,
    rangeScaleIntensity: 0.1, // 100ms of momentum projection
    rangeScaleVelocityCap: 3000,
  },
} as const satisfies { DEFAULT: SnapPhysicsConfig };

// Backwards compatibility export
export const DEFAULT_SNAP_PHYSICS = SNAP_PHYSICS.DEFAULT;
