import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CollapsibleNumberPicker from '../CollapsibleNumberPicker';

describe('CollapsibleNumberPicker wheel orchestration', () => {
  const baseProps = {
    label: 'Weight',
    unit: 'kg',
    value: 42,
    onChange: () => {},
  } as const;

  it('does not intercept wheel gestures when wheelMode is off', () => {
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} wheelMode="off" />,
    );

    const wrapper = getByTestId('qni-wrapper');
    const surface = getByTestId('picker-surface');

    expect(surface.getAttribute('data-state')).toBe('closed');

    const evt = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });

    act(() => {
      wrapper.dispatchEvent(evt);
    });

    expect(evt.defaultPrevented).toBe(false);
    expect(surface.getAttribute('data-state')).toBe('closed');
  });

  it('opens the picker and captures the wheel when wheelMode allows scrolling', () => {
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} wheelMode="inverted" />,
    );

    const wrapper = getByTestId('qni-wrapper');
    const surface = getByTestId('picker-surface');

    expect(surface.getAttribute('data-state')).toBe('closed');

    const evt = new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true });

    act(() => {
      wrapper.dispatchEvent(evt);
    });

    expect(evt.defaultPrevented).toBe(true);
    expect(surface.getAttribute('data-state')).toBe('open');
  });
});
