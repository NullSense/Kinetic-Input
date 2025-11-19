import { useMemo, type ReactNode } from 'react';
import type { CollapsiblePickerTheme } from '../types';
import type {
    AriaProps,
    CSSVariableStyles,
    InteractionHandlers,
    LabelProps,
    LayoutProps,
    QuickNumberPresenterViewModel,
    SurfaceRefs,
    ValueDisplayProps,
} from '../CollapsiblePicker.presenter';
import type { PickerBodyProps } from '../CollapsiblePicker.pickerBody';

interface UseQuickNumberPresenterViewModelArgs {
    label: ReactNode;
    helperText?: ReactNode;
    ids: {
        controlId: string;
        labelId: string;
        helperTextId: string;
        pickerWindowId: string;
    };
    lastValue?: number;
    currentValue?: number;
    unit?: string;
    onUseLastValue?: () => void;
    layout: LayoutProps;
    pickerState: {
        showPicker: boolean;
        selectedIndex: number;
        totalValues: number;
    };
    aria: {
        min?: number;
        max?: number;
        valueNow?: number;
        valueText?: string;
    };
    refs: SurfaceRefs;
    handlers: InteractionHandlers;
    highlightTapHandlers: React.HTMLAttributes<HTMLDivElement>;
    pickerBodyProps: PickerBodyProps;
    valueDisplay: ValueDisplayProps;
    cssVariables: CSSVariableStyles;
    theme: CollapsiblePickerTheme;
}

/**
 * Builds the presenter-facing view model containing label, aria, layout, and interaction props.
 * @param {object} params - Inputs from orchestration, presentation, and layout hooks.
 * @returns {QuickNumberPresenterViewModel} Immutable props for the presenter.
 */
export function useQuickNumberPresenterViewModel({
    label,
    helperText,
    ids,
    lastValue,
    currentValue,
    unit,
    onUseLastValue,
    layout,
    pickerState,
    aria,
    refs,
    handlers,
    highlightTapHandlers,
    pickerBodyProps,
    valueDisplay,
    cssVariables,
    theme,
}: UseQuickNumberPresenterViewModelArgs): QuickNumberPresenterViewModel {
    return useMemo(() => {
        const labelProps: LabelProps = {
            label,
            labelId: ids.labelId,
            helperText,
            helperTextId: ids.helperTextId,
            lastValue,
            currentValue,
            unit,
            onUseLastValue,
        };

        const ariaProps: AriaProps = {
            controlId: ids.controlId,
            ariaDescribedBy: helperText ? ids.helperTextId : undefined,
            ariaValueMin: aria.min,
            ariaValueMax: aria.max,
            ariaValueNow: aria.valueNow,
            ariaValueText: aria.valueText,
            pickerWindowId: ids.pickerWindowId,
        };

        return {
            labelProps,
            ariaProps,
            refs,
            layout,
            pickerState,
            handlers,
            highlightTapHandlers,
            pickerBodyProps,
            valueDisplay,
            cssVariables,
            theme,
        };
    }, [
        aria.max,
        aria.min,
        aria.valueNow,
        aria.valueText,
        cssVariables,
        currentValue,
        handlers,
        helperText,
        highlightTapHandlers,
        ids.controlId,
        ids.helperTextId,
        ids.labelId,
        ids.pickerWindowId,
        label,
        lastValue,
        layout,
        onUseLastValue,
        pickerBodyProps,
        pickerState,
        refs,
        theme,
        unit,
        valueDisplay,
    ]);
}

export type UseQuickNumberPresenterViewModelResult = ReturnType<
    typeof useQuickNumberPresenterViewModel
>;
