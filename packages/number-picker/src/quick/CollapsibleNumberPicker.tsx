import React, { useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { ITEM_HEIGHT } from '../config/ui';
import { DEFAULT_SNAP_PHYSICS } from '../config/physics';
import { useResolvedTheme } from './hooks/useResolvedTheme';
import { usePickerVisibility } from './hooks/usePickerVisibility';
import { usePickerCoordinator } from './hooks/usePickerCoordinator';
import { CollapsibleNumberPickerPresenter } from './CollapsibleNumberPicker.presenter';
import { useQuickNumberPresentation } from './hooks/useQuickNumberPresentation';
import { useQuickPickerFeedbackService } from './hooks/useQuickPickerFeedbackService';
import { useQuickNumberControllers } from './hooks/useQuickNumberControllers';
import { useQuickNumberPresenterViewModel } from './hooks/useQuickNumberPresenterViewModel';
import type {
    CollapsiblePickerProps,
    CollapsiblePickerRenderItemState,
    RenderItemFn
} from './types';
import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';

/**
 * Renders the fully wired quick number picker surface, delegating formatting,
 * gesture orchestration, accessibility, and presentation to extracted hooks.
 * @component
 * @param {CollapsiblePickerProps} props - Configuration for value range, theming, and behavior.
 * @returns {React.ReactElement}
 */
const CollapsibleNumberPickerComponent: React.FC<CollapsiblePickerProps> = ({
    label,
    value,
    onChange,
    unit,
    min = 0,
    max = 500,
    step = 1,
    lastValue,
    placeholder = '—',
    initialValue,
    isOpen: controlledIsOpen,
    onRequestOpen,
    onRequestClose,
    showBackdrop = false,
    itemHeight: itemHeightProp,
    theme: themeOverrides,
    renderValue,
    renderItem,
    helperText,
    enableSnapPhysics = true,
    snapPhysicsConfig,
    enableHaptics = true,
    enableAudioFeedback = true,
    wheelMode = 'inverted',
    visualTweaks,
    timingPreset,
    timingConfig,
}) => {
    const {
        showPicker,
        isControlled,
        openPicker: openPickerInternal,
        closePicker: closePickerInternal
    } = usePickerVisibility({
        controlledIsOpen,
        onRequestOpen,
        onRequestClose
    });

    const theme = useResolvedTheme(themeOverrides);

    const controlId = useId();
    const labelId = useId();
    const helperTextId = useId();
    const pickerWindowId = useId();

    const itemHeightPx = itemHeightProp ?? ITEM_HEIGHT;
    const pickerWindowHeight = itemHeightPx * 5;
    const collapsedHeight = 48;
    const pickerTranslate = showPicker
        ? -(pickerWindowHeight / 2 - collapsedHeight / 2)
        : undefined;

    const pickerSnapConfig = useMemo<SnapPhysicsConfig | undefined>(() => {
        if (!enableSnapPhysics) {
            return undefined;
        }
        return { ...DEFAULT_SNAP_PHYSICS, ...(snapPhysicsConfig ?? {}), enabled: true };
    }, [enableSnapPhysics, snapPhysicsConfig]);

    const {
        values,
        selectedValue,
        setSelectedValue,
        selectedIndex,
        totalValues,
        numericValue,
        ariaValueText,
        valueNode,
        maxSampleString,
        cssVariables,
    } = useQuickNumberPresentation({
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
    });

    const {
        timing,
        handleVisualValueChange,
        handleValueChange,
        playConfirmationIfChanged,
    } = useQuickPickerFeedbackService({
        enableHaptics,
        enableAudioFeedback,
        showPicker,
        selectedValue,
        setSelectedValue,
        onChange,
        timingConfig,
        timingPreset,
    });

    const {
        wrapperRef,
        interactiveRef,
        pickerRef,
        highlightRef,
        stateMachine,
        highlightTapHandlers,
        handlePickerOpen,
        handlePickerClose,
        handlePointerDown,
        onGesture,
        openedViaRef,
        currentGestureSource,
        isOpeningInteraction,
        deferGestureCloseRef,
    } = usePickerCoordinator({
        visibility: {
            showPicker,
            isControlled,
            openPicker: openPickerInternal,
            closePicker: closePickerInternal,
        },
        selectedValue,
        timing,
        playConfirmationIfChanged,
    });

    const handleBackdropClick = useCallback(() => {
        handlePickerClose('backdrop-click');
    }, [handlePickerClose]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            if (isControlled && !onRequestOpen) {
                console.warn(
                    'CollapsibleNumberPicker: isOpen prop is controlled but onRequestOpen callback not provided. ' +
                        'Picker will not be able to open. Either provide onRequestOpen or remove isOpen prop.'
                );
            }
            if (isControlled && !onRequestClose) {
                console.warn(
                    'CollapsibleNumberPicker: isOpen prop is controlled but onRequestClose callback not provided. ' +
                        'Picker will not be able to close. Either provide onRequestClose or remove isOpen prop.'
                );
            }
        }
    }, [isControlled, onRequestClose, onRequestOpen]);


    const renderItemRef = useRef<RenderItemFn | undefined>(renderItem);
    useEffect(() => {
        renderItemRef.current = renderItem;
    }, [renderItem]);

    const stableRenderItem = useCallback(
        (valueArg: string, state: CollapsiblePickerRenderItemState) =>
            renderItemRef.current ? renderItemRef.current(valueArg, state) : undefined,
        []
    );
    const hasCustomRenderItem = Boolean(renderItem);

    const { handleKeyDown, handleUseLastValue } = useQuickNumberControllers({
        showPicker,
        totalValues,
        values,
        selectedIndex,
        selectedValue,
        handlePickerOpen,
        handlePickerClose,
        handleValueChange,
        openedViaRef,
        currentGestureSource,
        isOpeningInteraction,
        stateMachine,
        lastValue,
        onChange,
    });

    // Wrap onGesture to integrate feedback
    const onGestureWithFeedback: typeof onGesture = useCallback(
        (event) => {
            // Trigger haptic/audio feedback for visual value changes
            if (event.type === 'value:visual') {
                handleVisualValueChange(event.value);
            }
            // Forward to orchestration
            onGesture(event);
        },
        [handleVisualValueChange, onGesture]
    );

    const pickerBodyProps = useMemo(
        () => ({
            values,
            unit,
            renderItem: stableRenderItem,
            hasCustomRenderItem,
            pickerWindowHeight,
            itemHeightPx,
            selectedValue,
            handleValueChange,
            onGesture: onGestureWithFeedback,
            showPicker,
            snapConfig: pickerSnapConfig,
            wheelMode,
        }),
        [
            values,
            unit,
            stableRenderItem,
            hasCustomRenderItem,
            pickerWindowHeight,
            itemHeightPx,
            selectedValue,
            handleValueChange,
            onGestureWithFeedback,
            showPicker,
            pickerSnapConfig,
            wheelMode,
        ]
    );

    const presenterViewModel = useQuickNumberPresenterViewModel({
        label,
        helperText,
        ids: {
            controlId,
            labelId,
            helperTextId,
            pickerWindowId,
        },
        lastValue,
        currentValue: value,
        unit,
        onUseLastValue: handleUseLastValue,
        layout: {
            collapsedHeight,
            pickerWindowHeight,
            pickerTranslate,
        },
        pickerState: {
            showPicker,
            showBackdrop,
            selectedIndex,
            totalValues,
        },
        aria: {
            min: Number.isFinite(min) ? min : undefined,
            max: Number.isFinite(max) ? max : undefined,
            valueNow: Number.isFinite(numericValue) ? numericValue : undefined,
            valueText: ariaValueText,
        },
        refs: { wrapperRef, interactiveRef, pickerRef, highlightRef },
        handlers: {
            onBackdropClick: handleBackdropClick,
            onPointerDown: handlePointerDown,
            onKeyDown: handleKeyDown,
        },
        highlightTapHandlers,
        pickerBodyProps,
        valueDisplay: {
            valueNode,
            maxSampleString,
            unit,
        },
        cssVariables,
        theme,
    });

    return <CollapsibleNumberPickerPresenter viewModel={presenterViewModel} />;
};

