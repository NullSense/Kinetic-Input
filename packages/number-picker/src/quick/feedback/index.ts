/**
 * Feedback adapters for picker interactions
 *
 * This module provides tree-shakeable haptic and audio feedback.
 * When both enableHaptics and enableAudioFeedback are false,
 * the entire feedback system can be removed from the bundle.
 *
 * @module feedback
 */

import {
  createHapticAdapter,
  type HapticAdapter,
  type HapticAdapterOptions,
} from './haptics';
import {
  createAudioAdapter,
  type AudioAdapter,
  type AudioAdapterOptions,
} from './audio';

export { createHapticAdapter, type HapticAdapter, type HapticAdapterOptions } from './haptics';
export { createAudioAdapter, type AudioAdapter, type AudioAdapterOptions } from './audio';

export interface FeedbackAdapters {
  haptics: ReturnType<typeof createHapticAdapter>;
  audio: ReturnType<typeof createAudioAdapter>;
}

export interface FeedbackAdapterOverrides {
  haptics?: HapticAdapter | null;
  audio?: AudioAdapter | null;
}

export interface FeedbackConfig {
  enableHaptics: boolean;
  enableAudioFeedback: boolean;
  hapticsOptions?: HapticAdapterOptions;
  audioOptions?: AudioAdapterOptions;
  adapters?: FeedbackAdapterOverrides;
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
  const resolvedHaptics =
    config.adapters?.haptics !== undefined
      ? config.adapters.haptics
      : config.enableHaptics
        ? createHapticAdapter(config.hapticsOptions)
        : null;

  const resolvedAudio =
    config.adapters?.audio !== undefined
      ? config.adapters.audio
      : config.enableAudioFeedback
        ? createAudioAdapter(config.audioOptions)
        : null;

  return {
    haptics: resolvedHaptics,
    audio: resolvedAudio,
  };
}
