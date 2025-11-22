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
import { createFeedbackAdapters, type FeedbackAdapters } from '../quick/feedback';
import { usePickerGestureFeedback } from '../shared/hooks';

// Shared empty props object to avoid allocations for large datasets
const EMPTY_PROPS = {};

/**
 * Props for Picker component
 *
 * Clean, focused interface following Interface Segregation Principle
 */
export interface PickerProps {
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
  /** Enable haptic feedback on value changes (requires device support) */
  enableHaptics?: boolean;
  /** Enable audio feedback on value commit (requires user interaction) */
  enableAudioFeedback?: boolean;
  /** Override default feedback patterns and adapters */
  feedbackOverrides?: {
    haptics?: {
      pattern?: number | number[];
      settlePattern?: number | number[];
    };
    audio?: {
      frequency?: number;
      waveform?: OscillatorType;
      attackMs?: number;
      decayMs?: number;
      durationMs?: number;
      peakGain?: number;
    };
  };
}

// Re-export PickerOption for convenience
export type { PickerOption as PickerOptionType };

const clampVisibleItems = (visibleItems?: number): number => {
  if (!Number.isFinite(visibleItems) || (visibleItems ?? 0) < 3) {
    return 5;
  }
  const candidate = visibleItems as number;
  return candidate % 2 === 0 ? candidate + 1 : candidate;
};

/**
 * Picker - Always-visible wheel picker with momentum scrolling
 *
 * Primary picker component for most use cases. Use this when you want an always-visible
 * picker without auto-collapse behavior. Supports both option arrays and numeric ranges.
 *
 * Features:
 * - Momentum scrolling with physics
 * - Haptic & audio feedback
 * - Snap-to-item physics (optional)
 * - Custom item rendering
 * - Numeric ranges or custom options
 *
 * For interactive open/close behavior, see CollapsiblePicker.
 * For multi-column pickers (time, date), see Picker.Group.
 *
 * @example
 * ```tsx
 * // Numeric range with haptics
 * <Picker
 *   value={weight}
 *   onChange={setWeight}
 *   min={40}
 *   max={200}
 *   step={0.5}
 *   unit="kg"
 *   enableHaptics
 * />
 *
 * // Custom options
 * <Picker
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
const Picker: React.FC<PickerProps> = ({
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
  enableHaptics = false,
  enableAudioFeedback = false,
  feedbackOverrides,
}) => {
  // Create feedback adapters (only when enabled)
  const adapters = useMemo<FeedbackAdapters>(
    () =>
      createFeedbackAdapters({
        enableHaptics,
        enableAudioFeedback,
        hapticsOptions: feedbackOverrides?.haptics,
        audioOptions: feedbackOverrides?.audio,
      }),
    [enableHaptics, enableAudioFeedback, feedbackOverrides]
  );

  // Use shared gesture-to-feedback mapping hook (SRP)
  const handleGesture = usePickerGestureFeedback(adapters);

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
        return renderItem(option, {
          selected: state.selected,
          visuallySelected: state.visuallySelected,
        });
      }

      return (
        <div
          className={`np-wheel-item ${state.selected || state.visuallySelected ? 'np-wheel-item-selected' : ''}`}
          style={{
            color:
              state.selected || state.visuallySelected
                ? (option.accentColor ?? accentColor)
                : (option.accentColor ?? '#E7EDF2'),
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
      }) as CSSProperties,
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
          <PickerGroup.Column
            name="value"
            snapConfig={mergedSnapConfig}
            options={pickerOptions}
            onGesture={handleGesture}
          />
        </PickerGroup>
      </div>
    </div>
  );
};

export default Picker;
