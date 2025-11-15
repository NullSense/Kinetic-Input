import { useCallback, useEffect, useMemo, useRef } from 'react';
import { debugLog } from '../../utils/debug';
import { createFeedbackAdapters, type FeedbackAdapters } from '../feedback';
import type { QuickPickerFeedbackConfig } from '../types';

type PickerValue = { value: string };

type UsePickerFeedbackArgs = {
    enableHaptics: boolean;
    enableAudioFeedback: boolean;
    showPicker: boolean;
    selectedValue: PickerValue;
    setSelectedValue: (value: PickerValue) => void;
    onChange: (value: number) => void;
    feedbackOverrides?: QuickPickerFeedbackConfig;
};

/**
 * Drives vibration and confirmation audio for picker interactions.
 *
 * Tree-shaking optimization: Feedback adapters are only loaded when enabled.
 * If both enableHaptics and enableAudioFeedback are false, the entire
 * feedback system can be eliminated from the production bundle.
 *
 * @param {UsePickerFeedbackArgs} args
 * @returns {{ handleVisualValueChange: Function, handleValueChange: Function }} Feedback handlers.
 */
export const usePickerFeedback = ({
    enableHaptics,
    enableAudioFeedback,
    showPicker,
    selectedValue,
    setSelectedValue,
    onChange,
    feedbackOverrides,
}: UsePickerFeedbackArgs) => {
    // Create feedback adapters (memoized to avoid recreating on every render)
    const adapters = useMemo<FeedbackAdapters>(
        () =>
            createFeedbackAdapters({
                enableHaptics,
                enableAudioFeedback,
                hapticsOptions: feedbackOverrides?.haptics,
                audioOptions: feedbackOverrides?.audio,
                adapters: feedbackOverrides?.adapters,
            }),
        [
            enableHaptics,
            enableAudioFeedback,
            feedbackOverrides?.adapters,
            feedbackOverrides?.audio,
            feedbackOverrides?.haptics,
        ]
    );

    // Track state for haptic feedback (avoid duplicate vibrations)
    const lastHapticValueRef = useRef<string | null>(null);

    // Track whether the value changed during this picker session
    const sessionValueChangedRef = useRef(false);
    const prevShowPickerRef = useRef(showPicker);
    const lastCommittedValueRef = useRef<string>(selectedValue.value);
    const initialValueOnOpenRef = useRef<string>(selectedValue.value);
    const lastVisualValueRef = useRef<string | null>(null);

    // Initialize refs on mount
    useEffect(() => {
        if (lastHapticValueRef.current === null) {
            lastHapticValueRef.current = selectedValue.value;
        }
        lastCommittedValueRef.current = selectedValue.value;
    }, [selectedValue.value]);

    // Trigger haptic feedback on value scroll
    const triggerHaptics = useCallback(() => {
        adapters.haptics?.trigger();
    }, [adapters.haptics]);

    // Trigger audio confirmation on value commit
    const triggerConfirmationAudio = useCallback(() => {
        adapters.audio?.playConfirmation();
    }, [adapters.audio]);

    // Track picker open/close state for session management
    useEffect(() => {
        const prev = prevShowPickerRef.current;
        if (!prev && showPicker) {
            // Picker opening - reset session tracking and capture initial value
            sessionValueChangedRef.current = false;
            initialValueOnOpenRef.current = selectedValue.value;
            lastVisualValueRef.current = null;
        }
        prevShowPickerRef.current = showPicker;
    }, [showPicker, selectedValue.value]);

    // Handle visual value changes (scrolling) - triggers haptics
    const handleVisualValueChange = useCallback(
        (value: string | number) => {
            const next = String(value);
            // Track visual value for audio confirmation on close
            lastVisualValueRef.current = next;

            if (next !== lastHapticValueRef.current) {
                lastHapticValueRef.current = next;
                triggerHaptics();
            }
        },
        [triggerHaptics]
    );

    // Handle committed value changes - track changes, but don't play audio yet
    // Audio is played when picker closes (see useEffect above)
    const handleValueChange = useCallback(
        (newValue: PickerValue) => {
            setSelectedValue(newValue);
            const parsed = parseFloat(newValue.value);

            if (!Number.isNaN(parsed)) {
                onChange(parsed);
            }

            // Track that value changed this session, but don't play confirmation yet
            // Confirmation plays when picker closes (avoids sound on open/scroll)
            const valueChanged = newValue.value !== lastCommittedValueRef.current;
            debugLog('handleValueChange', {
                newValue: newValue.value,
                lastCommitted: lastCommittedValueRef.current,
                valueChanged,
                willPlayAudio: valueChanged,
            });

            if (valueChanged) {
                sessionValueChangedRef.current = true;
                lastCommittedValueRef.current = newValue.value;
            }
        },
        [onChange, setSelectedValue]
    );

    // Cleanup adapters on unmount
    useEffect(
        () => () => {
            adapters.audio?.cleanup();
            adapters.haptics?.cleanup();
        },
        [adapters]
    );

    // Cleanup audio context when picker closes (free resources)
    // Delay cleanup to allow confirmation sound to play first
    useEffect(() => {
        if (!showPicker) {
            const timeoutId = setTimeout(() => {
                adapters.audio?.cleanup();
            }, 500); // Wait 500ms for confirmation sound to finish
            return () => clearTimeout(timeoutId);
        }
    }, [showPicker, adapters.audio]);

    // Function to play confirmation if value changed during session
    // Called when picker closes (before animation) for better UX timing
    const playConfirmationIfChanged = useCallback(() => {
        // Check if value changed in any of these ways:
        // 1. Via committed change (sessionValueChangedRef = true) - normal settle flow
        // 2. Via visual change that hasn't committed yet (lastVisualValueRef != initialValueOnOpenRef) - interrupted settle
        // 3. Current value differs from initial (catch-all for edge cases)
        const currentValueDiffersFromInitial = selectedValue.value !== initialValueOnOpenRef.current;
        const visualValueChanged =
            lastVisualValueRef.current !== null &&
            lastVisualValueRef.current !== initialValueOnOpenRef.current;

        const shouldPlayAudio = sessionValueChangedRef.current || visualValueChanged || currentValueDiffersFromInitial;

        debugLog('playConfirmationIfChanged', {
            sessionValueChanged: sessionValueChangedRef.current,
            visualValueChanged,
            currentValueDiffersFromInitial,
            shouldPlayAudio,
            lastVisualValue: lastVisualValueRef.current,
            initialValue: initialValueOnOpenRef.current,
            lastCommittedValue: lastCommittedValueRef.current,
            currentValue: selectedValue.value,
        });

        if (shouldPlayAudio) {
            triggerConfirmationAudio();
        }
        sessionValueChangedRef.current = false;
        lastVisualValueRef.current = null;
    }, [triggerConfirmationAudio, selectedValue.value]);

    return { handleVisualValueChange, handleValueChange, playConfirmationIfChanged };
};

export type { UsePickerFeedbackArgs };
