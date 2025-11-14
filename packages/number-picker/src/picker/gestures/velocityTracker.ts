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
   * @default 5
   */
  sampleCount?: number;

  /**
   * Maximum age of samples to include in calculation (milliseconds)
   * Older samples are discarded
   * @default 100
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
  const { sampleCount = 5, maxSampleAge = 100 } = config;

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
   * Uses linear regression over recent samples for smooth results
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

    // Calculate velocity using first and last recent samples
    const first = recentSamples[0];
    const last = recentSamples[recentSamples.length - 1];

    const deltaPosition = last.position - first.position;
    const deltaTime = (last.timestamp - first.timestamp) / 1000; // Convert to seconds

    if (deltaTime === 0) {
      return 0;
    }

    return deltaPosition / deltaTime; // pixels/second
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
