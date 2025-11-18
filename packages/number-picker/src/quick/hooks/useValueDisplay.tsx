import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import type { CollapsiblePickerProps, CollapsiblePickerRenderValueContext } from '../types';

interface ValueDisplayTheme {
  textColor: string;
  activeTextColor: string;
}

type FormatValueFn = (value: number) => string;

type ValueDisplayOptions = {
  displayValue: string | number | undefined;
  value: number | undefined;
  min: number;
  max: number;
  unit?: string;
  theme: ValueDisplayTheme;
  formatValue: FormatValueFn;
  formattedValueMap: Map<string, string>;
  renderValue?: CollapsiblePickerProps['renderValue'];
  showPicker: boolean;
};

/**
 * Returns the widest string sample used to size the closed display.
 * @param {object} params - Value list and placeholder inputs.
 * @returns {string}
 */
export const computeMaxSampleString = ({
  min,
  max,
  fallback,
  formatValue,
}: {
  min: number;
  max: number;
  fallback: string | number | undefined;
  formatValue: FormatValueFn;
}) => {
  const candidates = [min, max, -min, -max].filter((n) => Number.isFinite(n));
  if (candidates.length === 0) {
    return String(fallback ?? '');
  }

  const formatted = candidates.map((n) => formatValue(n));
  formatted.sort((a, b) => b.length - a.length);
  return formatted[0] ?? String(fallback ?? '');
};

/**
 * Memoizes the rendered value node and supporting aria strings for the closed surface.
 * @param {object} params - Formatting inputs and render overrides.
 * @returns {{ valueNode: React.ReactNode, ariaValueText?: string }}
 */
export const useValueDisplay = ({
  displayValue,
  value,
  min,
  max,
  unit,
  theme,
  formatValue,
  formattedValueMap,
  renderValue,
  showPicker,
}: ValueDisplayOptions) => {
  const formattedDisplayValue = useMemo(() => {
    if (typeof displayValue === 'number') {
      const lookup = formattedValueMap.get(displayValue.toString());
      return lookup ?? formatValue(displayValue);
    }
    return displayValue;
  }, [displayValue, formatValue, formattedValueMap]);

  const maxSampleString = useMemo(
    () =>
      computeMaxSampleString({
        min,
        max,
        fallback: formattedDisplayValue,
        formatValue,
      }),
    [formatValue, formattedDisplayValue, max, min]
  );

  const renderValueContext: CollapsiblePickerRenderValueContext = useMemo(
    () => ({
      unit,
      showPicker,
      value: formattedDisplayValue,
    }),
    [formattedDisplayValue, showPicker, unit]
  );

  const valueDisplayStyle = useMemo(
    () => ({
      fontSize: 'var(--qni-font-size)',
      color: value !== undefined ? theme.activeTextColor : theme.textColor,
    }),
    [theme.activeTextColor, theme.textColor, value]
  );

  const defaultValueNode = useMemo(
    () => (
      <m.span
        key={formattedDisplayValue}
        data-testid="quick-number-display"
        animate={{ filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'] }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="font-geist-mono font-bold"
        style={valueDisplayStyle}
      >
        {formattedDisplayValue}
      </m.span>
    ),
    [formattedDisplayValue, valueDisplayStyle]
  );

  const valueNode = useMemo(() => {
    if (!renderValue) {
      return defaultValueNode;
    }
    const rendered = renderValue(formattedDisplayValue, renderValueContext);
    return rendered ?? defaultValueNode;
  }, [defaultValueNode, formattedDisplayValue, renderValue, renderValueContext]);

  return {
    formattedDisplayValue,
    maxSampleString,
    renderValueContext,
    valueNode,
  };
};
