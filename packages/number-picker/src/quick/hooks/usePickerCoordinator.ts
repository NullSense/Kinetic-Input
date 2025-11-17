import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';
import {
    CLICK_OUTSIDE_DELAY,
    HIGHLIGHT_TAP_MOVEMENT_THRESHOLD,
} from '../../config/ui';
import { debugLog } from '../../utils/debug';
import { usePickerStateMachine } from './usePickerStateMachine.xstate';
import { useGestureCoordination } from './useGestureCoordination';
import { useHighlightTap } from './useHighlightTap';
import type { PickerGestureHandler } from '../../picker/gestures';

export type GestureSource = 'pointer' | 'wheel' | 'keyboard' | null;

interface PickerValue {
    value: string;
}

interface TimingConfig {
    idleTimeout: number;
    settleGracePeriod: number;
    wheelIdleTimeout: number;
}

interface PickerVisibilityState {
    showPicker: boolean;
    isControlled: boolean;
    openPicker: () => void;
    closePicker: () => void;
}

interface UseQuickPickerOrchestrationArgs {
    visibility: PickerVisibilityState;
    selectedValue: PickerValue;
    highlightMovementThreshold?: number;
    timing: TimingConfig;
    playConfirmationIfChanged?: () => void;
}

interface UseQuickPickerOrchestrationResult {
    showPicker: boolean;
    isControlled: boolean;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    interactiveRef: React.RefObject<HTMLDivElement | null>;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    highlightRef: React.RefObject<HTMLDivElement | null>;
    stateMachine: ReturnType<typeof usePickerStateMachine>;
    highlightTapHandlers: ReturnType<typeof useHighlightTap>;
    handlePickerOpen: () => void;
    handlePickerClose: (reason?: string) => void;
    handleBackdropClick: () => void;
    handlePointerDown: (event: React.PointerEvent) => void;
    onGesture: PickerGestureHandler;
    openedViaRef: React.MutableRefObject<GestureSource>;
    currentGestureSource: React.MutableRefObject<GestureSource>;
    isOpeningInteraction: React.MutableRefObject<boolean>;
    deferGestureCloseRef: React.MutableRefObject<boolean>;
}

/**
 * Coordinates picker visibility, gesture bookkeeping, and highlight interactions
 * so CollapsibleNumberPicker can stay declarative.
 * @param {object} params - Visibility controls, selected value, and timing data.
 * @returns {object} Gesture refs, handlers, and state-machine helpers.
 */
