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
} from 'react';

const DEFAULT_HEIGHT = 216;
const DEFAULT_ITEM_HEIGHT = 36;
const DEFAULT_WHEEL_MODE = 'off';

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
  showHighlightLines?: boolean;
}

const PickerGroupDataContext = createContext<{
  height: number;
  itemHeight: number;
  wheelMode: 'off' | 'natural' | 'inverted';
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
    () => ({ height, itemHeight, wheelMode, value, optionGroups }),
    [height, itemHeight, value, optionGroups, wheelMode],
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

  return (
    <div
      style={mergedContainerStyle}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
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
        <div style={highlightStyle}>
          <div
            style={highlightBorderTopStyle}
          />
          <div
            style={highlightBorderBottomStyle}
          />
        </div>
      )}
    </div>
  );
}

export default PickerGroupRoot;
