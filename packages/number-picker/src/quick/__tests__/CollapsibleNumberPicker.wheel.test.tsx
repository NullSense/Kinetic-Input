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

  // wheelMode='off' no longer exists - wheel scrolling is always enabled with auto-detection

  it('opens the picker and captures wheel events (auto-detection always enabled)', () => {
    const { getByTestId } = render(<CollapsibleNumberPicker {...baseProps} />);

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
