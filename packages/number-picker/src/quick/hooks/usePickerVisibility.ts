import { useCallback, useMemo, useState } from 'react';

interface PickerVisibilityOptions {
  controlledIsOpen?: boolean;
  onRequestOpen?: () => void;
  onRequestClose?: () => void;
}

interface PickerVisibilityResult {
  showPicker: boolean;
  isControlled: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

/**
 * Provides a consistent open/close API whether the picker is controlled or uncontrolled.
 * @param {PickerVisibilityOptions} options
 * @returns {PickerVisibilityResult}
 */
export const usePickerVisibility = ({
  controlledIsOpen,
  onRequestOpen,
  onRequestClose,
}: PickerVisibilityOptions): PickerVisibilityResult => {
  const isControlled = controlledIsOpen !== undefined;
  const [internalShowPicker, setInternalShowPicker] = useState(false);

  const openPicker = useCallback(() => {
    if (isControlled) {
      onRequestOpen?.();
    } else {
      setInternalShowPicker(true);
    }
  }, [isControlled, onRequestOpen]);

  const closePicker = useCallback(() => {
    if (isControlled) {
      onRequestClose?.();
    } else {
      setInternalShowPicker(false);
    }
  }, [isControlled, onRequestClose]);

  const showPicker = useMemo(
    () => (isControlled ? Boolean(controlledIsOpen) : internalShowPicker),
    [controlledIsOpen, internalShowPicker, isControlled]
  );

  return {
    showPicker,
    isControlled,
    openPicker,
    closePicker,
  };
};
