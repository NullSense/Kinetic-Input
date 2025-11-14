/**
 * Feedback adapters for picker interactions
 *
 * This module provides tree-shakeable haptic and audio feedback.
 * When both enableHaptics and enableAudioFeedback are false,
 * the entire feedback system can be removed from the bundle.
 *
 * @module feedback
 */

import { createHapticAdapter, type HapticAdapter } from './haptics';
import { createAudioAdapter, type AudioAdapter } from './audio';

export { createHapticAdapter, type HapticAdapter } from './haptics';
export { createAudioAdapter, type AudioAdapter } from './audio';

export interface FeedbackConfig {
  enableHaptics: boolean;
  enableAudioFeedback: boolean;
}

export interface FeedbackAdapters {
  haptics: ReturnType<typeof createHapticAdapter>;
  audio: ReturnType<typeof createAudioAdapter>;
}

/**
 * Creates feedback adapters based on configuration
 *
 * Tree-shaking optimization: When both flags are false, this function
 * and its dependencies can be eliminated from the production bundle.
 *
 * @param config - Feedback configuration
 * @returns Feedback adapters (null if disabled or unsupported)
 *
 * @example
 * ```ts
 * const adapters = createFeedbackAdapters({
 *   enableHaptics: true,
 *   enableAudioFeedback: true,
 * });
 *
 * if (adapters.haptics) {
 *   adapters.haptics.trigger();
 * }
 *
 * if (adapters.audio) {
 *   adapters.audio.playConfirmation();
 * }
 * ```
 */
export function createFeedbackAdapters(config: FeedbackConfig): FeedbackAdapters {
  // Tree-shaking: These imports are statically analyzable
  // The bundler can remove unused modules in production
  return {
    haptics: config.enableHaptics
      ? createHapticAdapter()
      : null,
    audio: config.enableAudioFeedback
      ? createAudioAdapter()
      : null,
  };
}
