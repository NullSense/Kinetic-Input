import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PickerBody } from './CollapsibleNumberPicker.pickerBody';
import type { PickerBodyProps } from './CollapsibleNumberPicker.pickerBody';
import type { CollapsiblePickerTheme } from './types';
import type { CSSProperties } from 'react';

export type CSSVariableStyles = CSSProperties & Record<`--${string}`, string>;

export interface LabelProps {
    label: React.ReactNode;
    labelId: string;
    helperText?: React.ReactNode;
    helperTextId: string;
    lastValue?: number;
    currentValue?: number;
    unit?: string;
    onUseLastValue?: () => void;
}

export interface AriaProps {
    controlId: string;
    ariaDescribedBy?: string;
    ariaValueMin?: number;
    ariaValueMax?: number;
    ariaValueNow?: number;
    ariaValueText?: string;
    pickerWindowId: string;
}

export interface SurfaceRefs {
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    interactiveRef: React.RefObject<HTMLDivElement | null>;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    highlightRef: React.RefObject<HTMLDivElement | null>;
}

export interface LayoutProps {
    collapsedHeight: number;
    pickerWindowHeight: number;
    pickerTranslate?: number;
}

export interface PickerStateProps {
    showPicker: boolean;
    showBackdrop: boolean;
    selectedIndex: number;
    totalValues: number;
}

export interface InteractionHandlers {
    onBackdropClick: () => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onKeyDown: React.KeyboardEventHandler;
}

export interface ValueDisplayProps {
    valueNode: React.ReactNode;
    maxSampleString: string;
    unit?: string;
}

export interface QuickNumberPresenterViewModel {
    labelProps: LabelProps;
    ariaProps: AriaProps;
    refs: SurfaceRefs;
    layout: LayoutProps;
    pickerState: PickerStateProps;
    handlers: InteractionHandlers;
    highlightTapHandlers: React.HTMLAttributes<HTMLDivElement>;
    pickerBodyProps: PickerBodyProps;
    valueDisplay: ValueDisplayProps;
    cssVariables: CSSVariableStyles;
    theme: CollapsiblePickerTheme;
}

interface CollapsibleNumberPickerPresenterProps {
    viewModel: QuickNumberPresenterViewModel;
}

/**
 * Visual shell for the quick number input, rendering the closed display,
 * picker surface, highlight chrome, and helper controls using a prebuilt view model.
 * @component
 * @param {CollapsibleNumberPickerPresenterProps} props
 * @returns {React.ReactElement}
 */
