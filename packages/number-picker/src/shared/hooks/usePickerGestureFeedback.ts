/**
 * Shared gesture-to-feedback mapping hook
 *
 * Single Responsibility: Convert picker gesture events into feedback actions
 * Open/Closed: Extensible via FeedbackAdapters interface
 * Dependency Inversion: Depends on FeedbackAdapters abstraction
 *
 * Eliminates duplication between Picker and CollapsiblePicker
 *
 * @module shared/hooks/usePickerGestureFeedback
 */

import { useCallback, useRef } from 'react';
import type { PickerGestureHandler } from '../../picker/gestures';
import type { FeedbackAdapters } from '../../quick/feedback';

/**
 * Creates a gesture handler that triggers appropriate feedback
 *
 * Handles:
 * - Haptic feedback on visual value changes (light)
 * - Stronger haptic on momentum settle (completion feedback)
 * - Audio confirmation on value commit
 *
 * @param adapters - Feedback adapters (haptics, audio)
 * @returns Gesture event handler function
 *
 * @example
 * ```tsx
 * const adapters = createFeedbackAdapters({ enableHaptics: true });
 * const handleGesture = usePickerGestureFeedback(adapters);
 *
 * <Picker.Column onGesture={handleGesture} />
 * ```
 */
export function usePickerGestureFeedback(adapters: FeedbackAdapters): PickerGestureHandler {
  // Track last haptic value to avoid duplicate vibrations on same value
  const lastHapticValueRef = useRef<string | number | null>(null);

  return useCallback(
    (event) => {
      switch (event.type) {
        case 'value:visual': {
          // Trigger light haptic on each scroll step
          const next = String(event.value);
          if (next !== lastHapticValueRef.current) {
            lastHapticValueRef.current = next;
            adapters.haptics?.trigger(false); // Regular scroll haptic
          }
          break;
        }

        case 'value:settle': {
          // Trigger stronger haptic when picker settles after momentum
          // Only for momentum settles (flicking), not direct snaps (tap/keyboard)
          if (event.hadMomentum) {
            const next = String(event.value);
            if (next !== lastHapticValueRef.current) {
              lastHapticValueRef.current = next;
              adapters.haptics?.trigger(true); // Settle haptic (stronger)
            }
          }
          break;
        }

        case 'value:commit': {
          // Play audio confirmation when value is committed
          adapters.audio?.playConfirmation();
          break;
        }

        // Other events (drag:start, drag:end, boundary:hit) don't trigger feedback
        default:
          break;
      }
    },
    [adapters]
  );
}
