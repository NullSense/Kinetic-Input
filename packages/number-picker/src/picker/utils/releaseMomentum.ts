import { clamp } from '../utils/math';

export interface ReleaseMomentumConfig {
  projectionSeconds: number;
  velocityCap?: number;
  minTranslate: number;
  maxTranslate: number;
  velocityThreshold?: number;
  velocityBoost?: number;
}

/**
 * Projects the column translate when a gesture ends with remaining velocity.
 * The projection distance is controlled via projectionSeconds which behaves
 * like "how long should the flick coast". Velocity is clamped to avoid
 * overshooting too many rows, then mapped back into the picker bounds.
 */
export function projectReleaseTranslate(
  currentTranslate: number,
  velocity: number,
  config: ReleaseMomentumConfig,
): number {
  if (!config.projectionSeconds || !velocity) {
    return clamp(currentTranslate, config.minTranslate, config.maxTranslate);
  }

  const cap = config.velocityCap ?? Math.abs(velocity);
  const limitedVelocity = clamp(velocity, -cap, cap);

  let projectionSeconds = config.projectionSeconds;
  if (config.velocityBoost && config.velocityBoost > 0 && config.velocityThreshold && config.velocityThreshold > 0) {
    const overspeed = Math.max(0, Math.abs(limitedVelocity) - config.velocityThreshold);
    const normalized = Math.min(overspeed / config.velocityThreshold, 1);
    projectionSeconds *= 1 + normalized * config.velocityBoost;
  }

  const projected = currentTranslate + limitedVelocity * projectionSeconds;
  return clamp(projected, config.minTranslate, config.maxTranslate);
}