export function CollapsibleNumberPickerPresenter({ viewModel }: CollapsibleNumberPickerPresenterProps) {
    const {
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
    } = viewModel;
    const { label, labelId, helperText, helperTextId, lastValue, currentValue, unit, onUseLastValue } =
        labelProps;
    const {
        controlId,
        ariaDescribedBy,
        ariaValueMin,
        ariaValueMax,
        ariaValueNow,
        ariaValueText,
        pickerWindowId,
    } = ariaProps;
    const { wrapperRef, interactiveRef, pickerRef, highlightRef } = refs;
    const { collapsedHeight, pickerWindowHeight, pickerTranslate } = layout;
    const { showPicker, showBackdrop, selectedIndex, totalValues } = pickerState;
    const { onBackdropClick, onPointerDown, onKeyDown } = handlers;
    const { valueNode, maxSampleString } = valueDisplay;
    const closedHasValue = currentValue !== undefined;

    // Memoize inline styles to prevent unnecessary re-renders
    const closedDisplayStyle = useMemo<CSSProperties>(
        () => ({
            opacity: showPicker ? 0 : 1,
            visibility: showPicker ? ('hidden' as const) : ('visible' as const),
            pointerEvents: 'none' as const,
            transition: 'opacity 0.2s',
        }),
        [showPicker]
    );

    const pickerSurfaceStyle = useMemo<CSSProperties>(
        () => ({
            pointerEvents: 'auto' as const,
            zIndex: 10,
            cursor: showPicker ? 'grab' : 'pointer',
            // Set explicit height to match visible bounds (prevents extended hitbox)
            height: showPicker ? `${pickerWindowHeight}px` : `${collapsedHeight}px`,
            transform: showPicker ? `translateY(${pickerTranslate}px)` : undefined,
            transition: 'transform 0.2s ease-out',
            userSelect: 'none' as const,
        }),
        [pickerWindowHeight, pickerTranslate, showPicker, collapsedHeight]
    );

    const motionDivStyle = useMemo<CSSProperties>(
        () => ({
            backgroundColor: theme.fadeColor,
            borderColor: theme.highlightBorderColor,
            borderWidth: 2,
            borderStyle: 'solid',
            height: `${pickerWindowHeight}px`,
            transformOrigin: 'top',
        }),
        [pickerWindowHeight, theme.fadeColor, theme.highlightBorderColor]
    );

    const pickerWindowStyle = useMemo<CSSProperties>(
        () => ({ height: `${pickerWindowHeight}px` }),
        [pickerWindowHeight]
    );

    return (
        <div className="quick-number-input-root space-y-2" style={cssVariables}>
            <div className="flex items-center gap-2">
                <label
                    className="font-archivo text-sm uppercase tracking-wider"
                    style={{ color: theme.labelColor }}
                    htmlFor={controlId}
                    id={labelId}
                >
                    {label}
                </label>
                {lastValue !== undefined && currentValue !== lastValue && (
                    <button
                        type="button"
                        onClick={onUseLastValue}
                        className="font-archivo text-sm transition-colors"
                        style={{ color: theme.lastValueButtonColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                        ↺ LAST: {lastValue}
                        {unit}
                    </button>
                )}
            </div>

            <div className="relative min-h-[3rem] md:min-h-[3.5rem]" ref={wrapperRef}>
                <div
                    data-testid="qni-closed"
                    aria-hidden={showPicker}
                    style={closedDisplayStyle}
                >
                    <div
                        className="w-full h-12 md:h-14 px-4 transition-all flex items-center justify-center relative"
                        style={{
                            borderWidth: 2,
                            borderStyle: 'solid',
                            borderColor: closedHasValue ? theme.closedBorderColor : theme.closedBorderColorEmpty,
                            backgroundColor: closedHasValue ? theme.closedBackgroundColor : theme.closedBackgroundColorEmpty,
                        }}
                    >
                        <div className="qni-closed">
                            <span className="qni-ghost" aria-hidden>
                                {maxSampleString} {unit}
                            </span>
                            <div className="qni-inner">
                                <ChevronDown className="qni-chevron" />
                                <span className="qni-value">{valueNode}</span>
                                {unit && <span className="qni-unit">{unit}</span>}
                                <ChevronUp className="qni-chevron" />
                            </div>
                        </div>
                    </div>
                </div>

                {showPicker && showBackdrop && <div className="picker-backdrop" onClick={onBackdropClick} />}

                <div
                    className={`absolute top-0 left-0 right-0 overflow-hidden focus:outline-none ${
                        !showPicker ? 'h-12 md:h-14' : ''
                    } picker-surface`}
                    style={pickerSurfaceStyle}
                    id={controlId}
                    ref={interactiveRef}
                    role="spinbutton"
                    data-testid="picker-surface"
                    data-state={showPicker ? 'open' : 'closed'}
                    tabIndex={0}
                    aria-labelledby={labelId}
                    aria-describedby={ariaDescribedBy}
                    aria-valuemin={ariaValueMin}
                    aria-valuemax={ariaValueMax}
                    aria-valuenow={ariaValueNow}
                    aria-valuetext={ariaValueText}
                    aria-controls={pickerWindowId}
                    aria-expanded={showPicker}
                    aria-activedescendant={
                        showPicker && totalValues > 0
                            ? `picker-value-option-${selectedIndex}`
                            : undefined
                    }
                    onPointerDown={onPointerDown}
                    onKeyDown={onKeyDown}
                >
                    <motion.div
                        aria-hidden={!showPicker}
                        animate={{
                            opacity: showPicker ? 1 : 0,
                            scaleY: showPicker ? 1 : collapsedHeight / pickerWindowHeight,
                        }}
                        transition={{ duration: 0.2 }}
                        className={`overflow-hidden ${!showPicker ? 'h-12 md:h-14' : ''}`}
                        style={motionDivStyle}
                    >
                        <div
                            className="w-full relative"
                            style={pickerWindowStyle}
                            ref={pickerRef}
                            data-testid="picker-window"
                            id={pickerWindowId}
                            aria-hidden={!showPicker}
                            {...highlightTapHandlers}
                        >
                            <div className="picker-fade-top" />
                            <div className="picker-highlight-fill" aria-hidden />
                            <div className="picker-highlight picker-highlight-hitbox" ref={highlightRef} aria-hidden />
                            <div className="picker-fade-bottom" />
                            <div className="picker-container">
                                <PickerBody {...pickerBodyProps} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {helperText && (
                <p className="text-xs text-white/60 font-archivo leading-relaxed" id={helperTextId}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
