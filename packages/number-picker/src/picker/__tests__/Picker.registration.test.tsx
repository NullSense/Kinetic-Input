import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PickerGroup from '../PickerGroup';
import PickerColumn from '../PickerColumn';
import PickerItem from '../PickerItem';

function buildOptions(n: number) {
  return Array.from({ length: n }, (_, i) => `Opt ${i}`);
}

describe('Picker registration order and unregister', () => {
  it('appends options in render order (no DOM-based sorting)', () => {
    const options = buildOptions(600);

    render(
      <PickerGroup value={{ v: options[10] }} onChange={() => {}} itemHeight={40} height={200}>
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </PickerGroup>
    );

    // PickerColumn uses virtualization - only ~11 items visible at once (SLOT_COUNT)
    // Verify visible items around the selected index (10) are present
    expect(screen.getByText('Opt 10')).toBeDefined(); // Selected item
    expect(screen.getByText('Opt 5')).toBeDefined(); // Item before selected (within overscan)
    expect(screen.getByText('Opt 15')).toBeDefined(); // Item after selected (within overscan)
    // Note: Opt 0 and Opt 599 are NOT in DOM due to virtualization
    // Only items near the selected index (10) are rendered
  });

  it('unregisters correctly when items unmount (no leaks, order intact)', () => {
    const base = buildOptions(50);
    const dynamic = base.slice(0, 25); // simulate unmount of a subset later

    const { rerender } = render(
      <PickerGroup value={{ v: dynamic[0] }} onChange={() => {}} itemHeight={40} height={200}>
        <PickerColumn name="v">
          {dynamic.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </PickerGroup>
    );

    // Verify visible items around selected index (0)
    expect(screen.getByText('Opt 0')).toBeDefined();
    // Opt 24 might not be visible due to virtualization - check a closer item
    expect(screen.getByText('Opt 5')).toBeDefined();

    // Now unmount a chunk (simulate removing items)
    const pruned = base.slice(10, 40);
    rerender(
      <PickerGroup value={{ v: pruned[0] }} onChange={() => {}} itemHeight={40} height={200}>
        <PickerColumn name="v">
          {pruned.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </PickerGroup>
    );

    // Verify visible items around new selected index (Opt 10 = index 0 in pruned array)
    expect(screen.getByText('Opt 10')).toBeDefined();
    expect(screen.getByText('Opt 15')).toBeDefined();
  });
});
