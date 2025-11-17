/**
 * Friction-based momentum animation for natural deceleration
 *
 * Implements iOS-like exponential decay physics:
 * - Phase 1: Friction deceleration (prize wheel spinning)
 * - Phase 2: Spring snap (prize wheel settling)
 *
 * Based on iOS UIScrollView and Apple PastryKit physics
 */

import { animate, type AnimationPlaybackControls, type MotionValue } from 'framer-motion';
import type { MomentumPhysicsConfig } from '../../config/physics';
import { debugPickerLog } from '../../utils/debug';

export interface FrictionMomentumOptions {
  /**
   * MotionValue to animate
   */
  control: MotionValue<number>;

  /**
   * Initial velocity in px/s (positive = downward/rightward)
   */
  initialVelocity: number;

  /**
   * Bounds for clamping position
   */
  bounds: {
    min: number;
    max: number;
  };

  /**
   * Function to calculate snap target from current position
   * Called when velocity drops below threshold
   */
  snapFunction: (position: number) => number;

  /**
   * Physics configuration
   */
  config: MomentumPhysicsConfig;

  /**
   * Called when animation completes (after snap)
   */
  onComplete?: () => void;

  /**
   * Spring physics for final snap
   */
  snapSpring?: {
    stiffness: number;
    damping: number;
    restDelta?: number;
    restSpeed?: number;
  };
}

export interface FrictionMomentumControls {
  /**
   * Stop the animation immediately
   */
  stop: () => void;

  /**
   * Get current velocity (px/s)
   */
  getVelocity: () => number;

  /**
   * Check if animation is in friction phase (vs snap phase)
   */
  isFrictionPhase: () => boolean;
}

/**
 * Animate with friction-based momentum physics
 *
 * @example
 * ```typescript
 * const controls = animateMomentumWithFriction({
 *   control: yRaw,
 *   initialVelocity: 2000, // px/s
 *   bounds: { min: 0, max: 1000 },
 *   snapFunction: (pos) => Math.round(pos / 40) * 40,
 *   config: MOMENTUM_PHYSICS,
 *   onComplete: () => console.log('settled'),
 * });
 *
 * // Later, if user starts new gesture:
 * controls.stop();
 * ```
 */
