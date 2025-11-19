import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useQuickNumberPresentation } from '../useQuickNumberPresentation';
import type { CollapsiblePickerTheme } from '../../types';

const THEME: CollapsiblePickerTheme = {
    textColor: '#fff',
    activeTextColor: '#0ff',
    unitColor: '#ccc',
    selectedColor: '#fff',
    pendingColor: '#fff',
    hoverColor: '#fff',
    flashColor: '#fff',
    deselectColorA: '#222',
    deselectColorB: '#333',
    deselectColorOff: '#111',
    highlightBorderColor: '#0ff',
    highlightFillColor: 'rgba(62,220,255,0.15)',
    backdropColor: 'rgba(0,0,0,0.6)',
    fadeColor: 'rgba(0,0,0,0.5)',
    fontSize: '16px',
    fontFamily: 'Archivo, sans-serif',
    closedBorderColor: '#0ff',
    closedBorderColorEmpty: 'rgba(62, 220, 255, 0.2)', // Match DEFAULT_THEME
    closedBackgroundColor: 'rgba(0,0,0,0.5)',
    closedBackgroundColorEmpty: 'rgba(0,0,0,0.3)',
    labelColor: '#ccc',
    lastValueButtonColor: '#0ff',
    focusRingColor: 'rgba(0,255,255,0.7)',
};

const BASE_PROPS = {
    value: 10,
    lastValue: undefined,
    min: 0,
    max: 20,
    step: 10,
    placeholder: '--',
    initialValue: 0,
    showPicker: false,
    unit: 'kg',
    theme: THEME,
    visualTweaks: { highlightPadding: 6 },
    itemHeightPx: 40,
    pickerWindowHeight: 200,
    renderValue: undefined,
} as const;

describe('useQuickNumberPresentation', () => {
    it('combines formatted values with highlight metrics', () => {
        const { result } = renderHook(() => useQuickNumberPresentation(BASE_PROPS));

        expect(result.current.values).toEqual(['0', '10', '20']);
        expect(result.current.maxSampleString).toBe('-20');
        expect(result.current.cssVariables['--picker-highlight-height']).toBe('28px');
        expect(result.current.cssVariables['--qni-row-height']).toBe('40px');
        expect(result.current.cssVariables['--qni-visible-rows']).toBe('5');
        expect(result.current.selectedIndex).toBe(1);
        expect(result.current.ariaValueText).toBe('10 kg');
    });

    it('respects custom renderValue output for the display node', () => {
        const { result } = renderHook(() =>
            useQuickNumberPresentation({
                ...BASE_PROPS,
                showPicker: true,
                renderValue: (val) => <span data-testid="custom">{val} custom</span>,
            })
        );

        const rendered = result.current.valueNode as React.ReactElement<{ children: React.ReactNode }>;
        expect(rendered.props['data-testid']).toBe('custom');
        const props = rendered.props as { children?: React.ReactNode };
        expect(props.children).toContain('10');
    });
});
