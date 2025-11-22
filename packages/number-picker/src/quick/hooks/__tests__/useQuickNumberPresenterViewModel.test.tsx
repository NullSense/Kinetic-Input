import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useQuickNumberPresenterViewModel } from '../useQuickNumberPresenterViewModel';
import type { CollapsiblePickerTheme } from '../../types';
import type { PickerBodyProps } from '../../CollapsiblePicker.pickerBody';

const THEME: CollapsiblePickerTheme = {
  textColor: '#fff',
  activeTextColor: '#0ff',
  unitColor: '#ccc',
  selectedColor: '#fff',
  pendingColor: '#fff',
  hoverColor: '#fff',
  flashColor: '#fff',
  deselectColorA: '#000',
  deselectColorB: '#111',
  deselectColorOff: '#222',
  highlightBorderColor: '#0ff',
  highlightFillColor: 'rgba(0,0,0,0.5)',
  backdropColor: 'rgba(0,0,0,0.5)',
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

describe('useQuickNumberPresenterViewModel', () => {
  it('bundles label, aria, and picker props into a single view model', () => {
    const refs = {
      wrapperRef: React.createRef<HTMLDivElement>(),
      interactiveRef: React.createRef<HTMLDivElement>(),
      pickerRef: React.createRef<HTMLDivElement>(),
      highlightRef: React.createRef<HTMLDivElement>(),
    } as const;

    const pickerBodyProps: PickerBodyProps = {
      values: ['0', '1'],
      unit: 'kg',
      renderItem: () => null,
      hasCustomRenderItem: false,
      pickerWindowHeight: 200,
      itemHeightPx: 40,
      selectedValue: { value: '0' },
      handleValueChange: () => undefined,
      onGesture: () => undefined,
      showPicker: true,
      snapConfig: undefined,
    };

    const { result } = renderHook(() =>
      useQuickNumberPresenterViewModel({
        label: 'Weight',
        helperText: 'Select a value',
        ids: {
          controlId: 'ctrl',
          labelId: 'label',
          helperTextId: 'help',
          pickerWindowId: 'window',
        },
        lastValue: 10,
        currentValue: 12,
        unit: 'kg',
        onUseLastValue: () => undefined,
        layout: { collapsedHeight: 48, pickerWindowHeight: 200, pickerTranslate: 0 },
        pickerState: { showPicker: true, selectedIndex: 1, totalValues: 2 },
        aria: { min: 0, max: 20, valueNow: 12, valueText: '12 kg' },
        refs,
        handlers: {
          onPointerDown: () => undefined,
          onKeyDown: () => undefined,
        },
        highlightTapHandlers: {},
        pickerBodyProps,
        valueDisplay: { valueNode: <span>12</span>, maxSampleString: '-20', unit: 'kg' },
        cssVariables: { '--qni-item-height': '40px' },
        theme: THEME,
      })
    );

    expect(result.current.labelProps.helperTextId).toBe('help');
    expect(result.current.ariaProps.ariaValueText).toBe('12 kg');
    expect(result.current.pickerBodyProps).toBe(pickerBodyProps);
    expect(result.current.pickerState.selectedIndex).toBe(1);
  });
});
