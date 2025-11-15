import { describe, expect, it } from 'vitest';
import {
  countDecimals,
  generateRangeOptions,
  normalizeOptions,
  mergeSnapConfig,
  type PickerOption,
} from '../pickerOptions';
import { DEFAULT_SNAP_PHYSICS } from '../../config/physics';

// Test helpers
const customFormatter = (val: number) => `$${val.toFixed(2)}`;

// ============ countDecimals Tests ============

describe('countDecimals', () => {
  it('returns 0 for integers', () => {
    expect(countDecimals(0)).toBe(0);
    expect(countDecimals(1)).toBe(0);
    expect(countDecimals(100)).toBe(0);
    expect(countDecimals(-42)).toBe(0);
  });

  it('counts decimal places correctly', () => {
    expect(countDecimals(1.5)).toBe(1);
    expect(countDecimals(2.25)).toBe(2);
    expect(countDecimals(3.123)).toBe(3);
    expect(countDecimals(-4.5678)).toBe(4);
  });

  it('handles scientific notation', () => {
    expect(countDecimals(1e-1)).toBe(1); // 0.1
    expect(countDecimals(1e-2)).toBe(2); // 0.01
    expect(countDecimals(1e-5)).toBe(5); // 0.00001
    expect(countDecimals(1.5e-2)).toBe(3); // 0.015 (1 decimal in base + 2 in exponent)
  });

  it('handles edge cases', () => {
    expect(countDecimals(Infinity)).toBe(0);
    expect(countDecimals(-Infinity)).toBe(0);
    expect(countDecimals(NaN)).toBe(0);
  });

  it('handles numbers with trailing zeros', () => {
    expect(countDecimals(1.0)).toBe(0);
    expect(countDecimals(1.5)).toBe(1);
    expect(countDecimals(1.50)).toBe(1); // JavaScript normalizes this
  });
});

// ============ generateRangeOptions Tests ============

describe('generateRangeOptions', () => {
  it('generates integer range correctly', () => {
    const options = generateRangeOptions({ min: 0, max: 5, step: 1 });

    expect(options).toHaveLength(6);
    expect(options[0]).toEqual({ key: 'range-0', value: 0, label: '0' });
    expect(options[5]).toEqual({ key: 'range-5', value: 5, label: '5' });
  });

  it('generates decimal range with proper precision', () => {
    const options = generateRangeOptions({ min: 0, max: 1, step: 0.25 });

    expect(options).toHaveLength(5);
    expect(options.map((o) => o.value)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(options.map((o) => o.label)).toEqual(['0', '0.25', '0.5', '0.75', '1']);
  });

  it('trims trailing zeros in labels', () => {
    const options = generateRangeOptions({ min: 10, max: 12, step: 0.25 });

    expect(options.map((o) => o.label)).toEqual([
      '10',
      '10.25',
      '10.5',
      '10.75',
      '11',
      '11.25',
      '11.5',
      '11.75',
      '12',
    ]);
    // Should NOT have "10.00", "11.00", "12.00"
  });

  it('handles floating-point precision correctly', () => {
    // Classic floating-point issue: 0.1 + 0.2 = 0.30000000000000004
    const options = generateRangeOptions({ min: 0, max: 0.3, step: 0.1 });

    expect(options).toHaveLength(4);
    expect(options.map((o) => o.value)).toEqual([0, 0.1, 0.2, 0.3]);
    expect(options.map((o) => o.label)).toEqual(['0', '0.1', '0.2', '0.3']);
  });

  it('handles negative ranges', () => {
    const options = generateRangeOptions({ min: -5, max: -1, step: 1 });

    expect(options).toHaveLength(5);
    expect(options.map((o) => o.value)).toEqual([-5, -4, -3, -2, -1]);
  });

  it('handles ranges crossing zero', () => {
    const options = generateRangeOptions({ min: -2, max: 2, step: 1 });

    expect(options).toHaveLength(5);
    expect(options.map((o) => o.value)).toEqual([-2, -1, 0, 1, 2]);
  });

  it('returns single option for invalid step', () => {
    const zeroStep = generateRangeOptions({ min: 5, max: 10, step: 0 });
    expect(zeroStep).toHaveLength(1);
    expect(zeroStep[0]).toEqual({ key: 'range-0', value: 5, label: '5' });

    const negativeStep = generateRangeOptions({ min: 5, max: 10, step: -1 });
    expect(negativeStep).toHaveLength(1);
    expect(negativeStep[0]).toEqual({ key: 'range-0', value: 5, label: '5' });
  });

  it('handles min === max', () => {
    const options = generateRangeOptions({ min: 5, max: 5, step: 1 });

    expect(options).toHaveLength(1);
    expect(options[0]).toEqual({ key: 'range-0', value: 5, label: '5' });
  });

  it('handles large ranges efficiently', () => {
    const options = generateRangeOptions({ min: 0, max: 1000, step: 1 });

    expect(options).toHaveLength(1001);
    expect(options[0].value).toBe(0);
    expect(options[500].value).toBe(500);
    expect(options[1000].value).toBe(1000);
  });

  it('uses custom formatter when provided', () => {
    const options = generateRangeOptions({
      min: 0,
      max: 2,
      step: 1,
      formatter: customFormatter,
    });

    expect(options.map((o) => o.label)).toEqual(['$0.00', '$1.00', '$2.00']);
    expect(options.map((o) => o.value)).toEqual([0, 1, 2]);
  });

  it('handles very small decimal steps', () => {
    const options = generateRangeOptions({ min: 0, max: 0.003, step: 0.001 });

    expect(options).toHaveLength(4);
    expect(options.map((o) => o.value)).toEqual([0, 0.001, 0.002, 0.003]);
    expect(options.map((o) => o.label)).toEqual(['0', '0.001', '0.002', '0.003']);
  });

  it('generates unique keys for each option', () => {
    const options = generateRangeOptions({ min: 0, max: 3, step: 1 });
    const keys = options.map((o) => o.key);

    expect(keys).toEqual(['range-0', 'range-1', 'range-2', 'range-3']);
    expect(new Set(keys).size).toBe(keys.length); // All unique
  });
});

// ============ normalizeOptions Tests ============

describe('normalizeOptions', () => {
  it('normalizes options with labels', () => {
    const input: PickerOption[] = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];

    const result = normalizeOptions(input);

    expect(result).toEqual([
      { value: 1, label: 'One', key: 'opt-0-1' },
      { value: 2, label: 'Two', key: 'opt-1-2' },
    ]);
  });

  it('generates labels from values when missing', () => {
    const input: PickerOption[] = [{ value: 1 }, { value: 2 }];

    const result = normalizeOptions(input);

    expect(result).toEqual([
      { value: 1, label: '1', key: 'opt-0-1' },
      { value: 2, label: '2', key: 'opt-1-2' },
    ]);
  });

  it('handles string values', () => {
    const input: PickerOption[] = [
      { value: 'small', label: 'Small' },
      { value: 'large' },
    ];

    const result = normalizeOptions(input);

    expect(result).toEqual([
      { value: 'small', label: 'Small', key: 'opt-0-small' },
      { value: 'large', label: 'large', key: 'opt-1-large' },
    ]);
  });

  it('handles mixed numeric and string values', () => {
    const input: PickerOption[] = [
      { value: 1, label: 'First' },
      { value: 'custom' },
      { value: 3 },
    ];

    const result = normalizeOptions(input);

    expect(result).toEqual([
      { value: 1, label: 'First', key: 'opt-0-1' },
      { value: 'custom', label: 'custom', key: 'opt-1-custom' },
      { value: 3, label: '3', key: 'opt-2-3' },
    ]);
  });

  it('preserves accentColor property', () => {
    const input: PickerOption[] = [
      { value: 1, label: 'Red', accentColor: '#FF0000' },
      { value: 2, label: 'Blue', accentColor: '#0000FF' },
    ];

    const result = normalizeOptions(input);

    expect(result[0].accentColor).toBe('#FF0000');
    expect(result[1].accentColor).toBe('#0000FF');
  });

  it('handles empty array', () => {
    const result = normalizeOptions([]);
    expect(result).toEqual([]);
  });

  it('generates unique keys for duplicate values', () => {
    // If values repeat, keys should still be unique due to index
    const input: PickerOption[] = [
      { value: 1, label: 'First One' },
      { value: 1, label: 'Second One' },
    ];

    const result = normalizeOptions(input);

    expect(result[0].key).toBe('opt-0-1');
    expect(result[1].key).toBe('opt-1-1');
    expect(result[0].key).not.toBe(result[1].key);
  });

  it('handles decimal values in keys', () => {
    const input: PickerOption[] = [
      { value: 1.5, label: 'One point five' },
      { value: 2.75 },
    ];

    const result = normalizeOptions(input);

    expect(result[0].key).toBe('opt-0-1.5');
    expect(result[1].key).toBe('opt-1-2.75');
    expect(result[1].label).toBe('2.75');
  });
});

