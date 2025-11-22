import { useCallback, type MutableRefObject } from 'react';
import { useKeyboardControls } from './useKeyboardControls';
import type { usePickerStateMachine } from './usePickerStateMachine.xstate';

type GestureSource = 'pointer' | 'wheel' | 'keyboard';

type PickerMachineApi = Pick<
  ReturnType<typeof usePickerStateMachine>,
  'handlePointerDown' | 'handlePointerUp' | 'handleMomentumEnd' | 'resetIdleTimer'
>;

interface UseQuickNumberControllersParams {
  showPicker: boolean;
  totalValues: number;
  values: string[];
  selectedIndex: number;
  selectedValue: { value: string };
  handlePickerOpen: () => void;
  handlePickerClose: (reason?: string) => void;
  handleValueChange: (newValue: { value: string }) => void;
  openedViaRef: MutableRefObject<GestureSource | null>;
  currentGestureSource: MutableRefObject<GestureSource | null>;
  isOpeningInteraction: MutableRefObject<boolean>;
  stateMachine: PickerMachineApi;
  lastValue?: number;
  onChange: (value: number) => void;
}

/**
 * Bundles keyboard controls and last-value shortcut wiring for the quick picker.
 * @param {object} params - Picker visibility, counts, and callbacks.
 * @returns {UseQuickNumberControllersResult} Handlers for keydown and revert actions.
 */
export function useQuickNumberControllers({
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
  lastValue,
  onChange,
}: UseQuickNumberControllersParams) {
  const { handleKeyDown } = useKeyboardControls({
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
  });

  const handleUseLastValue = useCallback(() => {
    if (typeof lastValue === 'number') {
      onChange(lastValue);
    }
  }, [lastValue, onChange]);

  return { handleKeyDown, handleUseLastValue };
}

export type UseQuickNumberControllersResult = ReturnType<typeof useQuickNumberControllers>;
