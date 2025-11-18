import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type CSSProperties,
  type HTMLProps,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';

const DEFAULT_HEIGHT = 216;
const DEFAULT_ITEM_HEIGHT = 36;
const DEFAULT_WHEEL_SENSITIVITY = 1;
const DEFAULT_WHEEL_DELTA_CAP = 1.25;

interface Option {
  value: string | number;
  render: (state: { selected: boolean; visuallySelected: boolean; value: string | number }) => ReactNode;
  props: Omit<HTMLProps<HTMLDivElement>, 'children' | 'value'>;
}

export type PickerOption = Option;

export interface PickerValue {
  [key: string]: string | number;
}

export interface PickerGroupRootProps<TType extends PickerValue>
  extends Omit<HTMLProps<HTMLDivElement>, 'value' | 'onChange'> {
  value: TType;
  onChange: (value: TType, key: string) => void;
  height?: number;
  itemHeight?: number;
  wheelSensitivity?: number;
  wheelDeltaCap?: number;
  showHighlightLines?: boolean;
}

const PickerGroupDataContext = createContext<{
  height: number;
  itemHeight: number;
  wheelSensitivity: number;
  wheelDeltaCap: number;
  value: PickerValue;
  optionGroups: { [key: string]: Option[] };
} | null>(null);
PickerGroupDataContext.displayName = 'PickerGroupDataContext';

export function usePickerData(componentName: string) {
  const context = useContext(PickerGroupDataContext);
  if (context === null) {
    const error = new Error(`<${componentName} /> is missing a parent <PickerGroup /> component.`);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, usePickerData);
    }
    throw error;
  }
  return context;
}

const PickerGroupActionsContext = createContext<{
  registerOption(key: string, option: Option): () => void;
  change(key: string, value: string | number): boolean;
} | null>(null);
PickerGroupActionsContext.displayName = 'PickerGroupActionsContext';

export function usePickerActions(componentName: string) {
  const context = useContext(PickerGroupActionsContext);
  if (context === null) {
    const error = new Error(`<${componentName} /> is missing a parent <PickerGroup /> component.`);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, usePickerActions);
    }
    throw error;
  }
  return context;
}

function pickerGroupReducer(
  optionGroups: { [key: string]: Option[] },
  action: {
    type: 'REGISTER_OPTION' | 'UNREGISTER_OPTION';
    key: string;
    option: Option;
  },
) {
  switch (action.type) {
    case 'REGISTER_OPTION': {
      const { key, option } = action;
      const nextOptionsForKey = [...(optionGroups[key] || []), option];
      return {
        ...optionGroups,
        [key]: nextOptionsForKey,
      };
    }
    case 'UNREGISTER_OPTION': {
      const { key, option } = action;
      return {
        ...optionGroups,
        [key]: (optionGroups[key] || []).filter((o) => o !== option),
      };
    }
    default: {
      throw Error(`Unknown action: ${action.type as string}`);
    }
  }
}

/**
 * Multi-column picker container with shared state and keyboard navigation.
 *
 * Provides context for child PickerColumn components, manages value synchronization,
 * and handles cross-column keyboard navigation (ArrowLeft/ArrowRight).
 *
 * @template TType - Shape of the picker value object (e.g., `{ hours: number; minutes: number }`)
 *
 * @param {TType} props.value - Current selected values for all columns
 * @param {(value: TType, key: string) => void} props.onChange - Callback when any column value changes
 * @param {number} [props.height=216] - Total picker height in pixels
 * @param {number} [props.itemHeight=36] - Height of each individual item in pixels
 * @param {number} [props.wheelSensitivity=1] - Mouse wheel scroll speed multiplier
 * @param {number} [props.wheelDeltaCap=1.25] - Maximum wheel delta per event (prevents over-scrolling)
 * @param {boolean} [props.showHighlightLines=true] - Show selection highlight borders
 *
 * @example
 * ```tsx
 * <PickerGroup
 *   value={{ hours: 14, minutes: 30 }}
 *   onChange={(value) => setTime(value)}
 *   height={216}
 *   itemHeight={36}
 * >
 *   <PickerColumn name="hours" options={hourOptions} />
 *   <PickerColumn name="minutes" options={minuteOptions} />
 * </PickerGroup>
 * ```
 */
