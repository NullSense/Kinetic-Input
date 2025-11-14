import { useCallback, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import type { usePickerStateMachine } from './usePickerStateMachine.xstate';

type KeyboardGestureSource = 'pointer' | 'wheel' | 'keyboard';

interface KeyboardRefs {
    openedViaRef: MutableRefObject<KeyboardGestureSource | null>;
    currentGestureSource: MutableRefObject<KeyboardGestureSource | null>;
    isOpeningInteraction: MutableRefObject<boolean>;
}

type PickerMachineApi = Pick<
    ReturnType<typeof usePickerStateMachine>,
    'handlePointerDown' | 'handlePointerUp' | 'handleMomentumEnd' | 'resetIdleTimer'
>;

interface UseKeyboardControlsParams extends KeyboardRefs {
    showPicker: boolean;
    totalValues: number;
    values: string[];
    selectedIndex: number;
    selectedValue: { value: string };
    handlePickerOpen: () => void;
    handlePickerClose: (reason?: string) => void;
    handleValueChange: (newValue: { value: string }) => void;
    stateMachine: PickerMachineApi;
}

const clampIndex = (index: number, totalValues: number) => {
    if (totalValues === 0) {
        return 0;
    }
    return Math.max(0, Math.min(totalValues - 1, index));
};

/**
 * Implements the spinbutton keyboard contract for the quick picker, handling arrows, paging, and toggles.
 * @param {object} params - Picker visibility, value bounds, and callbacks.
 * @returns {UseKeyboardControlsResult}
 */
export const useKeyboardControls = ({
    showPicker,
    totalValues,
    values,
    selectedIndex,
    selectedValue,
    handlePickerOpen,
    handlePickerClose,
    handleValueChange,
    openedViaRef,
    currentGestureSource,
    isOpeningInteraction,
    stateMachine,
}: UseKeyboardControlsParams) => {
    const pageJump = useMemo(
        () => Math.max(1, Math.min(10, Math.floor(totalValues / 5) || 1)),
        [totalValues]
    );

    const ensureOpenForKeyboard = useCallback(() => {
        if (showPicker) {
            if (currentGestureSource.current !== 'wheel') {
                currentGestureSource.current = 'keyboard';
            }
            return true;
        }
        openedViaRef.current = 'keyboard';
        currentGestureSource.current = 'keyboard';
        isOpeningInteraction.current = false;
        handlePickerOpen();
        return false;
    }, [currentGestureSource, handlePickerOpen, isOpeningInteraction, openedViaRef, showPicker]);

    const commitIndexChange = useCallback(
        (nextIndex: number) => {
            if (!showPicker || totalValues === 0) {
                return false;
            }
            const clamped = clampIndex(nextIndex, totalValues);
            const formatted = values[clamped];
            if (formatted === selectedValue.value) {
                return false;
            }
            if (!openedViaRef.current) {
                openedViaRef.current = 'keyboard';
            }
            currentGestureSource.current = 'keyboard';
            handleValueChange({ value: formatted });
            stateMachine.handlePointerDown();
            stateMachine.handlePointerUp();
            stateMachine.handleMomentumEnd(false);
            stateMachine.resetIdleTimer();
            return true;
        },
        [
            currentGestureSource,
            handleValueChange,
            openedViaRef,
            selectedValue.value,
            showPicker,
            stateMachine,
            totalValues,
            values,
        ]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.defaultPrevented) {
                return;
            }

            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(selectedIndex + 1);
                    break;
                }
                case 'ArrowUp':
                case 'ArrowLeft': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(selectedIndex - 1);
                    break;
                }
                case 'PageDown': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(selectedIndex + pageJump);
                    break;
                }
                case 'PageUp': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(selectedIndex - pageJump);
                    break;
                }
                case 'Home': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(0);
                    break;
                }
                case 'End': {
                    event.preventDefault();
                    if (!ensureOpenForKeyboard()) return;
                    commitIndexChange(totalValues - 1);
                    break;
                }
                case 'Enter':
                case ' ': {
                    event.preventDefault();
                    if (showPicker) {
                        handlePickerClose('keyboard-toggle');
                    } else {
                        openedViaRef.current = 'keyboard';
                        currentGestureSource.current = 'keyboard';
                        isOpeningInteraction.current = false;
                        handlePickerOpen();
                    }
                    break;
                }
                default:
                    break;
            }
        },
        [
            commitIndexChange,
            currentGestureSource,
            ensureOpenForKeyboard,
            handlePickerClose,
            handlePickerOpen,
            isOpeningInteraction,
            openedViaRef,
            pageJump,
            selectedIndex,
            showPicker,
            totalValues,
        ]
    );

    return { handleKeyDown };
};

export type UseKeyboardControlsResult = ReturnType<typeof useKeyboardControls>;
