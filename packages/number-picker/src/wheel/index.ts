/**
 * Wheel Picker Module
 *
 * Primary export: `Picker` - Clean, simple name for the main picker component
 * Deprecated: `StandaloneWheelPicker` - Maintained for backward compatibility
 */

// Primary exports (Clean Architecture)
export { default } from './Picker';
export { default as Picker } from './Picker';
export type { PickerProps, PickerOptionType } from './Picker';

// Deprecated exports (Backward Compatibility)
/** @deprecated Use `Picker` instead */
export { default as StandaloneWheelPicker } from './StandaloneWheelPicker';
/** @deprecated Use `PickerProps` instead */
export type { StandaloneWheelPickerProps } from './StandaloneWheelPicker';

// Re-export types for convenience
export type { PickerOption, NormalizedPickerOption } from '../utils/pickerOptions';
