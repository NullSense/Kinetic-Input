import React from 'react';
import CollapsiblePicker from './CollapsiblePicker';
import type { CollapsiblePickerProps } from './types';
import { DEFAULT_THEME } from './theme';
import { getRecommendedTiming } from '../config/timing';

/**
 * Themed CollapsiblePicker with consistent styling
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
const ThemedNumberInput: React.FC<CollapsiblePickerProps> = (props) => {
  // Auto-detect optimal timing based on device and accessibility preferences
  const defaultTiming = getRecommendedTiming();

  return (
    <CollapsiblePicker
      theme={DEFAULT_THEME}
      timingPreset={defaultTiming}
      {...props} // Component-specific overrides take precedence
    />
  );
};

export default ThemedNumberInput;
