import { useMemo } from 'react';
import { useFormattedValues } from './useFormattedValues';
import { useResolvedVisualTweaks } from './useResolvedVisualTweaks';
import { useHighlightMetrics } from './useHighlightMetrics';
import { useValueDisplay } from './useValueDisplay';
import type { CollapsibleNumberPickerVisualTweaks, CollapsibleNumberPickerTheme, RenderValueFn } from '../types';
import type { CSSVariableStyles } from '../CollapsibleNumberPicker.presenter';

interface UseQuickNumberPresentationArgs {
    value: number | undefined;
    lastValue: number | undefined;
    min: number;
    max: number;
    step: number;
    placeholder: string;
    initialValue?: number;
    showPicker: boolean;
    unit?: string;
    theme: CollapsibleNumberPickerTheme;
    visualTweaks?: CollapsibleNumberPickerVisualTweaks;
    itemHeightPx: number;
    pickerWindowHeight: number;
    renderValue?: RenderValueFn;
}

/**
 * Derives the formatted values, selection metadata, aria strings, and CSS variables
 * needed to render the quick number input based on props and runtime theme tweaks.
 * @param {object} params - Presentation inputs including value range, theme, and renderers.
 * @returns {object} Derived value/visual state for the picker surface.
 */
export const useQuickNumberPresentation = ({
    value,
    lastValue,
    min,
    max,
    step,
    placeholder,
    initialValue,
    showPicker,
    unit,
    theme,
    visualTweaks,
    itemHeightPx,
    pickerWindowHeight,
    renderValue,
}: UseQuickNumberPresentationArgs) => {
    const formatted = useFormattedValues({
        value,
        lastValue,
        min,
        max,
        step,
        placeholder,
        initialValue,
    });

    const decimalPlaces = formatted.decimalPlaces;

    const totalValues = formatted.values.length;
    const selectedIndex = useMemo(() => {
        const clampedIndex = Math.max(0, Math.min(totalValues - 1, formatted.selectedIndex ?? 0));
        return Number.isFinite(clampedIndex) ? clampedIndex : 0;
    }, [formatted.selectedIndex, totalValues]);

    const numericValue = useMemo(() => {
        if (totalValues === 0) {
            return min;
        }
        const raw = Number((min + step * selectedIndex).toFixed(decimalPlaces));
        return Math.min(max, Math.max(min, raw));
    }, [decimalPlaces, max, min, selectedIndex, step, totalValues]);

    const ariaValueText = useMemo(() => {
        const formattedValue = formatted.values[selectedIndex] ?? formatted.selectedValue.value;
        return unit ? `${formattedValue} ${unit}` : formattedValue;
    }, [selectedIndex, formatted.selectedValue.value, unit, formatted.values]);

    const resolvedVisualTweaks = useResolvedVisualTweaks(visualTweaks);
    const {
        activeScale,
        deselectScale,
        colorTransitionMs,
        scaleTransitionMs,
        colorEasing,
        scaleEasing,
        deselectFadeMs,
        deselectOpacity,
        trailOvershoot,
        highlightPadding,
    } = resolvedVisualTweaks;

    const { trailStartScale, highlightPaddingPx, highlightHeightPx } = useHighlightMetrics({
        itemHeight: itemHeightPx,
        tweaks: {
            activeScale,
            deselectScale,
            highlightPadding,
            trailOvershoot,
        },
    });

    const cssVariables = useMemo<CSSVariableStyles>(() => ({
        '--qni-item-height': `${itemHeightPx}px`,
        '--qni-picker-height': `${pickerWindowHeight}px`,
        '--qni-color-text': theme.textColor,
        '--qni-color-text-active': theme.activeTextColor,
        '--qni-color-unit': theme.unitColor,
        '--qni-color-highlight-border': theme.highlightBorderColor,
        '--qni-color-highlight-fill': theme.highlightFillColor,
        '--picker-highlight-color': theme.highlightBorderColor,
        '--qni-color-backdrop': theme.backdropColor,
        '--qni-color-fade': theme.fadeColor,
        '--qni-font-size': theme.fontSize,
        '--qni-font-family': theme.fontFamily,
        '--qni-active-scale': `${activeScale}`,
        '--qni-deselect-scale': `${deselectScale}`,
        '--qni-deselect-fade': `${deselectFadeMs}ms`,
        '--qni-deselect-opacity': `${deselectOpacity}`,
        '--qni-trail-start-scale': `${trailStartScale}`,
        '--qni-highlight-padding': `${highlightPaddingPx}px`,
        '--qni-highlight-height': `${highlightHeightPx}px`,
        '--picker-highlight-height': `${highlightHeightPx}px`,
        '--picker-highlight-padding': `${highlightPaddingPx}px`,
        '--qni-transition-color': `${colorTransitionMs}ms`,
        '--qni-transition-transform': `${scaleTransitionMs}ms`,
        '--qni-transition-opacity': `${colorTransitionMs}ms`,
        '--qni-color-ease': colorEasing,
        '--qni-scale-ease': scaleEasing,
    }), [
        activeScale,
        colorEasing,
        colorTransitionMs,
        deselectFadeMs,
        deselectOpacity,
        deselectScale,
        highlightHeightPx,
        highlightPaddingPx,
        itemHeightPx,
        pickerWindowHeight,
        scaleEasing,
        scaleTransitionMs,
        theme,
        trailStartScale,
    ]);

    const valueDisplay = useValueDisplay({
        displayValue: formatted.displayValue,
        value,
        min,
        max,
        unit,
        theme,
        formatValue: formatted.formatValue,
        formattedValueMap: formatted.formattedValueMap,
        renderValue,
        showPicker,
    });

    return {
        values: formatted.values,
        selectedValue: formatted.selectedValue,
        setSelectedValue: formatted.setSelectedValue,
        selectedIndex,
        totalValues,
        numericValue,
        ariaValueText,
        valueNode: valueDisplay.valueNode,
        maxSampleString: valueDisplay.maxSampleString,
        cssVariables,
    };
};
