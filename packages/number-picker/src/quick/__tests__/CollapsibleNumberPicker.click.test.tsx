import { act, render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import CollapsibleNumberPicker from '../CollapsibleNumberPicker';

describe('CollapsibleNumberPicker click-to-open', () => {
  const baseProps = {
    label: 'Weight',
    unit: 'kg',
    value: 42,
    onChange: vi.fn(),
  } as const;

  it('opens when clicking on the picker surface', async () => {
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} />,
    );

    const surface = getByTestId('picker-surface');

    // Verify initially closed
    expect(surface.getAttribute('data-state')).toBe('closed');
    expect(surface.getAttribute('aria-expanded')).toBe('false');

    // Click to open
    await act(async () => {
      fireEvent.pointerDown(surface, { bubbles: true, cancelable: true, pointerType: 'mouse' });
    });

    // Verify opened
    expect(surface.getAttribute('data-state')).toBe('open');
    expect(surface.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens when using userEvent.click', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} />,
    );

    const surface = getByTestId('picker-surface');

    // Verify initially closed
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Click to open using userEvent (more realistic)
    await user.click(surface);

    // Verify opened
    expect(surface.getAttribute('data-state')).toBe('open');
  });

  it('opens with touch pointer type', async () => {
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} />,
    );

    const surface = getByTestId('picker-surface');

    // Verify initially closed
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Touch to open
    await act(async () => {
      fireEvent.pointerDown(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      });
    });

    // Verify opened
    expect(surface.getAttribute('data-state')).toBe('open');
  });

  it('opens with pen pointer type', async () => {
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} />,
    );

    const surface = getByTestId('picker-surface');

    // Verify initially closed
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Pen to open
    await act(async () => {
      fireEvent.pointerDown(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'pen',
      });
    });

    // Verify opened
    expect(surface.getAttribute('data-state')).toBe('open');
  });

  it('can be controlled with isOpen prop', async () => {
    const onRequestOpen = vi.fn();
    const onRequestClose = vi.fn();

    const { getByTestId, rerender } = render(
      <CollapsibleNumberPicker
        {...baseProps}
        isOpen={false}
        onRequestOpen={onRequestOpen}
        onRequestClose={onRequestClose}
      />,
    );

    const surface = getByTestId('picker-surface');

    // Verify initially closed
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Click should call onRequestOpen
    await act(async () => {
      fireEvent.pointerDown(surface, { bubbles: true, cancelable: true, pointerType: 'mouse' });
    });

    expect(onRequestOpen).toHaveBeenCalled();

    // Still closed because it's controlled
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Now open it by changing the prop
    rerender(
      <CollapsibleNumberPicker
        {...baseProps}
        isOpen={true}
        onRequestOpen={onRequestOpen}
        onRequestClose={onRequestClose}
      />
    );

    // Should be open now
    expect(surface.getAttribute('data-state')).toBe('open');
  });

  it('calls onChange when closed (uncontrolled mode)', async () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <CollapsibleNumberPicker {...baseProps} value={10} onChange={onChange} />,
    );

    const surface = getByTestId('picker-surface');

    // Open picker
    await act(async () => {
      fireEvent.pointerDown(surface, { bubbles: true, cancelable: true, pointerType: 'mouse' });
    });

    expect(surface.getAttribute('data-state')).toBe('open');

    // onChange should not have been called yet (just opening)
    expect(onChange).not.toHaveBeenCalled();
  });
});
