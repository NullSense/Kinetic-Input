export interface SnapPhysicsConfig {
  enabled: boolean;
  snapRange: number; // fraction of itemHeight (e.g. 0.22)
  enterThreshold: number; // fraction of itemHeight to enter snap zone
  exitThreshold: number; // fraction of itemHeight to exit snap zone
  velocityThreshold: number; // px/sec where snap starts weakening
  velocityScaling: boolean;
  pullStrength: number; // 0-1 base attraction
  velocityReducer: number; // 0-1 reduction at threshold velocity
  centerLock: number; // 0-1 clamp strength toward the exact center line
  rangeScaleIntensity?: number; // additional distance multiplier based on velocity
  rangeScaleVelocityCap?: number; // px/sec cap when computing the multiplier
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
