import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { computeMaxSampleString, useValueDisplay } from '../useValueDisplay';

describe('useValueDisplay', () => {
  const theme = { textColor: '#fff', activeTextColor: '#0ff' };
  const formatValue = (val: number) => val.toFixed(1);

  it('computes the longest formatted sample string', () => {
    const sample = computeMaxSampleString({
      min: 1,
      max: 200,
      fallback: '10',
      formatValue,
    });

    expect(sample).toBe('-200.0');
  });

  it('reuses cached formatted values and allows custom renderers', () => {
    const formattedValueMap = new Map<string, string>([['0.3', '0.30']]);

    const Harness = () => {
      const { formattedDisplayValue, maxSampleString, valueNode } = useValueDisplay({
        displayValue: 0.3,
        value: 0.3,
        min: 0,
        max: 10,
        unit: '%',
        theme,
        formatValue,
        formattedValueMap,
        showPicker: false,
        renderValue: (val) => <span data-testid="custom-value">{val} custom</span>,
      });

      return (
        <div>
          <span data-testid="formatted">{formattedDisplayValue}</span>
          <span data-testid="sample">{maxSampleString}</span>
          <div data-testid="value-node">{valueNode}</div>
        </div>
      );
    };

    render(<Harness />);

    expect(screen.getByTestId('formatted')).toHaveTextContent('0.30');
    expect(screen.getByTestId('sample')).toHaveTextContent('10.0');
    expect(screen.getByTestId('custom-value')).toHaveTextContent('0.30 custom');
    expect(screen.getByTestId('value-node')).toHaveTextContent('0.30 custom');
  });
});