// ============ mergeSnapConfig Tests ============

describe('mergeSnapConfig', () => {
  it('returns undefined when disabled', () => {
    const result = mergeSnapConfig(false);
    expect(result).toBeUndefined();
  });

  it('returns default config when enabled without custom config', () => {
    const result = mergeSnapConfig(true);

    expect(result).toEqual({
      ...DEFAULT_SNAP_PHYSICS,
      enabled: true,
    });
  });

  it('merges custom config with defaults', () => {
    const result = mergeSnapConfig(true, {
      snapRange: 2.0,
      pullStrength: 2.5,
    });

    expect(result).toEqual({
      ...DEFAULT_SNAP_PHYSICS,
      snapRange: 2.0,
      pullStrength: 2.5,
      enabled: true,
    });
  });

  it('overrides enabled flag to true even if custom config says false', () => {
    const result = mergeSnapConfig(true, {
      enabled: false, // This should be overridden
      snapRange: 1.5,
    });

    expect(result?.enabled).toBe(true);
    expect(result?.snapRange).toBe(1.5);
  });

  it('returns undefined when disabled, ignoring custom config', () => {
    const result = mergeSnapConfig(false, {
      snapRange: 2.0,
      pullStrength: 3.0,
    });

    expect(result).toBeUndefined();
  });

  it('handles empty config object', () => {
    const result = mergeSnapConfig(true, {});

    expect(result).toEqual({
      ...DEFAULT_SNAP_PHYSICS,
      enabled: true,
    });
  });

  it('preserves all DEFAULT_SNAP_PHYSICS properties', () => {
    const result = mergeSnapConfig(true);

    expect(result).toHaveProperty('snapRange');
    expect(result).toHaveProperty('enterThreshold');
    expect(result).toHaveProperty('exitThreshold');
    expect(result).toHaveProperty('velocityThreshold');
    expect(result).toHaveProperty('velocityScaling');
    expect(result).toHaveProperty('pullStrength');
    expect(result).toHaveProperty('velocityReducer');
    expect(result).toHaveProperty('centerLock');
    expect(result).toHaveProperty('rangeScaleIntensity');
    expect(result).toHaveProperty('rangeScaleVelocityCap');
    expect(result).toHaveProperty('enabled');
  });
});