// ✅ PERFORMANCE FIX: Wrap in React.memo with deep comparison for config objects
// Without this, component re-renders when parent updates even if props are equivalent
// Custom comparison handles object props (snapPhysicsConfig, visualTweaks, theme)
const CollapsibleNumberPicker = React.memo(
    CollapsibleNumberPickerComponent,
    (prevProps, nextProps) => {
        // Primitive comparisons (fast path)
        if (
            prevProps.value !== nextProps.value ||
            prevProps.min !== nextProps.min ||
            prevProps.max !== nextProps.max ||
            prevProps.step !== nextProps.step ||
            prevProps.label !== nextProps.label ||
            prevProps.unit !== nextProps.unit ||
            prevProps.placeholder !== nextProps.placeholder ||
            prevProps.lastValue !== nextProps.lastValue ||
            prevProps.initialValue !== nextProps.initialValue ||
            prevProps.isOpen !== nextProps.isOpen ||
            prevProps.showBackdrop !== nextProps.showBackdrop ||
            prevProps.itemHeight !== nextProps.itemHeight ||
            prevProps.enableSnapPhysics !== nextProps.enableSnapPhysics ||
            prevProps.enableHaptics !== nextProps.enableHaptics ||
            prevProps.enableAudioFeedback !== nextProps.enableAudioFeedback ||
            prevProps.helperText !== nextProps.helperText ||
            prevProps.timingPreset !== nextProps.timingPreset
        ) {
            return false; // Props changed, re-render
        }

        // Function comparisons
        if (
            prevProps.onChange !== nextProps.onChange ||
            prevProps.onRequestOpen !== nextProps.onRequestOpen ||
            prevProps.onRequestClose !== nextProps.onRequestClose ||
            prevProps.renderValue !== nextProps.renderValue ||
            prevProps.renderItem !== nextProps.renderItem
        ) {
            return false;
        }

        // Deep comparison for config objects (only if defined)
        if (prevProps.snapPhysicsConfig || nextProps.snapPhysicsConfig) {
            if (!shallowEqual(prevProps.snapPhysicsConfig, nextProps.snapPhysicsConfig)) {
                return false;
            }
        }

        if (prevProps.visualTweaks || nextProps.visualTweaks) {
            if (!shallowEqual(prevProps.visualTweaks, nextProps.visualTweaks)) {
                return false;
            }
        }

        if (prevProps.theme || nextProps.theme) {
            if (!shallowEqual(prevProps.theme, nextProps.theme)) {
                return false;
            }
        }

        if (prevProps.timingConfig || nextProps.timingConfig) {
            if (!shallowEqual(prevProps.timingConfig, nextProps.timingConfig)) {
                return false;
            }
        }

        return true; // All props equal, skip re-render
    }
);

// Shallow equality helper for objects
function shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }

    return true;
}

export default CollapsibleNumberPicker;

export type {
    CollapsiblePickerProps,
    CollapsiblePickerTheme
} from './types';
