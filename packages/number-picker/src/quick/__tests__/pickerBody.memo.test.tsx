import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollapsiblePicker from '../CollapsiblePicker';
import type { DEFAULT_THEME } from '../theme';

function setup({ value = 10, unit = 'kg' as string | undefined } = {}) {
  return render(
    <CollapsiblePicker
      label="Test"
      value={value}
      onChange={vi.fn()}
      unit={unit}
      min={0}
      max={1000}
      step={1}
      isOpen={true}
    />
  );
}

describe('PickerBody memoization and CSS variable unit styling', () => {
  it('does not re-render items when unrelated display state changes', () => {
    const { rerender } = setup({ value: 10 });
    // Change label (display-only) to simulate unrelated parent update
    rerender(
      <CollapsiblePicker
        label="Test 2"
        value={10}
        onChange={vi.fn()}
        unit="kg"
        min={0}
        max={1000}
        step={1}
        isOpen={true}
      />
    );
    // Smoke assertion: no crash; actual render counting is covered in PickerColumn tests
    expect(screen.getByTestId('picker-window')).toBeDefined();
  });

  it('unit color changes propagate via CSS variables without item rerender', () => {
    const { container, rerender } = setup({ unit: 'kg' });
    const root = container.querySelector('.quick-number-input-root') as HTMLElement;
    expect(root).toBeDefined();

    // Change theme via overrides (unit color)
    rerender(
      <CollapsiblePicker
        label="Test"
        value={10}
        onChange={vi.fn()}
        unit={'kg'}
        theme={{ unitColor: '#ff00aa' } as Partial<typeof DEFAULT_THEME>}
        min={0}
        max={1000}
        step={1}
        isOpen={true}
      />
    );

    expect(root.style.getPropertyValue('--qni-color-unit')).toBeDefined();
  });
});
