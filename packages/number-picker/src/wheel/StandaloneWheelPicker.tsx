/**
 * @deprecated Use `Picker` instead. StandaloneWheelPicker will be removed in v1.0.0
 *
 * This is a deprecated alias maintained for backward compatibility.
 * The component has been renamed to `Picker` for clarity and simplicity.
 *
 * Migration:
 * ```tsx
 * // Before (deprecated)
 * import StandaloneWheelPicker from '@tensil/kinetic-input/wheel';
 *
 * // After (recommended)
 * import Picker from '@tensil/kinetic-input/wheel';
 * ```
 *
 * @module wheel/StandaloneWheelPicker
 */

import Picker, { type PickerProps } from './Picker';

/**
 * @deprecated Use `PickerProps` instead
 */
export type StandaloneWheelPickerProps = PickerProps;

/**
 * @deprecated Use `Picker` component instead
 *
 * This alias is provided for backward compatibility only.
 * New code should use the `Picker` component directly.
 */
const StandaloneWheelPicker = Picker;

export default StandaloneWheelPicker;
