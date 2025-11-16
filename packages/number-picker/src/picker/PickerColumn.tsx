import { HTMLProps, useMemo } from 'react';
import { motion, useMotionTemplate } from 'framer-motion';
import { usePickerActions, usePickerData, type PickerOption } from './PickerGroup';
import { PickerConfigProvider } from './context';
import type { SnapPhysicsConfig } from './types/snapPhysics';
import { usePickerPhysics } from './hooks/usePickerPhysics';
import type { PickerGestureHandler } from './gestures';

export interface PickerColumnProps extends Omit<HTMLProps<HTMLDivElement>, 'onDragStart' | 'onDragEnd'> {
  name: string;
  /** Event-driven gesture handler */
  onGesture?: PickerGestureHandler;
  isPickerOpen?: boolean;
  snapConfig?: SnapPhysicsConfig;
  /** Direct options array to bypass O(n²) registration. When provided, children are ignored. */
  options?: PickerOption[];
}

const VISIBLE_ROWS = 5;
const OVERSCAN_ROWS = 3;
const SLOT_COUNT = VISIBLE_ROWS + OVERSCAN_ROWS * 2;

function PickerColumn({
  style: styleFromUser,
  children,
  name: key,
  onGesture,
  isPickerOpen = true,
  snapConfig,
  options: directOptions,
  ...restProps
}: PickerColumnProps) {
  const {
    height,
    itemHeight,
    wheelMode,
    wheelSensitivity,
    wheelDeltaCap,
    value: groupValue,
    optionGroups,
  } = usePickerData('Picker.Column');

  const value = useMemo(() => groupValue[key], [groupValue, key]);
  // Use direct options if provided (bypasses O(n²) registration), otherwise fall back to registered options
  const options = useMemo(() => directOptions || optionGroups[key] || [], [directOptions, key, optionGroups]);

  // Fast path: detect if values are sequential [0,1,2,...] or ["0","1","2",...]
  const isSequential = useMemo(() => {
    if (options.length === 0) return false;
    const firstVal = options[0].value;
    if (firstVal !== 0 && firstVal !== '0') return false;

    for (let i = 0; i < options.length; i += 1) {
      const expected = typeof firstVal === 'number' ? i : String(i);
      if (options[i].value !== expected) return false;
    }
    return true;
  }, [options]);

  const valueToIndex = useMemo(() => {
    // Skip Map creation for sequential values (common case: age, weight, reps)
    if (isSequential) return null;

    const map = new Map<string | number, number>();
    for (let i = 0; i < options.length; i += 1) {
      map.set(options[i].value, i);
    }
    return map;
  }, [options, isSequential]);

  const selectedIndex = useMemo(() => {
    // Fast path for sequential values: direct conversion
    if (isSequential) {
      const idx = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(idx) && idx >= 0 && idx < options.length ? idx : 0;
    }

    // Fallback to Map lookup
    const idx = valueToIndex?.get(value);
    return idx !== undefined ? idx : 0;
  }, [value, valueToIndex, isSequential, options.length]);

  const virtualizationConfig = useMemo(
    () => ({
      slotCount: SLOT_COUNT,
      overscan: OVERSCAN_ROWS + Math.floor(VISIBLE_ROWS / 2),
    }),
    [],
  );

  const pickerActions = usePickerActions('Picker.Column');

  const {
    columnRef,
    ySnap,
    centerIndex,
    startIndex,
    windowLength,
    virtualOffsetY,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
  } = usePickerPhysics({
    key,
    options,
    selectedIndex,
    itemHeight,
    height,
    isPickerOpen,
    wheelMode,
    wheelSensitivity,
    wheelDeltaCap,
    changeValue: pickerActions.change,
    onGesture,
    snapConfig,
    virtualization: virtualizationConfig,
  });

  const pickerConfigValue = useMemo(
    () => ({ key, isPickerOpen }),
    [isPickerOpen, key],
  );

  // Pre-compute base item style (shared by all 250 items) to avoid recreating it in the loop
  const baseItemStyle = useMemo(
    () => ({
      height: `${itemHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: `${itemHeight}px`,
    }),
    [itemHeight]
  );

  // Use motion template to avoid regex parsing on every frame (60-120 times/sec)
  const transform = useMotionTemplate`translate3d(0, ${ySnap}px, 0)`;

  return (
    <PickerConfigProvider value={pickerConfigValue}>
      <div
        ref={columnRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        style={{
          position: 'relative',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          ...styleFromUser,
        }}
        {...restProps}
      >
        <motion.div
          className="picker-scroller"
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform,
          }}
        >
          <div style={{ transform: `translateY(${virtualOffsetY}px)` }}>
            {Array.from({ length: windowLength }).map((_, slot) => {
              const absoluteIndex = startIndex + slot;
              const option = options[absoluteIndex];
              if (!option) {
                return null;
              }

              const selected = absoluteIndex === selectedIndex;
              const visuallySelected = absoluteIndex === centerIndex;
              const content = option.render({ selected, visuallySelected, value: option.value });
              const optionProps = option.props ?? {};
              const { style: optionStyle, className, role, onClick: userOnClick, id: optionIdProp, ...rest } = optionProps;

              // Reuse base style, only spread if custom style exists
              const mergedStyle = optionStyle ? { ...baseItemStyle, ...optionStyle } : baseItemStyle;
              const optionId = optionIdProp ?? `picker-option-${key}-${absoluteIndex}`;

              return (
                <div
                  key={absoluteIndex}
                  className={className}
                  role={role ?? 'option'}
                  aria-selected={selected}
                  style={mergedStyle}
                  id={optionId}
                  onClick={(event) => {
                    userOnClick?.(event);
                    if (!event.defaultPrevented && !selected) {
                      pickerActions.change(key, option.value);
                    }
                  }}
                  {...rest}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </motion.div>
        {children}
      </div>
    </PickerConfigProvider>
  );
}

export default PickerColumn;
