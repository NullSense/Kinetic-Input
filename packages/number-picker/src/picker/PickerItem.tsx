import { useCallback, useEffect, useMemo, type HTMLProps, type ReactNode } from 'react';
import { usePickerActions } from './PickerGroup';
import { usePickerConfig } from './context';

interface PickerItemRenderProps {
  selected: boolean;
  visuallySelected: boolean;
  value: string | number;
}

export interface PickerItemProps extends Omit<HTMLProps<HTMLDivElement>, 'value' | 'children'> {
  children: ReactNode | ((renderProps: PickerItemRenderProps) => ReactNode);
  value: string | number;
}

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Declarative option item for a PickerColumn. Renders nothing but registers itself in parent column.
 *
 * Must be used inside a PickerColumn component. Alternative to passing direct `options` array.
 *
 * @param {ReactNode | ((props: PickerItemRenderProps) => ReactNode)} props.children - Content to render (static or render function)
 * @param {string | number} props.value - Unique value for this option
 *
 * @example
 * ```tsx
 * <PickerColumn name="mood">
 *   <PickerItem value="happy">😊 Happy</PickerItem>
 *   <PickerItem value="sad">😢 Sad</PickerItem>
 *   <PickerItem value="excited">
 *     {({ selected }) => (
 *       <span className={selected ? 'active' : ''}>🎉 Excited</span>
 *     )}
 *   </PickerItem>
 * </PickerColumn>
 * ```
 */
function PickerItem({ children, value, ...restProps }: PickerItemProps) {
  const { key } = usePickerConfig('Picker.Item');
  const pickerActions = usePickerActions('Picker.Item');

  const render = useCallback(
    (state: PickerItemRenderProps) => (isFunction(children) ? children(state) : children),
    [children]
  );

  const option = useMemo(
    () => ({
      value,
      render,
      props: restProps,
    }),
    [value, render, restProps]
  );

  useEffect(() => pickerActions.registerOption(key, option), [key, option, pickerActions]);

  return null;
}

export default PickerItem;
