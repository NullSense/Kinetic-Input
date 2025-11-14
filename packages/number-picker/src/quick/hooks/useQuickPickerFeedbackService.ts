import { useMemo } from 'react';
import { TIMING_PRESETS } from '../../config/timing';
import type { TimingConfig, TimingPreset } from '../../config/timing';
import { usePickerFeedback } from './usePickerFeedback';

type PickerValue = { value: string };

interface UseQuickPickerFeedbackServiceArgs {
    enableHaptics: boolean;
    enableAudioFeedback: boolean;
    showPicker: boolean;
    selectedValue: PickerValue;
    setSelectedValue: (value: PickerValue) => void;
    onChange: (value: number) => void;
    timingPreset?: TimingPreset;
    timingConfig?: Readonly<TimingConfig>;
}

/**
 * Centralizes picker timing presets plus haptic/audio triggers for value changes.
 * @param {UseQuickPickerFeedbackServiceArgs} args - Feature flags and callbacks.
 * @returns {{ timing: object, handleVisualValueChange: Function, handleValueChange: Function }} Feedback handlers.
 */
export const useQuickPickerFeedbackService = ({
    enableHaptics,
    enableAudioFeedback,
    showPicker,
    selectedValue,
    setSelectedValue,
    onChange,
    timingConfig,
    timingPreset,
}: UseQuickPickerFeedbackServiceArgs) => {
    const resolvedTiming = useMemo<Readonly<TimingConfig>>(() => {
        if (timingConfig) {
            return timingConfig;
        }
        if (timingPreset) {
            return TIMING_PRESETS[timingPreset];
        }
        return TIMING_PRESETS.balanced;
    }, [timingConfig, timingPreset]);

    const { handleVisualValueChange, handleValueChange, playConfirmationIfChanged } = usePickerFeedback({
        enableHaptics,
        enableAudioFeedback,
        showPicker,
        selectedValue,
        setSelectedValue,
        onChange,
    });

    return {
        timing: resolvedTiming,
        handleVisualValueChange,
        handleValueChange,
        playConfirmationIfChanged,
    };
};

export type { UseQuickPickerFeedbackServiceArgs };
