import { useState, useMemo, useCallback, useEffect } from 'react';
import { countDecimals, createFormatter } from '../utils';
import { generateRangeOptions } from '../../utils/pickerOptions';

type CachedFormattedValues = {
  values: string[];
  formattedValueMap: Map<string, string>;
};

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If at capacity, remove oldest (first) entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

const formattedValueCache = new LRUCache<string, CachedFormattedValues>(50);

const buildCacheKey = (min: number, max: number, step: number, decimals: number) =>
  `${min}|${max}|${step}|${decimals}`;

interface UseFormattedValuesOptions {
  value: number | undefined;
  lastValue: number | undefined;
  min: number;
  max: number;
  step: number;
  placeholder: string;
  initialValue?: number;
}

interface UseFormattedValuesResult {
  values: string[];
  selectedValue: { value: string };
  selectedIndex: number;
  setSelectedValue: React.Dispatch<React.SetStateAction<{ value: string }>>;
  formatValue: (val: number) => string;
  getValidValue: (val: number | undefined) => number;
  formattedValueMap: Map<string, string>;
  displayValue: string | number;
  decimalPlaces: number;
}

/**
 * Produces the formatted value list and selection helpers for the quick picker.
 * @param {object} params - Numeric range, locale, and formatting callbacks.
 * @returns {object}
 */
export const useFormattedValues = ({
  value,
  lastValue,
  min,
  max,
  step,
  placeholder,
  initialValue,
}: UseFormattedValuesOptions): UseFormattedValuesResult => {
  const decimalPlaces = useMemo(
    () => Math.max(countDecimals(step), countDecimals(min), countDecimals(max), 0),
    [step, min, max]
  );

  const formatValue = useMemo(() => createFormatter(decimalPlaces), [decimalPlaces]);

  const getValidValue = useCallback(
    (val: number | undefined): number => {
      if (val !== undefined && val >= min && val <= max) return val;
      if (initialValue !== undefined && initialValue >= min && initialValue <= max)
        return initialValue;
      if (lastValue !== undefined && lastValue >= min && lastValue <= max) return lastValue;
      return min;
    },
    [initialValue, lastValue, max, min]
  );

  const { values, formattedValueMap } = useMemo(() => {
    const cacheKey = buildCacheKey(min, max, step, decimalPlaces);
    const cached = formattedValueCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Use shared range generation utility
    const rangeOptions = generateRangeOptions({
      min,
      max,
      step,
      formatter: formatValue,
    });

    // Convert to the format useFormattedValues expects
    const arr: string[] = [];
    const map = new Map<string, string>();
    for (const option of rangeOptions) {
      arr.push(option.label);
      // Map from numeric value string to formatted label
      map.set(option.value.toString(), option.label);
    }

    const result = { values: arr, formattedValueMap: map };
    formattedValueCache.set(cacheKey, result);
    return result;
  }, [decimalPlaces, formatValue, max, min, step]);

  const currentValue = getValidValue(value);
  const [selectedValue, setSelectedValue] = useState<{ value: string }>({
    value: formatValue(currentValue),
  });

  useEffect(() => {
    const newValue = formatValue(currentValue);
    if (selectedValue.value !== newValue) {
      setSelectedValue({ value: newValue });
    }
  }, [currentValue, formatValue, selectedValue.value]);

  const selectedIndex = useMemo(() => {
    const idx = values.indexOf(selectedValue.value);
    return idx === -1 ? 0 : idx;
  }, [selectedValue.value, values]);

  const displayValue = value !== undefined ? formatValue(currentValue) : placeholder;

  return {
    values,
    selectedValue,
    selectedIndex,
    setSelectedValue,
    formatValue,
    getValidValue,
    formattedValueMap,
    displayValue: typeof displayValue === 'number' ? formatValue(displayValue) : displayValue,
    decimalPlaces,
  };
};
