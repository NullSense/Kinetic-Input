/**
 * Audio feedback adapter for picker interactions
 *
 * Tree-shakeable: This module is only included in the bundle when
 * audio feedback is enabled via the enableAudioFeedback prop.
 *
 * Creates a subtle confirmation chirp using Web Audio API when values
 * are committed (not during scrolling).
 */

export interface AudioAdapter {
  /**
   * Play a confirmation sound (subtle chirp at 920Hz)
   */
  playConfirmation: () => void;

  /**
   * Cleanup audio context and resources
   */
  cleanup: () => void;

  /**
   * Resume audio context if suspended (for user gesture requirements)
   */
  resume: () => Promise<void>;
}

/**
 * Creates an audio feedback adapter using Web Audio API
 *
 * Uses a lazy-initialized AudioContext to avoid Chrome's autoplay
 * restrictions. The context is created on first use and resumed
 * automatically when needed.
 *
 * @returns Audio adapter or null if Web Audio API is not supported
 *
 * @example
 * ```ts
 * const audio = createAudioAdapter();
 * if (audio) {
 *   await audio.resume(); // Resume on user gesture
 *   audio.playConfirmation(); // Play on value commit
 * }
 * ```
 */
export function createAudioAdapter(): AudioAdapter | null {
  // SSR guard
  if (typeof window === 'undefined') {
    return null;
  }

  // Feature detection (Safari uses webkitAudioContext)
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  // Lazy-initialized context (created on first use)
  let audioContext: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (!audioContext) {
      try {
        audioContext = new AudioContextCtor();
      } catch {
        return null;
      }
    }
    return audioContext;
  };

  return {
    playConfirmation: () => {
      const ctx = getContext();
      if (!ctx) return;

      // Resume if suspended (common after page load)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => undefined);
      }

      // Create gain node for volume envelope
      const gain = ctx.createGain();
      gain.gain.value = 0.0001; // Start silent
      gain.connect(ctx.destination);

      // Create triangle wave oscillator (softer than square/sawtooth)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';

      // Schedule volume envelope (quick attack, gentle decay)
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now); // Start
      gain.gain.linearRampToValueAtTime(0.22, now + 0.01); // Attack (10ms)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); // Decay (170ms)

      // 920Hz frequency (pleasant confirmation tone, not annoying)
      osc.frequency.setValueAtTime(920, now);

      // Connect and play
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.2); // Total duration: 200ms

      // Cleanup nodes after playback
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    },

    resume: async () => {
      const ctx = getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // Ignore resume failures (e.g., autoplay policy violations)
        }
      }
    },

    cleanup: () => {
      if (audioContext) {
        try {
          audioContext.close();
        } catch {
          // Ignore close failures
        }
        audioContext = null;
      }
    },
  };
}