export const usePickerCoordinator = ({
    visibility,
    selectedValue,
    highlightMovementThreshold = HIGHLIGHT_TAP_MOVEMENT_THRESHOLD,
    timing,
    playConfirmationIfChanged,
}: UseQuickPickerOrchestrationArgs): UseQuickPickerOrchestrationResult => {
    const {
        showPicker,
        isControlled,
        openPicker: openPickerInternal,
        closePicker: closePickerInternal,
    } = visibility;

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const interactiveRef = useRef<HTMLDivElement | null>(null);
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const highlightRef = useRef<HTMLDivElement | null>(null);

    const forceCloseRef = useRef<(() => void) | null>(null);
    const resetIdleTimerRef = useRef<(() => void) | null>(null);
    const resetGestureStateRef = useRef<() => void>(() => {});

    const openedViaRef = useRef<GestureSource>(null);
    const currentGestureSource = useRef<GestureSource>(null);
    const isOpeningInteraction = useRef(false);
    const deferGestureCloseRef = useRef(false);

    const internalClose = useCallback(
        (reason: string = 'explicit-close') => {
            debugLog('pickerClose', {
                controlled: isControlled,
                reason,
            });
            // Play confirmation sound when picker closes
            // This is called from handleRequestClose (via state machine)
            playConfirmationIfChanged?.();
            closePickerInternal();
            forceCloseRef.current?.();
            resetGestureStateRef.current?.();
        },
        [closePickerInternal, isControlled, playConfirmationIfChanged]
    );

    const handleRequestClose = useCallback(
        ({ reason }: { reason: string }) => {
            debugLog('onRequestClose - auto-closing picker', { reason });
            if (reason === 'gesture' && deferGestureCloseRef.current) {
                deferGestureCloseRef.current = false;
                resetIdleTimerRef.current?.();
                return;
            }
            internalClose(reason);
        },
        [internalClose]
    );

    const stateMachine = usePickerStateMachine({
        isOpen: showPicker,
        isControlled,
        onRequestClose: handleRequestClose,
        idleTimeout: timing.idleTimeout,
        settleGracePeriod: timing.settleGracePeriod,
        wheelIdleTimeout: timing.wheelIdleTimeout,
    });

    resetIdleTimerRef.current = stateMachine.resetIdleTimer;

    useEffect(() => {
        forceCloseRef.current = stateMachine.forceClose;
    }, [stateMachine.forceClose]);

    const handlePickerOpen = useCallback(() => {
        debugLog('pickerOpen', {
            controlled: isControlled,
            showPicker,
            value: selectedValue.value,
        });

        forceCloseRef.current?.();
        openPickerInternal();
    }, [isControlled, openPickerInternal, selectedValue.value, showPicker]);

    const {
        onGesture,
        handlePointerDown,
        resetGestureState,
    } = useGestureCoordination({
        showPicker,
        wrapperRef,
        handlePickerOpen,
        stateMachine,
        selectedValue,
        wheelIdleTimeout: timing.wheelIdleTimeout,
        openedViaRef,
        currentGestureSource,
        isOpeningInteraction,
        deferGestureCloseRef,
    });

    useEffect(() => {
        resetGestureStateRef.current = resetGestureState;
    }, [resetGestureState]);

    const handlePickerClose = useCallback(
        (reason: string = 'explicit-close') => {
            // Route ALL closes through state machine for consistency
            // State machine → notifyExternalClose → handleRequestClose → internalClose
            stateMachine.handleExternalClose(reason);
        },
        [stateMachine]
    );

    const handleBackdropClick = useCallback(() => {
        handlePickerClose('backdrop-click');
    }, [handlePickerClose]);

    const highlightTapHandlers = useHighlightTap({
        enabled: showPicker,
        getHighlightRect: () => highlightRef.current?.getBoundingClientRect() ?? null,
        movementThreshold: highlightMovementThreshold,
        onTap: () => {
            if (deferGestureCloseRef.current) {
                return;
            }
            handlePickerClose('middle-row-highlight-click');
        },
    });

    useEffect(() => {
        if (!showPicker) {
            return undefined;
        }

        let listenersAttached = false;

        const handleClickOutside = (event: PointerEvent) => {
            if (!(event.target instanceof Node)) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[CollapsibleNumberPicker] Click-outside: event.target is not a Node', {
                        target: event.target,
                        type: typeof event.target,
                    });
                }
                return;
            }

            if (!wrapperRef.current) return;

            if (!wrapperRef.current.contains(event.target)) {
                debugLog('clickOutsideClose', {
                    pointerType: event.pointerType,
                    showPicker,
                });
                handlePickerClose('click-outside');
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                debugLog('escapeClose', { showPicker });
                event.stopPropagation();
                event.preventDefault();
                handlePickerClose('escape');
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('pointerdown', handleClickOutside);
            document.addEventListener('keydown', handleEscape, { capture: true });
            listenersAttached = true;
        }, CLICK_OUTSIDE_DELAY);

        return () => {
            clearTimeout(timeoutId);
            if (listenersAttached) {
                document.removeEventListener('pointerdown', handleClickOutside);
                document.removeEventListener('keydown', handleEscape, { capture: true });
            }
        };
    }, [handlePickerClose, showPicker]);

    return {
        showPicker,
        isControlled,
        wrapperRef,
        interactiveRef,
        pickerRef,
        highlightRef,
        stateMachine,
        highlightTapHandlers,
        handlePickerOpen,
        handlePickerClose,
        handleBackdropClick,
        handlePointerDown,
        onGesture,
        openedViaRef,
        currentGestureSource,
        isOpeningInteraction,
        deferGestureCloseRef,
    };
};
