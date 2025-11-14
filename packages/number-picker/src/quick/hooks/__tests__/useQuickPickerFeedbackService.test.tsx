import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useQuickPickerFeedbackService } from '../useQuickPickerFeedbackService';
import { TIMING_PRESETS } from '../../../config/timing';
import { usePickerFeedback } from '../usePickerFeedback';

vi.mock('../usePickerFeedback', () => ({
    usePickerFeedback: vi.fn(() => ({
        handleValueChange: vi.fn(),
        handleVisualValueChange: vi.fn(),
    })),
}));

describe('useQuickPickerFeedbackService', () => {
    const baseArgs = {
        enableHaptics: false,
        enableAudioFeedback: false,
        showPicker: false,
        selectedValue: { value: '0' },
        setSelectedValue: vi.fn(),
        onChange: vi.fn(),
    } as const;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('falls back to the balanced timing preset by default', () => {
        const { result } = renderHook(() => useQuickPickerFeedbackService(baseArgs));
        expect(result.current.timing).toEqual(TIMING_PRESETS.balanced);
    });

    it('prefers an explicit timing config when provided', () => {
        const customTiming = { settleGracePeriod: 1, wheelIdleTimeout: 2, idleTimeout: 3, watchdogTimeout: 4 } as const;
        const { result } = renderHook(() =>
            useQuickPickerFeedbackService({
                ...baseArgs,
                timingConfig: customTiming,
            })
        );

        expect(result.current.timing).toBe(customTiming);
    });

    it('forwards the picker feedback handlers', () => {
        const mockHandlers = {
            handleValueChange: vi.fn(),
            handleVisualValueChange: vi.fn(),
        };
        const mockedUsePickerFeedback = usePickerFeedback as unknown as Mock;
        mockedUsePickerFeedback.mockReturnValueOnce(mockHandlers);

        const { result } = renderHook(() => useQuickPickerFeedbackService(baseArgs));

        expect(result.current.handleValueChange).toBe(mockHandlers.handleValueChange);
        expect(result.current.handleVisualValueChange).toBe(mockHandlers.handleVisualValueChange);
    });
});
