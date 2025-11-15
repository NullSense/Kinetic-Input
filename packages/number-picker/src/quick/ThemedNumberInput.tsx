import React from 'react';
import CollapsibleNumberPicker from './CollapsibleNumberPicker';
import type { CollapsibleNumberPickerProps } from './types';
import { DEFAULT_THEME } from './theme';
import { getRecommendedTiming } from '../config/timing';

/**
 * Themed CollapsibleNumberPicker with consistent styling
 *
 * Uses app-wide defaults for theme and timing while allowing per-component overrides.
 * This is the recommended component for most use cases.
 *
 * @example
 * ```tsx
 * <ThemedNumberInput
 *   label="Weight"
 *   value={weight}
 *   onChange={setWeight}
 *   unit="kg"
 * />
 * ```
 */
const ThemedNumberInput: React.FC<CollapsibleNumberPickerProps> = (props) => {
  // Auto-detect optimal timing based on device and accessibility preferences
  const defaultTiming = getRecommendedTiming();

  return (
    <CollapsibleNumberPicker
      theme={DEFAULT_THEME}
      timingPreset={defaultTiming}
      {...props} // Component-specific overrides take precedence
    />
  );
};

export default ThemedNumberInput;
