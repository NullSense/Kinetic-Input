import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardControls } from '../useKeyboardControls';

const createGestureRef = <T,>(initial: T) => ({ current: initial });

const createMachineMock = () => ({
    handlePointerDown: vi.fn(),
    handlePointerUp: vi.fn(),
    handleMomentumEnd: vi.fn(),
    resetIdleTimer: vi.fn(),
});

const baseValues = ['1', '2', '3', '4', '5'];

const createEvent = (key: string): React.KeyboardEvent<HTMLDivElement> => ({
    key,
    defaultPrevented: false,
    preventDefault: vi.fn(),
} as unknown as React.KeyboardEvent<HTMLDivElement>);

describe('useKeyboardControls', () => {
    it('advances selection with ArrowDown when picker is open', () => {
        const handleValueChange = vi.fn();
        const machine = createMachineMock();
        const openedViaRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const gestureRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const openingRef = createGestureRef(false);

        const { result } = renderHook(() =>
            useKeyboardControls({
                showPicker: true,
                totalValues: baseValues.length,
                values: baseValues,
                selectedIndex: 0,
                selectedValue: { value: '1' },
                handlePickerOpen: vi.fn(),
                handlePickerClose: vi.fn(),
                handleValueChange,
                openedViaRef,
                currentGestureSource: gestureRef,
                isOpeningInteraction: openingRef,
                stateMachine: machine,
            })
        );

        act(() => result.current.handleKeyDown(createEvent('ArrowDown')));

        expect(handleValueChange).toHaveBeenCalledWith({ value: '2' });
        expect(machine.handlePointerDown).toHaveBeenCalled();
        expect(machine.handlePointerUp).toHaveBeenCalled();
        expect(machine.handleMomentumEnd).toHaveBeenCalledWith(false);
        expect(machine.resetIdleTimer).toHaveBeenCalled();
    });

    it('opens picker on ArrowDown when closed and skips commit', () => {
        const handleValueChange = vi.fn();
        const handlePickerOpen = vi.fn();
        const machine = createMachineMock();
        const openedViaRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const gestureRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const openingRef = createGestureRef(false);

        const { result } = renderHook(() =>
            useKeyboardControls({
                showPicker: false,
                totalValues: baseValues.length,
                values: baseValues,
                selectedIndex: 0,
                selectedValue: { value: '1' },
                handlePickerOpen,
                handlePickerClose: vi.fn(),
                handleValueChange,
                openedViaRef,
                currentGestureSource: gestureRef,
                isOpeningInteraction: openingRef,
                stateMachine: machine,
            })
        );

        act(() => result.current.handleKeyDown(createEvent('ArrowDown')));

        expect(handlePickerOpen).toHaveBeenCalled();
        expect(handleValueChange).not.toHaveBeenCalled();
        expect(openedViaRef.current).toBe('keyboard');
    });

    it('toggles picker with space key', () => {
        const handlePickerOpen = vi.fn();
        const handlePickerClose = vi.fn();
        const machine = createMachineMock();
        const openedViaRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const gestureRef = createGestureRef<'pointer' | 'wheel' | 'keyboard' | null>(null);
        const openingRef = createGestureRef(false);

        const { result, rerender } = renderHook(({ showPicker }: { showPicker: boolean }) =>
            useKeyboardControls({
                showPicker,
                totalValues: baseValues.length,
                values: baseValues,
                selectedIndex: 0,
                selectedValue: { value: '1' },
                handlePickerOpen,
                handlePickerClose,
                handleValueChange: vi.fn(),
                openedViaRef,
                currentGestureSource: gestureRef,
                isOpeningInteraction: openingRef,
                stateMachine: machine,
            })
        , { initialProps: { showPicker: false } });

        act(() => result.current.handleKeyDown(createEvent(' ')));
        expect(handlePickerOpen).toHaveBeenCalled();

        rerender({ showPicker: true });
        act(() => result.current.handleKeyDown(createEvent(' ')));
        expect(handlePickerClose).toHaveBeenCalledWith('keyboard-toggle');
    });
});
