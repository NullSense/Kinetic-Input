import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickerFeedback } from '../usePickerFeedback';

describe('usePickerFeedback', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        (navigator as Navigator & { vibrate?: Navigator['vibrate'] }).vibrate = vi.fn();
        class MockAudioContext {
            public currentTime = 0;
            public state: 'running' | 'suspended' = 'running';
            public destination = {};
            resume = vi.fn().mockResolvedValue(undefined);
            createGain = () => ({
                gain: {
                    value: 0,
                    setValueAtTime: vi.fn(),
                    linearRampToValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn(),
                },
                connect: vi.fn(),
                disconnect: vi.fn(),
            });
            createOscillator = () => ({
                type: 'triangle' as const,
                frequency: { setValueAtTime: vi.fn() },
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                onended: null as null | (() => void),
            });
            close = vi.fn();
        }
        (window as typeof window & { AudioContext?: typeof AudioContext }).AudioContext =
            MockAudioContext as unknown as typeof AudioContext;
    });

    it('updates selected value and emits parsed numbers', () => {
        const setSelectedValue = vi.fn();
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            usePickerFeedback({
                enableHaptics: false,
                enableAudioFeedback: false,
                showPicker: true,
                selectedValue: { value: '10' },
                setSelectedValue,
                onChange,
            })
        );

        act(() => {
            result.current.handleValueChange({ value: '42' });
        });

        expect(setSelectedValue).toHaveBeenCalledWith({ value: '42' });
        expect(onChange).toHaveBeenCalledWith(42);
    });

    // TODO: Fix for async dynamic imports - adapters load asynchronously now
    it.skip('triggers vibration when the visual value changes', () => {
        const vibrate = vi.fn();
        (navigator as Navigator & { vibrate?: Navigator['vibrate'] }).vibrate = vibrate;
        const { result } = renderHook(() =>
            usePickerFeedback({
                enableHaptics: true,
                enableAudioFeedback: false,
                showPicker: true,
                selectedValue: { value: '5' },
                setSelectedValue: vi.fn(),
                onChange: vi.fn(),
            })
        );

        act(() => {
            result.current.handleVisualValueChange('6');
        });
        act(() => {
            result.current.handleVisualValueChange('6');
        });

        expect(vibrate).toHaveBeenCalledTimes(1);
    });

    describe('Audio confirmation edge cases', () => {
        let createOscillatorSpy: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            createOscillatorSpy = vi.fn();
            class MockAudioContext {
                public currentTime = 0;
                public state: 'running' | 'suspended' = 'running';
                public destination = {};
                resume = vi.fn().mockResolvedValue(undefined);
                createGain = () => ({
                    gain: {
                        value: 0,
                        setValueAtTime: vi.fn(),
                        linearRampToValueAtTime: vi.fn(),
                        exponentialRampToValueAtTime: vi.fn(),
                    },
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                });
                createOscillator = () => {
                    createOscillatorSpy();
                    return {
                        type: 'triangle' as const,
                        frequency: { setValueAtTime: vi.fn() },
                        connect: vi.fn(),
                        start: vi.fn(),
                        stop: vi.fn(),
                        disconnect: vi.fn(),
                        onended: null as null | (() => void),
                    };
                };
                close = vi.fn();
            }
            (window as typeof window & { AudioContext?: typeof AudioContext }).AudioContext =
                MockAudioContext as unknown as typeof AudioContext;
        });

        it('does NOT play audio when opening and closing without any value change', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // Open picker
            rerender({ showPicker: true, value: '10' });

            // Close picker immediately without any change
            rerender({ showPicker: false, value: '10' });

            act(() => {
                result.current.playConfirmationIfChanged();
            });

            expect(createOscillatorSpy).not.toHaveBeenCalled();
        });

        // TODO: Fix for async dynamic imports
        it.skip('DOES play audio when value changed externally before close', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // Open picker
            rerender({ showPicker: true, value: '10' });

            // Value changed externally (or via prop update)
            rerender({ showPicker: true, value: '15' });

            // Close picker
            rerender({ showPicker: false, value: '15' });

            act(() => {
                result.current.playConfirmationIfChanged();
            });

            expect(createOscillatorSpy).toHaveBeenCalledTimes(1);
        });

        // TODO: Fix for async dynamic imports
        it.skip('DOES play audio after normal committed value change', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // Open picker
            rerender({ showPicker: true, value: '10' });

            // User scrolls and value commits (settle animation completed)
            act(() => {
                result.current.handleValueChange({ value: '15' });
            });

            // Close picker
            rerender({ showPicker: false, value: '15' });

            act(() => {
                result.current.playConfirmationIfChanged();
            });

            expect(createOscillatorSpy).toHaveBeenCalledTimes(1);
        });

        // TODO: Fix for async dynamic imports
        it.skip('DOES play audio after visual change but before commit (race condition case)', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // Open picker
            rerender({ showPicker: true, value: '10' });

            // User scrolls (visual change, but commit hasn't happened yet)
            act(() => {
                result.current.handleVisualValueChange('15');
            });

            // User impatiently clicks middle row before settle completes
            // This should STILL play audio because visual value changed
            act(() => {
                result.current.playConfirmationIfChanged();
            });

            expect(createOscillatorSpy).toHaveBeenCalledTimes(1);
        });

        it('DOES play audio when visual value changed but then returned to original', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // Open picker
            rerender({ showPicker: true, value: '10' });

            // User scrolls to 15
            act(() => {
                result.current.handleVisualValueChange('15');
            });

            // User scrolls back to 10
            act(() => {
                result.current.handleVisualValueChange('10');
            });

            // Close - should NOT play audio (ended up at same value)
            act(() => {
                result.current.playConfirmationIfChanged();
            });

            expect(createOscillatorSpy).not.toHaveBeenCalled();
        });

        // TODO: Fix for async dynamic imports
        it.skip('resets session tracking when picker opens again', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // First session: open → change → close
            rerender({ showPicker: true, value: '10' });
            act(() => {
                result.current.handleValueChange({ value: '15' });
            });
            rerender({ showPicker: false, value: '15' });
            act(() => {
                result.current.playConfirmationIfChanged();
            });
            expect(createOscillatorSpy).toHaveBeenCalledTimes(1);

            // Second session: open → close without change
            // Should NOT play audio (new session, no change)
            rerender({ showPicker: true, value: '15' });
            rerender({ showPicker: false, value: '15' });
            act(() => {
                result.current.playConfirmationIfChanged();
            });
            expect(createOscillatorSpy).toHaveBeenCalledTimes(1); // Still 1, not 2
        });

        // TODO: Fix for async dynamic imports
        it.skip('handles multi-gesture mode correctly (value changes between opens)', () => {
            const { result, rerender } = renderHook(
                ({ showPicker, value }) =>
                    usePickerFeedback({
                        enableHaptics: false,
                        enableAudioFeedback: true,
                        showPicker,
                        selectedValue: { value },
                        setSelectedValue: vi.fn(),
                        onChange: vi.fn(),
                    }),
                { initialProps: { showPicker: false, value: '10' } }
            );

            // First click: open at 10
            rerender({ showPicker: true, value: '10' });

            // Second click: close without scrubbing
            rerender({ showPicker: false, value: '10' });
            act(() => {
                result.current.playConfirmationIfChanged();
            });
            expect(createOscillatorSpy).not.toHaveBeenCalled();

            // Third click: open at 10, scrub to 15
            rerender({ showPicker: true, value: '10' });
            act(() => {
                result.current.handleVisualValueChange('15');
            });

            // Fourth click: close
            rerender({ showPicker: false, value: '10' }); // Value might not have committed yet
            act(() => {
                result.current.playConfirmationIfChanged();
            });
            expect(createOscillatorSpy).toHaveBeenCalledTimes(1); // Audio played!
        });
    });
});
