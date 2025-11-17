import React, { useMemo, useCallback, type CSSProperties } from 'react';
import PickerGroup, { type PickerOption as PickerGroupOption } from '../picker';
import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';
import {
  generateRangeOptions,
  normalizeOptions,
  mergeSnapConfig,
  type PickerOption,
  type NormalizedPickerOption,
} from '../utils/pickerOptions';

// Shared empty props object to avoid allocations for large datasets
const EMPTY_PROPS = {};

export interface StandaloneWheelPickerProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options?: PickerOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  visibleItems?: number;
  itemHeight?: number;
  className?: string;
  accentColor?: string;
  highlightColor?: string;
  enableSnapPhysics?: boolean;
  snapPhysicsConfig?: Partial<SnapPhysicsConfig>;
  wheelSensitivity?: number;
  wheelDeltaCap?: number;
  renderItem?: (
    option: NormalizedPickerOption,
    state: { selected: boolean; visuallySelected: boolean }
  ) => React.ReactNode;
}

// Re-export PickerOption for backwards compatibility
export type { PickerOption as StandaloneWheelPickerOption };

const clampVisibleItems = (visibleItems?: number): number => {
  if (!Number.isFinite(visibleItems) || (visibleItems ?? 0) < 3) {
    return 5;
  }
  const candidate = visibleItems as number;
  return candidate % 2 === 0 ? candidate + 1 : candidate;
};

/**
 * Standalone wheel picker for lists, ranges, or custom options with momentum scrolling.
 *
 * Simpler alternative to CollapsibleNumberPicker when you only need the wheel interface
 * without auto-collapse behavior. Supports both option arrays and numeric ranges (min/max/step).
 *
 * @param {string | number} props.value - Currently selected value
 * @param {(value: string | number) => void} props.onChange - Callback when selection changes
 * @param {PickerOption[]} [props.options] - Custom options array (overrides min/max/step)
 * @param {number} [props.min=0] - Minimum value for numeric range
 * @param {number} [props.max=0] - Maximum value for numeric range
 * @param {number} [props.step=1] - Step increment for numeric range
 * @param {string} [props.unit=''] - Unit suffix (e.g., 'kg', 'mph')
 * @param {number} [props.visibleItems=5] - Number of visible items (forced to odd number)
 * @param {number} [props.itemHeight=48] - Height of each item in pixels
 * @param {string} [props.accentColor='#3EDCFF'] - Primary accent color
 * @param {string} [props.highlightColor] - Override highlight color (defaults to accentColor)
 * @param {boolean} [props.enableSnapPhysics=false] - Enable magnetic snap-to-item physics
 * @param {Partial<SnapPhysicsConfig>} [props.snapPhysicsConfig] - Snap physics tuning parameters
 * @param {(option, state) => ReactNode} [props.renderItem] - Custom item renderer
 *
 * @example
 * ```tsx
 * // Numeric range
 * <StandaloneWheelPicker
 *   value={weight}
 *   onChange={setWeight}
 *   min={40}
 *   max={200}
 *   step={0.5}
 *   unit="kg"
 * />
 *
 * // Custom options
 * <StandaloneWheelPicker
 *   value="easy"
 *   onChange={setDifficulty}
 *   options={[
 *     { value: 'easy', label: 'Easy' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'hard', label: 'Hard' }
 *   ]}
 * />
 * ```
 */
const StandaloneWheelPicker: React.FC<StandaloneWheelPickerProps> = ({
  value,
  onChange,
  options,
  min = 0,
  max = 0,
  step = 1,
  unit = '',
  visibleItems = 5,
  itemHeight = 48,
  className = '',
  accentColor = '#3EDCFF',
  highlightColor,
  enableSnapPhysics = false,
  snapPhysicsConfig,
  wheelSensitivity,
  wheelDeltaCap,
  renderItem,
}) => {
  const normalizedOptions = useMemo<NormalizedPickerOption[]>(() => {
    if (options && options.length > 0) {
      return normalizeOptions(options);
    }
    return generateRangeOptions({ min, max: max >= min ? max : min, step });
  }, [options, min, max, step]);

  const maps = useMemo(() => {
    const valueToKey = new Map<string | number, string>();
    const keyToOption = new Map<string, NormalizedPickerOption>();
    for (const opt of normalizedOptions) {
      valueToKey.set(opt.value, opt.key);
      keyToOption.set(opt.key, opt);
    }
    return { valueToKey, keyToOption };
  }, [normalizedOptions]);

  const selectedOption =
    normalizedOptions.find((opt) => opt.value === value) ?? normalizedOptions[0];

  const pickerValue = useMemo(
    () => ({ value: (maps.valueToKey.get(value) ?? selectedOption?.key ?? '') as string }),
    [maps.valueToKey, selectedOption?.key, value]
  );

  const handleValueChange = (next: { value: string }) => {
    const option = maps.keyToOption.get(next.value);
    if (!option) return;
    onChange(option.value);
  };

  const effectiveVisibleItems = clampVisibleItems(visibleItems);
  const pickerHeight = itemHeight * effectiveVisibleItems;
  const isGenerated = !options || options.length === 0;

  const mergedHighlight = highlightColor ?? accentColor;
  const mergedSnapConfig = mergeSnapConfig(enableSnapPhysics, snapPhysicsConfig);

  // Shared render function eliminates n function closures for scalability
  const sharedRender = useCallback(
    (state: { selected: boolean; visuallySelected: boolean; value: string | number }) => {
      const option = maps.keyToOption.get(String(state.value));
      if (!option) return null;

      if (renderItem) {
        return renderItem(option, { selected: state.selected, visuallySelected: state.visuallySelected });
      }

      return (
        <div
          className={`np-wheel-item ${state.selected || state.visuallySelected ? 'np-wheel-item-selected' : ''}`}
          style={{
            color: state.selected || state.visuallySelected
              ? option.accentColor ?? accentColor
              : option.accentColor ?? '#E7EDF2',
          }}
        >
          <span>{option.label}</span>
          {unit && isGenerated && <span className="np-wheel-unit">{unit}</span>}
        </div>
      );
    },
    [accentColor, isGenerated, maps.keyToOption, renderItem, unit]
  );

  // Direct options array bypasses O(n²) registration for scalability
  const pickerOptions = useMemo<PickerGroupOption[]>(
    () =>
      normalizedOptions.map((option) => ({
        value: option.key,
        render: sharedRender, // Same function reference for all items!
        props: EMPTY_PROPS, // Shared empty object
      })),
    [normalizedOptions, sharedRender]
  );

  // Memoize container style to avoid recreation
  const containerStyle = useMemo<CSSProperties>(
    () =>
      ({
        '--picker-highlight-color': mergedHighlight,
      } as CSSProperties),
    [mergedHighlight]
  );

  return (
    <div className={`np-wheel-picker ${className}`} style={containerStyle}>
      <div className="np-wheel-container">
        <PickerGroup
          value={pickerValue}
          onChange={handleValueChange}
          height={pickerHeight}
          itemHeight={itemHeight}
          wheelSensitivity={wheelSensitivity}
          wheelDeltaCap={wheelDeltaCap}
        >
          <PickerGroup.Column name="value" snapConfig={mergedSnapConfig} options={pickerOptions} />
        </PickerGroup>
      </div>
    </div>
  );
};

export default StandaloneWheelPicker;
