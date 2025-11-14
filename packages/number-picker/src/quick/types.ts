import type { ReactNode } from 'react';
import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';
import type { TimingPreset, TimingConfig } from '../config/timing';

export interface CollapsibleNumberPickerTheme {
    textColor: string;
    activeTextColor: string;
    unitColor: string;
    selectedColor: string;
    pendingColor: string;
    hoverColor: string;
    flashColor: string;
    deselectColorA: string;
    deselectColorB: string;
    deselectColorOff: string;
    highlightBorderColor: string;
    highlightFillColor: string;
    backdropColor: string;
    fadeColor: string;
    fontSize: string;
    fontFamily: string;
    // Closed state styling
    closedBorderColor: string;
    closedBorderColorEmpty: string;
    closedBackgroundColor: string;
    closedBackgroundColorEmpty: string;
    labelColor: string;
    lastValueButtonColor: string;
    focusRingColor: string;
}

export interface CollapsibleNumberPickerRenderValueContext {
    unit: string;
    showPicker: boolean;
    value: string | number;
}

export interface CollapsibleNumberPickerRenderItemState {
    selected: boolean;
    visuallySelected: boolean;
    unit: string;
    deselecting: boolean;
}

export type RenderValueFn = (
    displayValue: string | number,
    context: CollapsibleNumberPickerRenderValueContext
) => ReactNode;

export type RenderItemFn = (value: string, state: CollapsibleNumberPickerRenderItemState) => ReactNode;

export interface CollapsibleNumberPickerProps {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
    unit: string;
    min?: number;
    max?: number;
    step?: number;
    lastValue?: number;
    initialValue?: number;
    placeholder?: string;
    isOpen?: boolean;
    onRequestOpen?: () => void;
    onRequestClose?: () => void;
    showBackdrop?: boolean;
    itemHeight?: number;
    theme?: Partial<CollapsibleNumberPickerTheme>;
    renderValue?: RenderValueFn;
    renderItem?: RenderItemFn;
    helperText?: ReactNode;
    enableSnapPhysics?: boolean;
    snapPhysicsConfig?: Partial<SnapPhysicsConfig>;
    enableHaptics?: boolean;
    enableAudioFeedback?: boolean;
    wheelMode?: 'off' | 'natural' | 'inverted';
    timingPreset?: TimingPreset;
    timingConfig?: Readonly<TimingConfig>;
    visualTweaks?: CollapsibleNumberPickerVisualTweaks;
}

export interface CollapsibleNumberPickerVisualTweaks {
    activeScale?: number;
    deselectScale?: number;
    transitionMs?: number;
    colorTransitionMs?: number;
    scaleTransitionMs?: number;
    colorEasing?: string;
    scaleEasing?: string;
    deselectFadeMs?: number;
    deselectOpacity?: number;
    trailOvershoot?: number;
    highlightPadding?: number;
}
