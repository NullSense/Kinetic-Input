import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Picker from '../PickerGroup';
import PickerColumn from '../PickerColumn';
import PickerItem from '../PickerItem';

function TestPicker({ children, value = '0' }: { children: React.ReactNode; value?: string }) {
  return (
    <Picker value={{ test: value }} onChange={vi.fn()} itemHeight={40} height={200}>
      {children}
    </Picker>
  );
}

describe.skip('PickerColumn boundary callbacks fire once', () => {
  const options = Array.from({ length: 5 }, (_, i) => String(i));

  it('fires boundary:hit event exactly once at min and once at max', async () => {
    const onGesture = vi.fn();
    const user = userEvent.setup();

    render(
      <TestPicker>
        <PickerColumn name="test" onGesture={onGesture}>
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </TestPicker>
    );

    const startEl = screen.getByText('2').parentElement!;

    // Drag far up beyond the first item
    await user.pointer({ target: startEl, keys: '[MouseLeft>]' });
    await user.pointer({ coords: { x: 0, y: -1000 } });
    await user.pointer({ keys: '[/MouseLeft]' });

    // Expect one min boundary:hit event (async timing)
    await waitFor(() => {
      const minCalls = onGesture.mock.calls.filter(
        ([event]) => event.type === 'boundary:hit' && event.boundary === 'min'
      );
      expect(minCalls.length).toBe(1);
      expect(minCalls[0][0].boundary).toBe('min');
    });

    // Drag far down beyond the last item
    await user.pointer({ target: startEl, keys: '[MouseLeft>]' });
    await user.pointer({ coords: { x: 0, y: 1000 } });
    await user.pointer({ keys: '[/MouseLeft]' });

    // Expect one max boundary:hit event (async timing)
    await waitFor(() => {
      const maxCalls = onGesture.mock.calls.filter(
        ([event]) => event.type === 'boundary:hit' && event.boundary === 'max'
      );
      expect(maxCalls.length).toBe(1);
      expect(maxCalls[0][0].boundary).toBe('max');
    });
  });
});