function PickerGroupRoot<TType extends PickerValue>(props: PickerGroupRootProps<TType>) {
  const {
    style,
    children,
    value,
    onChange,
    height = DEFAULT_HEIGHT,
    itemHeight = DEFAULT_ITEM_HEIGHT,
    wheelSensitivity = DEFAULT_WHEEL_SENSITIVITY,
    wheelDeltaCap = DEFAULT_WHEEL_DELTA_CAP,
    showHighlightLines = true,
    ...restProps
  } = props;

  const highlightStyle = useMemo<CSSProperties>(
    () => ({
      height: `var(--picker-highlight-height, ${itemHeight}px)`,
      marginTop: `calc(var(--picker-highlight-height, ${itemHeight}px) * -0.5)`,
      position: 'absolute',
      top: '50%',
      left: 0,
      width: '100%',
      pointerEvents: 'none',
    }),
    [itemHeight],
  );
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      height: `${height}px`,
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      contain: 'layout paint size style',
    }),
    [height],
  );

  const [optionGroups, dispatch] = useReducer(pickerGroupReducer, {});

  const pickerGroupData = useMemo(
    () => ({ height, itemHeight, wheelSensitivity, wheelDeltaCap, value, optionGroups }),
    [height, itemHeight, optionGroups, value, wheelDeltaCap, wheelSensitivity],
  );

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const triggerChange = useCallback(
    (key: string, nextValue: string) => {
      if (valueRef.current[key] === nextValue) return false;
      const nextPickerValue = { ...valueRef.current, [key]: nextValue };
      onChangeRef.current(nextPickerValue, key);
      return true;
    },
    [], // Empty deps = stable forever
  );
  const registerOption = useCallback((key: string, option: Option) => {
    dispatch({ type: 'REGISTER_OPTION', key, option });
    return () => dispatch({ type: 'UNREGISTER_OPTION', key, option });
  }, []);
  const pickerGroupActions = useMemo(
    () => ({ registerOption, change: triggerChange }),
    [registerOption, triggerChange],
  );

  // Memoize merged container style to prevent object recreation
  const mergedContainerStyle = useMemo(
    () => ({ ...containerStyle, ...style }),
    [containerStyle, style]
  );

  // Memoize static gradient styles (never change)
  const topGradientStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '20%',
      pointerEvents: 'none',
      willChange: 'opacity',
      background:
        'linear-gradient(to bottom, var(--picker-overlay-color, rgba(0,0,0,0.95)) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)',
    }),
    []
  );

  const bottomGradientStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '20%',
      pointerEvents: 'none',
      willChange: 'opacity',
      background:
        'linear-gradient(to top, var(--picker-overlay-color, rgba(0,0,0,0.95)) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)',
    }),
    []
  );

  const highlightBorderTopStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: 1,
      background: 'var(--picker-highlight-color, #d9d9d9)',
      transform: 'scaleY(0.5)',
    }),
    []
  );

  const highlightBorderBottomStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      background: 'var(--picker-highlight-color, #d9d9d9)',
      transform: 'scaleY(0.5)',
    }),
    []
  );

  // Cross-column keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Only intercept ArrowLeft/ArrowRight for multi-column navigation
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable columns
    const columns = Array.from(container.querySelectorAll('.picker-column')) as HTMLElement[];
    if (columns.length <= 1) {
      // Single column - let the column handle left/right as up/down
      return;
    }

    // Multi-column picker - use left/right to navigate between columns
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = columns.indexOf(activeElement);

    if (currentIndex === -1) {
      // No column focused, focus the first one
      columns[0]?.focus();
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.key === 'ArrowLeft') {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        columns[prevIndex].focus();
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (e.key === 'ArrowRight') {
      const nextIndex = currentIndex + 1;
      if (nextIndex < columns.length) {
        columns[nextIndex].focus();
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, []);

  // Wheel event handling is managed by column's native listener
  // which always prevents default to avoid page scrolling

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={containerRef}
        className="picker-surface"
        style={mergedContainerStyle}
        onKeyDownCapture={handleContainerKeyDown}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        {...restProps}
      >
        <PickerGroupActionsContext.Provider value={pickerGroupActions}>
          <PickerGroupDataContext.Provider value={pickerGroupData}>{children}</PickerGroupDataContext.Provider>
        </PickerGroupActionsContext.Provider>
        {/* Overlay gradients (cheaper than mask-image) */}
        <div
          aria-hidden
          style={topGradientStyle}
        />
        <div
          aria-hidden
          style={bottomGradientStyle}
        />
        {showHighlightLines && (
          <div className="picker-highlight-hitbox" style={highlightStyle}>
            <div
              className="picker-highlight-line-top"
              style={highlightBorderTopStyle}
            />
            <div
              className="picker-highlight-line-bottom"
              style={highlightBorderBottomStyle}
            />
          </div>
        )}
      </div>
    </LazyMotion>
  );
}

export default PickerGroupRoot;
