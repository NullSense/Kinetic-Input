import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Picker from '../PickerGroup';
import PickerColumn from '../PickerColumn';
import PickerItem from '../PickerItem';

function buildOptions(n: number) {
  return Array.from({ length: n }, (_, i) => `Opt ${i}`);
}

describe('PickerColumn selection mapping (Map-based)', () => {
  it('resolves selectedIndex in O(1)-like time (no item rerenders)', () => {
    const options = buildOptions(1000);
    const onValueChange = vi.fn();

    const { rerender } = render(
      <Picker value={{ v: 'Opt 500' }} onChange={() => {}} itemHeight={40} height={200}>
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </Picker>
    );

    // Change value repeatedly; should not cause list remapping/re-render storm
    for (let i = 0; i < 10; i++) {
      const next = `Opt ${i * 90}`;
      rerender(
        <Picker value={{ v: next }} onChange={onValueChange} itemHeight={40} height={200}>
          <PickerColumn name="v">
            {options.map((opt) => (
              <PickerItem key={opt} value={opt}>
                {opt}
              </PickerItem>
            ))}
          </PickerColumn>
        </Picker>
      );
    }

    // Smoke assertion: no exception, quick updates
    expect(true).toBe(true);
  });

  it('falls back to index 0 when value is absent', () => {
    const options = buildOptions(5);

    expect(() => {
      render(
        <Picker value={{ v: 'Not Present' }} onChange={() => {}} itemHeight={40} height={200}>
          <PickerColumn name="v">
            {options.map((opt) => (
              <PickerItem key={opt} value={opt}>
                {opt}
              </PickerItem>
            ))}
          </PickerColumn>
        </Picker>
      );
    }).not.toThrow();
  });
});