export function animateMomentumWithFriction(
  options: FrictionMomentumOptions
): FrictionMomentumControls {
  const {
    control,
    initialVelocity,
    bounds,
    snapFunction,
    config,
    onComplete,
    snapSpring = {
      stiffness: 300,
      damping: 34,
      restDelta: 0.5,
      restSpeed: 10,
    },
  } = options;

  let velocity = initialVelocity;
  let rafId: number | null = null;
  let lastTime = performance.now();
  let startTime = lastTime;
  let cancelled = false;
  let inFrictionPhase = true;
  let springControls: AnimationPlaybackControls | null = null;

  debugPickerLog('FRICTION MOMENTUM START', {
    initialVelocity: initialVelocity.toFixed(1) + ' px/s',
    initialPosition: control.get().toFixed(1),
    decelerationRate: config.decelerationRate,
    snapVelocityThreshold: config.snapVelocityThreshold,
    bounds,
  });

  /**
   * Clamp position to bounds with exponential damping at edges
   */
  const clampWithOverdamping = (pos: number): number => {
    if (pos < bounds.min) {
      // Hit top boundary - apply strong damping
      const overshoot = bounds.min - pos;
      const damped = Math.pow(Math.min(overshoot, 80), 0.8); // Max 80px overshoot
      velocity *= 0.5; // Kill velocity on boundary hit
      return bounds.min - damped;
    }
    if (pos > bounds.max) {
      // Hit bottom boundary - apply strong damping
      const overshoot = pos - bounds.max;
      const damped = Math.pow(Math.min(overshoot, 80), 0.8);
      velocity *= 0.5; // Kill velocity on boundary hit
      return bounds.max + damped;
    }
    return pos;
  };

  /**
   * Friction animation loop
   */
  const tick = (currentTime: number): void => {
    if (cancelled) return;

    const deltaTime = currentTime - lastTime;
    const totalTime = currentTime - startTime;
    lastTime = currentTime;

    // Safety: Force snap if animation runs too long
    if (totalTime > config.maxDuration) {
      debugPickerLog('FRICTION TIMEOUT', {
        totalTime: totalTime.toFixed(0) + 'ms',
        maxDuration: config.maxDuration,
        currentVelocity: velocity.toFixed(1),
      });
      transitionToSnap();
      return;
    }

    // Apply exponential friction decay
    // velocity(t) = velocity(0) * decelerationRate^t
    const decayFactor = Math.pow(config.decelerationRate, deltaTime);
    velocity *= decayFactor;

    // Update position based on velocity
    // Δposition = velocity * Δt
    const currentPos = control.get();
    const deltaPos = velocity * (deltaTime / 1000); // Convert ms to seconds
    let newPos = currentPos + deltaPos;

    // Clamp to bounds with overdamping
    newPos = clampWithOverdamping(newPos);
    control.set(newPos);

    debugPickerLog('FRICTION TICK', {
      deltaTime: deltaTime.toFixed(1) + 'ms',
      velocity: velocity.toFixed(1) + ' px/s',
      deltaPos: deltaPos.toFixed(2) + 'px',
      position: newPos.toFixed(1),
      decayFactor: decayFactor.toFixed(4),
    });

    // Check if we should transition to snap
    const absVelocity = Math.abs(velocity);
    const shouldSnapVelocity = absVelocity < config.snapVelocityThreshold;

    // Also check distance to snap point
    const snapTarget = snapFunction(newPos);
    const distanceToSnap = Math.abs(newPos - snapTarget);
    const shouldSnapDistance = distanceToSnap < config.snapDistanceThreshold;

    if (shouldSnapVelocity || shouldSnapDistance) {
      debugPickerLog('FRICTION → SNAP TRANSITION', {
        reason: shouldSnapVelocity ? 'velocity threshold' : 'distance threshold',
        currentVelocity: velocity.toFixed(1) + ' px/s',
        threshold: config.snapVelocityThreshold + ' px/s',
        currentPosition: newPos.toFixed(1),
        snapTarget: snapTarget.toFixed(1),
        distance: distanceToSnap.toFixed(1) + 'px',
        totalTime: totalTime.toFixed(0) + 'ms',
      });
      transitionToSnap();
      return;
    }

    // Continue friction animation
    rafId = requestAnimationFrame(tick);
  };

  /**
   * Transition from friction phase to spring snap phase
   */
  const transitionToSnap = (): void => {
    if (cancelled) return;

    inFrictionPhase = false;
    const currentPos = control.get();
    const snapTarget = snapFunction(currentPos);

    debugPickerLog('SNAP SPRING START', {
      from: currentPos.toFixed(1),
      to: snapTarget.toFixed(1),
      velocity: velocity.toFixed(1) + ' px/s',
      spring: snapSpring,
    });

    // Start spring animation with current velocity
    springControls = animate(control, snapTarget, {
      type: 'spring',
      velocity: velocity, // Pass remaining velocity to spring
      ...snapSpring,
      onComplete: () => {
        debugPickerLog('SNAP SPRING COMPLETE', {
          finalPosition: control.get().toFixed(1),
          targetPosition: snapTarget.toFixed(1),
        });
        onComplete?.();
      },
    });
  };

  // Start friction animation
  rafId = requestAnimationFrame(tick);

  // Return control interface
  return {
    stop: () => {
      debugPickerLog('FRICTION MOMENTUM STOPPED', {
        phase: inFrictionPhase ? 'friction' : 'snap',
        currentVelocity: velocity.toFixed(1),
      });

      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (springControls) {
        springControls.stop();
        springControls = null;
      }
    },

    getVelocity: () => velocity,

    isFrictionPhase: () => inFrictionPhase,
  };
}
