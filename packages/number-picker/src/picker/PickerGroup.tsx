import {
  CSSProperties,
  HTMLProps,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type KeyboardEvent,
} from 'react';

const DEFAULT_HEIGHT = 216;
const DEFAULT_ITEM_HEIGHT = 36;
const DEFAULT_WHEEL_MODE = 'off';
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
  wheelMode?: 'off' | 'natural' | 'inverted';
  wheelSensitivity?: number;
  wheelDeltaCap?: number;
  showHighlightLines?: boolean;
}

const PickerGroupDataContext = createContext<{
  height: number;
  itemHeight: number;
  wheelMode: 'off' | 'natural' | 'inverted';
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

function PickerGroupRoot<TType extends PickerValue>(props: PickerGroupRootProps<TType>) {
  const {
    style,
    children,
    value,
    onChange,
    height = DEFAULT_HEIGHT,
    itemHeight = DEFAULT_ITEM_HEIGHT,
    wheelMode = DEFAULT_WHEEL_MODE,
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
    () => ({ height, itemHeight, wheelMode, wheelSensitivity, wheelDeltaCap, value, optionGroups }),
    [height, itemHeight, optionGroups, value, wheelDeltaCap, wheelMode, wheelSensitivity],
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

  // Prevent page scroll when wheeling over picker
  // - When wheelMode='off': prevent default to stop page scroll (picker doesn't scroll)
  // - When wheelMode enabled: column's native listener handles preventDefault
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelMode === 'off' && !e.ctrlKey) {
      e.preventDefault();
    }
  }, [wheelMode]);

  return (
    <div
      ref={containerRef}
      className="picker-surface"
      style={mergedContainerStyle}
      onKeyDownCapture={handleContainerKeyDown}
      onWheel={handleWheel}
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
  );
}

export default PickerGroupRoot;
