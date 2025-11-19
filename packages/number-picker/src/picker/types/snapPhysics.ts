/**
 * Configuration for magnetic snap-to-item physics (experimental feature).
 *
 * Creates a "magnetic" pull toward the center item, making selections feel more deliberate.
 * Advanced users can tune these parameters for different tactile feels.
 *
 * @see {@link DEFAULT_SNAP_PHYSICS} for recommended defaults
 */
export interface SnapPhysicsConfig {
  /** Whether snap physics is enabled */
  enabled: boolean;
  /** Snap zone size as fraction of item height (e.g., 0.3 = 30% of item height) */
  snapRange: number;
  /** Distance threshold to enter snap zone (fraction of item height) */
  enterThreshold: number;
  /** Distance threshold to exit snap zone (fraction of item height) */
  exitThreshold: number;
  /** Velocity in px/sec where snap starts weakening (allows fast scrolling to override) */
  velocityThreshold: number;
  /** Whether to scale snap strength based on velocity */
  velocityScaling: boolean;
  /** Base magnetic pull strength toward center (0-1, higher = stronger) */
  pullStrength: number;
  /** Strength reduction factor at threshold velocity (0-1) */
  velocityReducer: number;
  /** Clamp strength toward exact center line (0-1, higher = more precise) */
  centerLock: number;
  /** Seconds of release projection applied to flick gestures */
  rangeScaleIntensity?: number;
  /** Maximum velocity in px/sec when projecting release distance */
  rangeScaleVelocityCap?: number;
  /** Additional projection multiplier for velocities above threshold */
  rangeScaleVelocityBoost?: number;
}

export interface DragContextFrame {
  deltaY: number;
  velocityY: number;
  totalPixelsMoved: number;
}

export interface SnapPhysicsResult {
  mappedTranslate: number;
  inSnapZone: boolean;
  debug?: {
    distanceToSnap: number;
    proportionInZone: number;
    appliedPullStrength: number;
    stickRadius?: number;
    lockBlend?: number;
  };
}

export interface SnapPhysicsState {
  wasInSnapZone: boolean;
}
