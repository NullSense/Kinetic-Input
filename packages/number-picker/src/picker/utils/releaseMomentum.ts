import { clamp } from '../utils/math';
import { debugPickerLog } from '../../utils/debug';

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
  debugPickerLog('PROJECT RELEASE START', {
    currentTranslate: currentTranslate.toFixed(1),
    velocity: velocity.toFixed(1) + ' px/s',
    projectionSeconds: config.projectionSeconds,
    velocityCap: config.velocityCap,
    velocityThreshold: config.velocityThreshold,
    velocityBoost: config.velocityBoost,
  });

  if (!config.projectionSeconds || !velocity) {
    debugPickerLog('PROJECT RELEASE SKIPPED', {
      reason: !config.projectionSeconds ? 'projectionSeconds is falsy' : 'velocity is zero',
      projectionSeconds: config.projectionSeconds,
      velocity,
    });
    return clamp(currentTranslate, config.minTranslate, config.maxTranslate);
  }

  const cap = config.velocityCap ?? Math.abs(velocity);
  const limitedVelocity = clamp(velocity, -cap, cap);

  let projectionSeconds = config.projectionSeconds;
  if (config.velocityBoost && config.velocityBoost > 0 && config.velocityThreshold && config.velocityThreshold > 0) {
    const overspeed = Math.max(0, Math.abs(limitedVelocity) - config.velocityThreshold);
    const normalized = Math.min(overspeed / config.velocityThreshold, 1);
    projectionSeconds *= 1 + normalized * config.velocityBoost;

    debugPickerLog('VELOCITY BOOST APPLIED', {
      overspeed: overspeed.toFixed(1),
      normalized: normalized.toFixed(2),
      baseProjection: config.projectionSeconds,
      boostedProjection: projectionSeconds.toFixed(3),
      boostMultiplier: (1 + normalized * config.velocityBoost).toFixed(2) + 'x',
    });
  }

  const projected = currentTranslate + limitedVelocity * projectionSeconds;
  const clamped = clamp(projected, config.minTranslate, config.maxTranslate);

  debugPickerLog('PROJECT RELEASE RESULT', {
    input: currentTranslate.toFixed(1),
    velocity: limitedVelocity.toFixed(1) + ' px/s',
    projection: projectionSeconds.toFixed(3) + 's',
    delta: (limitedVelocity * projectionSeconds).toFixed(1) + 'px',
    projected: projected.toFixed(1),
    clamped: clamped.toFixed(1),
    wasClamped: projected !== clamped,
  });

  return clamped;
}
