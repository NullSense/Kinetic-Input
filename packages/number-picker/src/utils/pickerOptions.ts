/**
 * Shared utilities for generating and normalizing picker options.
 * Used by both CollapsibleNumberPicker and StandaloneWheelPicker to eliminate duplication.
 */

import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';
import { DEFAULT_SNAP_PHYSICS } from '../config/physics';
import { countDecimals as countDecimalsUtil, createFormatter as createFormatterUtil } from '../quick/utils';

// ============ Types ============

export interface PickerOption {
  value: string | number;
  label?: string;
  accentColor?: string;
}

export interface NormalizedPickerOption {
  value: string | number;
  label: string;
  key: string;
  accentColor?: string;
}

export interface RangeGenerationOptions {
  min: number;
  max: number;
  step: number;
  /**
   * Optional formatter function. If not provided, uses default decimal-aware formatting.
   */
  formatter?: (value: number) => string;
}

// ============ Range Generation ============

// Re-export utilities from quick/utils for convenience
export const countDecimals = countDecimalsUtil;
const createFormatter = createFormatterUtil;

/**
 * Generates a range of numeric options with decimal-aware precision.
 * Uses integer scaling internally to avoid floating-point errors.
 *
 * @param options - Range configuration
 * @returns Array of normalized options with value, label, and key
 *
 * @example
 * generateRangeOptions({ min: 0, max: 10, step: 2.5 })
 * // Returns: [{ value: 0, label: "0", key: "range-0" }, { value: 2.5, label: "2.5", key: "range-1" }, ...]
 */
export const generateRangeOptions = ({
  min,
  max,
  step,
  formatter,
}: RangeGenerationOptions): NormalizedPickerOption[] => {
  // Handle invalid step
  if (step <= 0) {
    const defaultFormatter = formatter ?? createFormatter(countDecimals(min));
    const label = defaultFormatter(min);
    return [
      {
        key: 'range-0',
        value: min,
        label,
      },
    ];
  }

  // Calculate decimal places for precision
  const decimalPlaces = Math.max(
    countDecimals(step),
    countDecimals(min),
    countDecimals(max),
    0
  );

  const defaultFormatter = formatter ?? createFormatter(decimalPlaces);

  // Use integer scaling to avoid floating-point errors
  const scale = Math.pow(10, decimalPlaces);
  const scaledMin = Math.round(min * scale);
  const scaledMax = Math.round(max * scale);
  const scaledStep = Math.round(step * scale);

  const steps = Math.floor((scaledMax - scaledMin) / scaledStep) + 1;
  const options: NormalizedPickerOption[] = [];

  for (let i = 0; i < steps; i++) {
    const scaledValue = scaledMin + i * scaledStep;
    const actualValue = scaledValue / scale;
    const label = defaultFormatter(actualValue);

    options.push({
      key: `range-${i}`,
      value: actualValue,
      label,
    });
  }

  return options;
};

// ============ Option Normalization ============

/**
 * Normalizes an array of picker options, ensuring each has a label and unique key.
 * Falls back to value.toString() for missing labels.
 *
 * @param options - Array of raw picker options
 * @returns Array of normalized options with guaranteed label and key
 *
 * @example
 * normalizeOptions([{ value: 1 }, { value: 2, label: "Two" }])
 * // Returns: [{ value: 1, label: "1", key: "opt-0-1" }, { value: 2, label: "Two", key: "opt-1-2" }]
 */
export const normalizeOptions = (
  options: PickerOption[]
): NormalizedPickerOption[] =>
  options.map((option, index) => ({
    ...option,
    label: option.label ?? option.value.toString(),
    key: `opt-${index}-${option.value}`,
  }));

// ============ Snap Physics Configuration ============

/**
 * Merges user-provided snap physics config with defaults.
 *
 * @param enabled - Whether snap physics should be enabled
 * @param config - Partial configuration to merge with defaults
 * @returns Complete snap physics config or undefined if disabled
 *
 * @example
 * mergeSnapConfig(true, { snapRange: 2.0 })
 * // Returns: { ...DEFAULT_SNAP_PHYSICS, snapRange: 2.0, enabled: true }
 */
export const mergeSnapConfig = (
  enabled: boolean,
  config?: Partial<SnapPhysicsConfig>
): SnapPhysicsConfig | undefined => {
  if (!enabled) {
    return undefined;
  }

  return {
    ...DEFAULT_SNAP_PHYSICS,
    ...(config ?? {}),
    enabled: true,
  };
};
