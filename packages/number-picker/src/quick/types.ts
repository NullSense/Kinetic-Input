import type { ReactNode } from 'react';
import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';
import type { TimingPreset, TimingConfig } from '../config/timing';
import type { AudioAdapterOptions, FeedbackAdapters, HapticAdapterOptions } from './feedback';

/**
 * Theme configuration for CollapsiblePicker visual styling.
 *
 * Controls colors, typography, and visual states. All color properties accept any valid CSS color.
 * Use `buildTheme()` helper to override specific properties while keeping defaults.
 *
 * @see {@link buildTheme} for creating custom themes
 */
export interface CollapsiblePickerTheme {
    /** Text color for non-selected items */
    textColor: string;
    /** Text color for the active/selected item */
    activeTextColor: string;
    /** Color for the unit suffix (e.g., 'kg', 'mph') */
    unitColor: string;
    /** Color for selected item background/highlight */
    selectedColor: string;
    /** Color for items during selection transition */
    pendingColor: string;
    /** Hover state color for interactive elements */
    hoverColor: string;
    /** Flash color shown on value confirmation */
    flashColor: string;
    /** Primary deselect gradient color */
    deselectColorA: string;
    /** Secondary deselect gradient color */
    deselectColorB: string;
    /** Deselect color when effect is disabled */
    deselectColorOff: string;
    /** Border color for the selection highlight area */
    highlightBorderColor: string;
    /** Fill color for the selection highlight area */
    highlightFillColor: string;
    /** Backdrop overlay color when picker is open */
    backdropColor: string;
    /** Background gradient fade color */
    fadeColor: string;
    /** Font size (supports responsive values like clamp()) */
    fontSize: string;
    /** Font family stack */
    fontFamily: string;
    /** Border color when picker is closed with a value */
    closedBorderColor: string;
    /** Border color when picker is closed without a value */
    closedBorderColorEmpty: string;
    /** Background color when picker is closed with a value */
    closedBackgroundColor: string;
    /** Background color when picker is closed without a value */
    closedBackgroundColorEmpty: string;
    /** Color for the label text */
    labelColor: string;
    /** Color for the "restore last value" button */
    lastValueButtonColor: string;
    /** Focus ring color for keyboard navigation */
    focusRingColor: string;
}

/**
 * Context passed to custom `renderValue` function.
 *
 * @see {@link RenderValueFn}
 */
export interface CollapsiblePickerRenderValueContext {
    /** Unit suffix (e.g., 'kg') */
    unit: string;
    /** Whether picker is currently open/expanded */
    showPicker: boolean;
    /** Current numeric value */
    value: string | number;
}

/**
 * State passed to custom `renderItem` function for each picker item.
 *
 * @see {@link RenderItemFn}
 */
export interface CollapsiblePickerRenderItemState {
    /** True if this item is the current value */
    selected: boolean;
    /** True if this item is centered in viewport (may differ from selected during scrolling) */
    visuallySelected: boolean;
    /** Unit suffix (e.g., 'kg') */
    unit: string;
    /** True if item is animating out (deselect effect) */
    deselecting: boolean;
}


/**
 * Custom renderer for the collapsed/closed value display.
 *
 * @param displayValue - Formatted value to display
 * @param context - Additional context (unit, picker state, raw value)
 * @returns React node to render in closed state
 *
 * @example
 * ```tsx
 * <CollapsiblePicker
 *   renderValue={(value, { unit }) => (
 *     <span className="custom-value">{value} {unit}</span>
 *   )}
 * />
 * ```
 */
export type RenderValueFn = (
    displayValue: string | number,
    context: CollapsiblePickerRenderValueContext
) => ReactNode;

/**
 * Custom renderer for individual picker items in the scrollable list.
 *
 * @param value - Formatted value string
 * @param state - Item state (selected, deselecting, etc.)
 * @returns React node to render for this item
 *
 * @example
 * ```tsx
 * <CollapsiblePicker
 *   renderItem={(value, { selected, unit }) => (
 *     <div className={selected ? 'active' : ''}>
 *       {value} <span className="unit">{unit}</span>
 *     </div>
 *   )}
 * />
 * ```
 */
export type RenderItemFn = (value: string, state: CollapsiblePickerRenderItemState) => ReactNode;

/**
 * Props for CollapsiblePicker component
 *
 * Primary interface for the interactive collapsible picker.
 * Renamed from CollapsiblePickerProps for clarity (works with any values, not just numbers).
 */
export interface CollapsiblePickerProps {
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
    itemHeight?: number;
    theme?: Partial<CollapsiblePickerTheme>;
    renderValue?: RenderValueFn;
    renderItem?: RenderItemFn;
    helperText?: ReactNode;
    enableSnapPhysics?: boolean;
    snapPhysicsConfig?: Partial<SnapPhysicsConfig>;
    enableHaptics?: boolean;
    enableAudioFeedback?: boolean;
    feedbackConfig?: QuickPickerFeedbackConfig;
    wheelSensitivity?: number;
    wheelDeltaCap?: number;
    timingPreset?: TimingPreset;
    timingConfig?: Readonly<TimingConfig>;
    visualTweaks?: CollapsiblePickerVisualTweaks;
    showBackdrop?: boolean;
    /** @deprecated wheelMode is no longer supported - wheel scrolling is always enabled */
    wheelMode?: 'off' | 'natural' | 'inverted';
}


/**
 * Configuration for haptic and audio feedback systems.
 *
 * Controls vibration patterns and audio click sounds for picker interactions.
 */
export interface QuickPickerFeedbackConfig {
    /** Enable haptic vibration feedback (mobile only) */
    enableHaptics?: boolean;
    /** Enable audio click sounds */
    enableAudioFeedback?: boolean;
    /** Haptic vibration configuration */
    haptics?: HapticAdapterOptions;
    /** Audio feedback configuration */
    audio?: AudioAdapterOptions;
    /** Custom feedback adapters (advanced) */
    adapters?: Partial<FeedbackAdapters>;
}

/**
 * Advanced visual tweaks for picker animations and transitions.
 *
 * Fine-tune timing, scaling, and easing functions for item animations.
 * Most users should rely on defaults.
 */
export interface CollapsiblePickerVisualTweaks {
    /** Scale multiplier for active/selected item (default: 1.0) */
    activeScale?: number;
    /** Scale multiplier for deselecting item (default: 0.8) */
    deselectScale?: number;
    /** General transition duration in milliseconds */
    transitionMs?: number;
    /** Color transition duration in milliseconds */
    colorTransitionMs?: number;
    /** Scale transition duration in milliseconds */
    scaleTransitionMs?: number;
    /** Easing function for color transitions (CSS easing) */
    colorEasing?: string;
    /** Easing function for scale transitions (CSS easing) */
    scaleEasing?: string;
    /** Deselect fade animation duration in milliseconds */
    deselectFadeMs?: number;
    /** Final opacity for deselected items (0-1) */
    deselectOpacity?: number;
    /** Overshoot distance for trailing items (pixels) */
    trailOvershoot?: number;
    /** Padding around highlight area (pixels) */
    highlightPadding?: number;
}
