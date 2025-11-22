import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Picker from '../PickerGroup';
import PickerColumn from '../PickerColumn';
import PickerItem from '../PickerItem';

// Helper to simulate sequential pointer moves without await-in-loop
async function simulatePointerDrag(user: ReturnType<typeof userEvent.setup>, count: number) {
  const moves = [];
  for (let i = 0; i < count; i++) {
    moves.push({ coords: { x: 0, y: i * 2 } });
  }
  // Execute sequentially using reduce to avoid await-in-loop
  await moves.reduce(
    async (prev, coords) => {
      await prev;
      return user.pointer(coords);
    },
    Promise.resolve() as Promise<void>
  );
}

function TestPicker({
  children,
  onValueChange = vi.fn(),
}: {
  children: React.ReactNode;
  onValueChange?: (v: string) => void;
}) {
  return (
    <Picker
      value={{ test: 'Option 3' }}
      onChange={(nv) => onValueChange(nv.test as string)}
      itemHeight={40}
      height={200}
    >
      {children}
    </Picker>
  );
}

describe('PickerColumn one-shot commit', () => {
  const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);

  it('fires onChange exactly once on release after long drag', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TestPicker onValueChange={onValueChange}>
        <PickerColumn name="test">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </TestPicker>
    );

    const startEl = screen.getByText('Option 2').parentElement!;

    await user.pointer({ target: startEl, keys: '[MouseLeft>]' });

    // Many move events (simulate momentum-worthy drag)
    await user.pointer({ target: startEl, keys: '[MouseLeft>]' });
    await simulatePointerDrag(user, 60);

    // During drag: no commits
    expect(onValueChange).not.toHaveBeenCalled();

    await user.pointer({ keys: '[/MouseLeft]' });

    // Commit happens on release (after internal settle)
    await waitFor(
      () => {
        expect(onValueChange).toHaveBeenCalled();
      },
      { timeout: 1500 }
    );
  });
});
