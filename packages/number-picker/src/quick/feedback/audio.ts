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

export interface AudioAdapterOptions {
  frequency?: number;
  waveform?: OscillatorType;
  attackMs?: number;
  decayMs?: number;
  durationMs?: number;
  peakGain?: number;
}

const DEFAULT_AUDIO_OPTIONS: Required<AudioAdapterOptions> = {
  frequency: 920,
  waveform: 'triangle',
  attackMs: 10,
  decayMs: 170,
  durationMs: 200,
  peakGain: 0.22,
};

/**
 * Creates an audio feedback adapter using Web Audio API
 *
 * Uses a lazy-initialized AudioContext to avoid Chrome's autoplay
 * restrictions. The context is created on first use and resumed
 * automatically when needed.
 *
 * @returns Audio adapter or null if Web Audio API is not supported
 */
export function createAudioAdapter(options: AudioAdapterOptions = {}): AudioAdapter | null {
  // SSR guard
  if (typeof window === 'undefined') {
    return null;
  }

  // Feature detection (Safari uses webkitAudioContext)
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

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

      const resolved = { ...DEFAULT_AUDIO_OPTIONS, ...options };

      // Create gain node for volume envelope
      const gain = ctx.createGain();
      gain.gain.value = 0.0001; // Start silent
      gain.connect(ctx.destination);

      // Create triangle wave oscillator (softer than square/sawtooth)
      const osc = ctx.createOscillator();
      osc.type = resolved.waveform;

      // Schedule volume envelope (quick attack, gentle decay)
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now); // Start
      gain.gain.linearRampToValueAtTime(resolved.peakGain, now + resolved.attackMs / 1000);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + (resolved.attackMs + resolved.decayMs) / 1000
      );

      osc.frequency.setValueAtTime(resolved.frequency, now);

      // Connect and play
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + resolved.durationMs / 1000);

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
