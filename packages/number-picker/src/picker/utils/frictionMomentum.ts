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
      stiffness: 180,
      damping: 28,
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
   * Check if position has hit a boundary
   * Returns { hitBoundary: boolean, clampedPosition: number }
   */
  const checkBoundary = (pos: number): { hitBoundary: boolean; clampedPosition: number } => {
    if (pos < bounds.min) {
      debugPickerLog('BOUNDARY HIT', {
        boundary: 'min',
        position: pos.toFixed(1),
        bound: bounds.min.toFixed(1),
        velocity: velocity.toFixed(1),
      });
      return { hitBoundary: true, clampedPosition: bounds.min };
    }
    if (pos > bounds.max) {
      debugPickerLog('BOUNDARY HIT', {
        boundary: 'max',
        position: pos.toFixed(1),
        bound: bounds.max.toFixed(1),
        velocity: velocity.toFixed(1),
      });
      return { hitBoundary: true, clampedPosition: bounds.max };
    }
    return { hitBoundary: false, clampedPosition: pos };
  };

  /**
   * Apply friction decay to velocity
   */
  const applyFriction = (currentVelocity: number, deltaTime: number): number => {
    const decayFactor = Math.pow(config.decelerationRate, deltaTime);
    return currentVelocity * decayFactor;
  };

  /**
   * Calculate new position from velocity
   */
  const updatePosition = (
    currentPos: number,
    currentVelocity: number,
    deltaTime: number
  ): number => {
    const deltaPos = currentVelocity * (deltaTime / 1000); // Convert ms to seconds
    return currentPos + deltaPos;
  };

  /**
   * Check if should transition to snap phase
   *
   * CRITICAL: Only snap when velocity is low. Do NOT check distance threshold
   * while velocity is high, as this causes premature snapping when passing
   * near snap points, resulting in "go past then back" bounce-back behavior.
   */
  const shouldSnap = (
    currentPos: number,
    currentVelocity: number
  ): {
    should: boolean;
    reason?: string;
  } => {
    const absVelocity = Math.abs(currentVelocity);

    // Primary condition: Snap when velocity has decayed sufficiently
    if (absVelocity < config.snapVelocityThreshold) {
      return { should: true, reason: 'velocity threshold' };
    }

    // REMOVED: Distance threshold check
    // Previous bug: Checked distance every frame, causing snap while moving fast
    // Example: Moving at -800 px/s, pass within 5px of snap point → premature snap → bounce
    // Fix: Let friction run its course, only snap when velocity is naturally low

    return { should: false };
  };

  /**
   * Friction animation loop (Uncle Bob: single responsibility, small functions)
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

    // Apply friction decay
    velocity = applyFriction(velocity, deltaTime);

    // Calculate new position
    const currentPos = control.get();
    let newPos = updatePosition(currentPos, velocity, deltaTime);

    // Check boundary collision (iOS: momentum stops at boundaries, no overscroll)
    const { hitBoundary, clampedPosition } = checkBoundary(newPos);
    if (hitBoundary) {
      // Clamp to boundary
      control.set(clampedPosition);
      // Zero velocity - iOS behavior: momentum stops at edges
      velocity = 0;
      // Immediately snap to nearest item
      debugPickerLog('BOUNDARY → SNAP', {
        clampedPosition: clampedPosition.toFixed(1),
        totalTime: totalTime.toFixed(0) + 'ms',
      });
      transitionToSnap();
      return;
    }

    // Update position
    control.set(newPos);

    debugPickerLog('FRICTION TICK', {
      deltaTime: deltaTime.toFixed(1) + 'ms',
      velocity: velocity.toFixed(1) + ' px/s',
      position: newPos.toFixed(1),
    });

    // Check if should transition to snap
    const snapCheck = shouldSnap(newPos, velocity);
    if (snapCheck.should) {
      const snapTarget = snapFunction(newPos);
      const distanceToSnap = Math.abs(newPos - snapTarget);
      debugPickerLog('FRICTION → SNAP TRANSITION', {
        reason: snapCheck.reason,
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
   *
   * Note: We do NOT pass velocity to the spring to avoid overshoot and bounce.
   * The friction phase provides the momentum feel. The snap phase should be
   * a smooth, consistent settle - matching the behavior of non-flick releases.
   */
  const transitionToSnap = (): void => {
    if (cancelled) return;

    inFrictionPhase = false;
    const currentPos = control.get();
    const snapTarget = snapFunction(currentPos);
    const distanceToSnap = Math.abs(currentPos - snapTarget);

    debugPickerLog('SNAP SPRING START', {
      from: currentPos.toFixed(1),
      to: snapTarget.toFixed(1),
      distance: distanceToSnap.toFixed(1) + 'px',
      frictionVelocity: velocity.toFixed(1) + ' px/s (not passed to spring)',
      spring: snapSpring,
    });

    // Start spring animation WITHOUT velocity (matches non-flick behavior)
    // Starting with 0 velocity prevents overshoot and bounce
    springControls = animate(control, snapTarget, {
      type: 'spring',
      // velocity: velocity  ← REMOVED: Causes overshoot and bounce
      // Spring starts with 0 velocity for smooth, consistent settle
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
