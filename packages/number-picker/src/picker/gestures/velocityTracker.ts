/**
 * Velocity tracking for momentum-based gestures
 *
 * Tracks velocity over time to enable smooth momentum scrolling
 * and snap physics calculations.
 *
 * @module gestures/velocityTracker
 */

export interface VelocityTrackerConfig {
  /**
   * Number of recent samples to keep for velocity calculation
   * Higher = smoother but less responsive
   * @default 8 (increased for mobile accuracy)
   */
  sampleCount?: number;

  /**
   * Maximum age of samples to include in calculation (milliseconds)
   * Older samples are discarded
   * @default 150 (increased for mobile touch sampling)
   */
  maxSampleAge?: number;
}

interface VelocitySample {
  position: number;
  timestamp: number;
}

/**
 * Creates a velocity tracker
 *
 * @param config - Configuration options
 * @returns Velocity tracker instance
 *
 * @example
 * ```ts
 * const tracker = createVelocityTracker();
 *
 * // On pointer move
 * tracker.addSample(event.clientY);
 *
 * // On pointer up
 * const velocity = tracker.getVelocity(); // pixels/second
 * console.log(`Flick velocity: ${velocity}`);
 * ```
 */
export function createVelocityTracker(config: VelocityTrackerConfig = {}) {
  const { sampleCount = 8, maxSampleAge = 150 } = config; // Increased for mobile

  const samples: VelocitySample[] = [];

  /**
   * Add a position sample at the current timestamp
   */
  const addSample = (position: number, timestamp: number = Date.now()) => {
    samples.push({ position, timestamp });

    // Keep only recent samples
    if (samples.length > sampleCount) {
      samples.shift();
    }
  };

  /**
   * Calculate current velocity in pixels/second
   *
   * Uses linear regression over recent samples for smooth, accurate results
   */
  const getVelocity = (): number => {
    if (samples.length < 2) {
      return 0;
    }

    const now = Date.now();

    // Filter out stale samples
    const recentSamples = samples.filter(
      (sample) => now - sample.timestamp <= maxSampleAge
    );

    if (recentSamples.length < 2) {
      return 0;
    }

    // Use linear regression for better noise resistance
    const n = recentSamples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    recentSamples.forEach((sample) => {
      const x = sample.timestamp;
      const y = sample.position;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const denominator = n * sumX2 - sumX * sumX;

    if (denominator === 0) {
      return 0;
    }

    // Slope of regression line = velocity in pixels/millisecond
    const slope = (n * sumXY - sumX * sumY) / denominator;

    // Convert from px/ms to px/s
    return slope * 1000;
  };

  /**
   * Reset the tracker (clear all samples)
   */
  const reset = () => {
    samples.length = 0;
  };

  /**
   * Get the number of samples currently stored
   */
  const getSampleCount = () => samples.length;

  return {
    addSample,
    getVelocity,
    reset,
    getSampleCount,
  };
}
