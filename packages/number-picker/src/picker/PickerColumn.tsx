import { useCallback, useMemo, type CSSProperties, type HTMLProps } from 'react';
import { m, useMotionTemplate } from 'framer-motion';
import { usePickerActions, usePickerData, type PickerOption } from './PickerGroup';
import { PickerConfigProvider } from './context';
import type { SnapPhysicsConfig } from './types/snapPhysics';
import { usePickerPhysics } from './hooks/usePickerPhysics';
import type { PickerGestureHandler } from './gestures';

export interface PickerColumnProps
  extends Omit<HTMLProps<HTMLDivElement>, 'onDragStart' | 'onDragEnd'> {
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

/**
 * Individual scrollable picker column with momentum physics and virtualization.
 *
 * Must be used inside a PickerGroup component. Handles pointer/touch gestures,
 * keyboard navigation (arrows, page up/down, home/end), and wheel scrolling.
 *
 * Optimized with row virtualization for large datasets (11 visible slots out of 250+ items).
 *
 * @param {string} props.name - Unique identifier for this column (matches key in PickerGroup value)
 * @param {PickerOption[]} [props.options] - Direct options array (bypasses child registration)
 * @param {boolean} [props.isPickerOpen=true] - Whether picker is active (blocks gestures when closed)
 * @param {SnapPhysicsConfig} [props.snapConfig] - Optional snap-to-item magnetic physics config
 * @param {PickerGestureHandler} [props.onGesture] - Callback for gesture events (start/end/settle)
 *
 * @example
 * ```tsx
 * <PickerColumn
 *   name="hours"
 *   options={hourOptions}
 *   snapConfig={{ snapRange: 0.3, pullStrength: 0.6 }}
 * />
 * ```
 */
function PickerColumn({
  style: styleFromUser,
  className: classNameFromUser,
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
    wheelSensitivity,
    wheelDeltaCap,
    value: groupValue,
    optionGroups,
  } = usePickerData('Picker.Column');

  const value = useMemo(() => groupValue[key], [groupValue, key]);
  // Use direct options if provided (bypasses O(n²) registration), otherwise fall back to registered options
  const options = useMemo(
    () => directOptions || optionGroups[key] || [],
    [directOptions, key, optionGroups]
  );

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
    []
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
    handleClick,
    handleDoubleClick,
    interruptMomentum,
  } = usePickerPhysics({
    key,
    options,
    selectedIndex,
    itemHeight,
    height,
    isPickerOpen,
    wheelSensitivity,
    wheelDeltaCap,
    changeValue: pickerActions.change,
    onGesture,
    snapConfig,
    virtualization: virtualizationConfig,
  });

  const pickerConfigValue = useMemo(() => ({ key, isPickerOpen }), [isPickerOpen, key]);

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || options.length === 0) {
        return;
      }

      const pageJump = Math.max(1, Math.min(10, Math.floor(options.length / 5) || 1));
      let targetIndex = selectedIndex;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          targetIndex = Math.min(options.length - 1, selectedIndex + 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          targetIndex = Math.max(0, selectedIndex - 1);
          break;
        case 'PageDown':
          event.preventDefault();
          targetIndex = Math.min(options.length - 1, selectedIndex + pageJump);
          break;
        case 'PageUp':
          event.preventDefault();
          targetIndex = Math.max(0, selectedIndex - pageJump);
          break;
        case 'Home':
          event.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          targetIndex = options.length - 1;
          break;
        default:
          return;
      }

      if (targetIndex !== selectedIndex) {
        const targetOption = options[targetIndex];
        if (targetOption) {
          // Interrupt any active momentum animation before keyboard navigation
          interruptMomentum();
          pickerActions.change(key, targetOption.value);
        }
      }
    },
    [options, selectedIndex, key, pickerActions, interruptMomentum]
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

  // Merge classNames to ensure picker-column is always present
  const mergedClassName = classNameFromUser
    ? `picker-column ${classNameFromUser}`
    : 'picker-column';

  // Highlight lines for the center row (only shown when column has focus in multi-column mode)
  const highlightStyle = useMemo<CSSProperties>(
    () => ({
      height: `${itemHeight}px`,
      marginTop: `${-itemHeight / 2}px`,
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      pointerEvents: 'none' as const,
      zIndex: 10,
    }),
    [itemHeight]
  );

  const highlightBorderStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      left: 0,
      width: '100%',
      height: 1,
      background: 'var(--picker-highlight-color, rgba(62, 220, 255, 0.6))',
      transform: 'scaleY(0.5)',
    }),
    []
  );

  return (
    <PickerConfigProvider value={pickerConfigValue}>
      <div
        ref={columnRef}
        className={mergedClassName}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'relative',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          ...styleFromUser,
        }}
        {...restProps}
      >
        {/* Column-specific highlights for multi-column pickers */}
        <div className="picker-column-highlight" style={highlightStyle}>
          <div style={{ ...highlightBorderStyle, top: 0 }} />
          <div style={{ ...highlightBorderStyle, bottom: 0 }} />
        </div>
        <m.div
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
              const {
                style: optionStyle,
                className,
                role,
                onClick: userOnClick,
                id: optionIdProp,
                ...rest
              } = optionProps;

              // Reuse base style, only spread if custom style exists
              const mergedStyle = optionStyle
                ? { ...baseItemStyle, ...optionStyle }
                : baseItemStyle;
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
        </m.div>
        {children}
      </div>
    </PickerConfigProvider>
  );
}

export default PickerColumn;
