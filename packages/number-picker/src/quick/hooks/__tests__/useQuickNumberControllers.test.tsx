import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQuickNumberControllers } from '../useQuickNumberControllers';
import * as keyboardModule from '../useKeyboardControls';

describe('useQuickNumberControllers', () => {
    const handlePickerOpen = vi.fn();
    const handlePickerClose = vi.fn();
    const handleValueChange = vi.fn();
    const openedViaRef = { current: null } as any;
    const currentGestureSource = { current: null } as any;
    const isOpeningInteraction = { current: false } as any;
    const stateMachine = {
        handlePointerDown: vi.fn(),
        handlePointerUp: vi.fn(),
        handleMomentumEnd: vi.fn(),
        resetIdleTimer: vi.fn(),
    } as any;

    beforeEach(() => {
        vi.spyOn(keyboardModule, 'useKeyboardControls').mockReturnValue({
            handleKeyDown: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        handlePickerOpen.mockReset();
        handlePickerClose.mockReset();
        handleValueChange.mockReset();
    });

    it('exposes handleKeyDown from useKeyboardControls', () => {
        const { result } = renderHook(() =>
            useQuickNumberControllers({
                showPicker: false,
                totalValues: 3,
                values: ['1', '2', '3'],
                selectedIndex: 0,
                selectedValue: { value: '1' },
                handlePickerOpen,
                handlePickerClose,
                handleValueChange,
                openedViaRef,
                currentGestureSource,
                isOpeningInteraction,
                stateMachine,
                lastValue: undefined,
                onChange: vi.fn(),
            })
        );

        expect(result.current.handleKeyDown).toBeDefined();
        expect(keyboardModule.useKeyboardControls).toHaveBeenCalledWith({
            showPicker: false,
            totalValues: 3,
            values: ['1', '2', '3'],
            selectedIndex: 0,
            selectedValue: { value: '1' },
            handlePickerOpen,
            handlePickerClose,
            handleValueChange,
            openedViaRef,
            currentGestureSource,
            isOpeningInteraction,
            stateMachine,
        });
    });

    it('commits last value when available', () => {
        const onChange = vi.fn();
        const { result, rerender } = renderHook(
            (props: { lastValue?: number }) =>
                useQuickNumberControllers({
                    showPicker: false,
                    totalValues: 3,
                    values: ['1', '2', '3'],
                    selectedIndex: 0,
                    selectedValue: { value: '1' },
                    handlePickerOpen,
                    handlePickerClose,
                    handleValueChange,
                    openedViaRef,
                    currentGestureSource,
                    isOpeningInteraction,
                    stateMachine,
                    lastValue: props.lastValue,
                    onChange,
                }),
            { initialProps: { lastValue: 42 } }
        );

        act(() => {
            result.current.handleUseLastValue();
        });

        expect(onChange).toHaveBeenCalledWith(42);

        rerender({ lastValue: undefined });
        act(() => {
            result.current.handleUseLastValue();
        });

        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
