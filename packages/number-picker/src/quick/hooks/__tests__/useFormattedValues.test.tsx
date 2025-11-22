import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFormattedValues } from '../useFormattedValues';

describe('useFormattedValues', () => {
  it('trims trailing zeros for formatted values and display output', () => {
    const { result } = renderHook(() =>
      useFormattedValues({
        value: 11,
        lastValue: undefined,
        min: 10,
        max: 12,
        step: 0.25,
        placeholder: '--',
        initialValue: undefined,
      })
    );

    expect(result.current.values).toContain('11');
    expect(result.current.values).not.toContain('11.00');
    expect(result.current.displayValue).toBe('11');
  });
});
