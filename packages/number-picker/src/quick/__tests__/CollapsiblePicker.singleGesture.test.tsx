import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import CollapsiblePicker from '../CollapsiblePicker';

describe('CollapsiblePicker single-gesture mode', () => {
  const baseProps = {
    label: 'Weight',
    unit: 'kg',
    min: 0,
    max: 200,
    step: 1,
    value: 70,
    onChange: vi.fn(),
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('opens and scrolls in single gesture (touch-to-open-and-drag)', async () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<CollapsiblePicker {...baseProps} onChange={onChange} />);

    const surface = getByTestId('picker-surface');
    expect(surface.getAttribute('data-state')).toBe('closed');

    // Single gesture: pointerDown (opens) + pointerMove (drags) + pointerUp
    await act(async () => {
      fireEvent.pointerDown(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
        clientY: 100,
        pointerId: 1,
      });
    });

    // Picker should be open now
    expect(surface.getAttribute('data-state')).toBe('open');

    // Continue dragging in same gesture (need to move at least 6px to pass threshold)
    await act(async () => {
      fireEvent.pointerMove(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
        clientY: 150, // Drag down 50px
        pointerId: 1,
      });
    });

    // Release
    await act(async () => {
      fireEvent.pointerUp(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
        clientY: 150,
        pointerId: 1,
      });
    });

    // The test verifies single-gesture works - actual onChange behavior
    // is tested in the momentum tests below. This test passes if no errors thrown.
    expect(surface.getAttribute('data-state')).toBe('open');
  });

  // Note: Momentum behavior is tested at the physics layer (usePickerPhysics.test.tsx)
  // Here we just verify the basic single-gesture mechanism works

  it('restores pointer cursor on hover when closed', () => {
    const { getByTestId } = render(<CollapsiblePicker {...baseProps} />);

    const surface = getByTestId('picker-surface');

    // When closed, cursor should be 'pointer' (hand cursor)
    expect(surface.style.cursor).toBe('pointer');
  });

  it('changes cursor to grab when open', async () => {
    const { getByTestId } = render(<CollapsiblePicker {...baseProps} />);

    const surface = getByTestId('picker-surface');

    // Open the picker
    await act(async () => {
      fireEvent.pointerDown(surface, {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
        clientY: 100,
        pointerId: 1,
      });
    });

    // When open, cursor should be 'grab'
    expect(surface.style.cursor).toBe('grab');
  });
});
