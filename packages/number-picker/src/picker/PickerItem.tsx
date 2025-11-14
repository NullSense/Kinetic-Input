import { HTMLProps, ReactNode, useCallback, useEffect, useMemo } from 'react';
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

function PickerItem({ children, value, ...restProps }: PickerItemProps) {
  const { key } = usePickerConfig('Picker.Item');
  const pickerActions = usePickerActions('Picker.Item');

  const render = useCallback(
    (state: PickerItemRenderProps) =>
      isFunction(children) ? children(state) : children,
    [children],
  );

  const option = useMemo(
    () => ({
      value,
      render,
      props: restProps,
    }),
    [value, render, restProps],
  );

  useEffect(() => pickerActions.registerOption(key, option), [key, option, pickerActions]);

  return null;
}

export default PickerItem;
