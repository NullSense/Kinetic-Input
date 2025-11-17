import { useCallback, useEffect, useRef, type React } from 'react';
import { debugLog } from '../../utils/debug';
import { BOUNDARY_SETTLE_DELAY, WHEEL_CLOSE_DELAY } from '../../config/ui';
import type { usePickerStateMachine } from './usePickerStateMachine.xstate';
import type { PickerGestureEvent, PickerGestureHandler } from '../../picker/gestures';

type PickerMachineApi = ReturnType<typeof usePickerStateMachine>;
type GestureSource = 'pointer' | 'wheel' | 'keyboard' | null;

type PickerValue = { value: string };

interface UsePickerGesturesArgs {
    showPicker: boolean;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    handlePickerOpen: () => void;
    stateMachine: PickerMachineApi;
    selectedValue: PickerValue;
    wheelIdleTimeout?: number;
    openedViaRef: React.MutableRefObject<GestureSource>;
    currentGestureSource: React.MutableRefObject<GestureSource>;
    isOpeningInteraction: React.MutableRefObject<boolean>;
    deferGestureCloseRef: React.MutableRefObject<boolean>;
}

interface UsePickerGesturesResult {
    onGesture: PickerGestureHandler;
    handlePointerDown: (event: React.PointerEvent) => void;
    resetGestureState: () => void;
}

/**
 * Provides event-driven gesture orchestration for the picker surface.
 * Consumes PickerGestureEvents and coordinates XState transitions.
 *
 * @param {object} params - Selected value, physics config, and callbacks.
 * @returns {object} onGesture handler, pointer handler, and reset function.
 */
export const useGestureCoordination = ({
    showPicker,
    wrapperRef,
    handlePickerOpen,
    stateMachine,
    selectedValue,
    wheelIdleTimeout,
    openedViaRef,
    currentGestureSource,
    isOpeningInteraction,
    deferGestureCloseRef,
}: UsePickerGesturesArgs): UsePickerGesturesResult => {
    // Wheel input is always enabled (inverted scroll mode)
    const wheelEnabled = true;
    const showPickerRef = useRef(showPicker);
    useEffect(() => {
        showPickerRef.current = showPicker;
    }, [showPicker]);

    const boundaryCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wheelIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const boundaryHitPendingRef = useRef(false);
    const gestureStartValue = useRef<string | null>(null);
    const clearBoundaryCloseTimer = useCallback(() => {
        if (boundaryCloseTimerRef.current) {
            clearTimeout(boundaryCloseTimerRef.current);
            boundaryCloseTimerRef.current = null;
        }
    }, []);

    const clearWheelIdleTimer = useCallback(() => {
        if (wheelIdleTimerRef.current) {
            clearTimeout(wheelIdleTimerRef.current);
            wheelIdleTimerRef.current = null;
        }
    }, []);

    const scheduleBoundaryClose = useCallback(() => {
        clearBoundaryCloseTimer();
        boundaryCloseTimerRef.current = setTimeout(() => {
            stateMachine.handleMomentumEnd(true);
            boundaryCloseTimerRef.current = null;
        }, BOUNDARY_SETTLE_DELAY);
    }, [clearBoundaryCloseTimer, stateMachine]);

    const handleWheelIdleTimeout = useCallback(() => {
        wheelIdleTimerRef.current = null;

        if (!showPickerRef.current) {
            return;
        }

        stateMachine.handleWheelIdle();

        if (boundaryHitPendingRef.current) {
            boundaryHitPendingRef.current = false;
            scheduleBoundaryClose();
        } else {
            stateMachine.handleMomentumEnd(false);
        }

        currentGestureSource.current = null;
    }, [scheduleBoundaryClose, stateMachine]);

    const scheduleWheelIdle = useCallback(() => {
        const delay = wheelIdleTimeout ?? WHEEL_CLOSE_DELAY;
        clearWheelIdleTimer();
        wheelIdleTimerRef.current = setTimeout(handleWheelIdleTimeout, delay);
    }, [clearWheelIdleTimer, handleWheelIdleTimeout, wheelIdleTimeout]);

    const handleWheel = useCallback(() => {
        if (!wheelEnabled) {
            return;
        }
        clearBoundaryCloseTimer();
        clearWheelIdleTimer();

        if (!showPickerRef.current) {
            handlePickerOpen();
            stateMachine.handleWheelStart();
            openedViaRef.current = 'wheel';
            currentGestureSource.current = 'wheel';
            isOpeningInteraction.current = true;
            debugLog('wheelToOpen', { openedByScrollWheel: true });
        } else {
            currentGestureSource.current = 'wheel';
            stateMachine.resetIdleTimer();
        }

        scheduleWheelIdle();
    }, [
        clearBoundaryCloseTimer,
        clearWheelIdleTimer,
        handlePickerOpen,
        scheduleWheelIdle,
        stateMachine,
        wheelEnabled,
    ]);

    useEffect(() => {
        const node = wrapperRef.current;
        if (!node || !wheelEnabled) return undefined;

        const nativeWheelHandler = (event: WheelEvent) => {
            if (event.ctrlKey) {
                return;
            }
            event.preventDefault();
            handleWheel();
        };

        const wheelListenerOptions: AddEventListenerOptions = { capture: true, passive: false };
        node.addEventListener('wheel', nativeWheelHandler, wheelListenerOptions);

        return () => {
            node.removeEventListener('wheel', nativeWheelHandler, wheelListenerOptions.capture ?? false);
        };
    }, [handleWheel, wheelEnabled, wrapperRef]);

    const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            debugLog('handlePointerDown CALLED', {
                showPicker: showPickerRef.current,
                target: event.target,
                currentTarget: event.currentTarget,
                pointerType: event.pointerType,
            });

            clearBoundaryCloseTimer();
            clearWheelIdleTimer();

            if (!showPickerRef.current) {
                debugLog('pointerDownToOpen - OPENING PICKER', {});
                handlePickerOpen();
                openedViaRef.current = 'pointer';
                isOpeningInteraction.current = true;
                debugLog('pointerDownToOpen', {
                    awaitingDrag: true,
                    isOpeningInteraction: true,
                });
                return;
            }

            stateMachine.handlePointerDown();
            if (isOpeningInteraction.current && event.currentTarget === event.target) {
                stateMachine.handlePointerDown();
                deferGestureCloseRef.current = true;
            }

            debugLog('pointerDownWhenOpen', {
                multiGesture: true,
                interactionCount: '(incremented)',
            });
        },
        [clearBoundaryCloseTimer, clearWheelIdleTimer, handlePickerOpen, stateMachine],
    );

    const handleDragStart = useCallback(() => {
        if (currentGestureSource.current !== 'wheel') {
            clearWheelIdleTimer();
        }
        gestureStartValue.current = selectedValue.value;
        boundaryHitPendingRef.current = false;
        clearBoundaryCloseTimer();

        if (!currentGestureSource.current) {
            currentGestureSource.current = 'pointer';
        }

        if (showPickerRef.current && !isOpeningInteraction.current) {
            if (currentGestureSource.current === 'wheel') {
                stateMachine.handleWheelStart();
            } else {
                stateMachine.handlePointerDown();
            }
        }

        debugLog('dragStart', {
            startValue: selectedValue.value,
            isOpeningInteraction: isOpeningInteraction.current,
            gestureSource: currentGestureSource.current,
        });
    }, [clearBoundaryCloseTimer, clearWheelIdleTimer, selectedValue.value, stateMachine]);

    const handleDragEnd = useCallback(
        (hasMoved: boolean) => {
            debugLog('dragEnd', {
                hasMoved,
                openedVia: openedViaRef.current,
                isOpeningInteraction: isOpeningInteraction.current,
                startValue: gestureStartValue.current,
                currentValue: selectedValue.value,
            });

            if (isOpeningInteraction.current) {
                isOpeningInteraction.current = false;
                const openSource = openedViaRef.current;

                if (!hasMoved) {
                    debugLog('dragEnd:opening-no-movement', {
                        reason: 'transition-to-idle',
                        timeout: '1.5s',
                        source: openSource,
                    });

                    if (openSource === 'wheel') {
                        stateMachine.handleWheelStart();
                        stateMachine.handleWheelIdle();
                    } else {
                        stateMachine.handlePointerDown();
                        stateMachine.handlePointerDown();
                        stateMachine.handlePointerUp();
                    }
                    stateMachine.handleMomentumEnd(false);
                    return;
                }

                debugLog('dragEnd:opening-with-drag', {
                    reason: 'user-dragged-while-opening',
                    source: openSource,
                });

                if (openSource !== 'wheel') {
                    stateMachine.handlePointerDown();
                }
            }

            if (currentGestureSource.current === 'wheel') {
                stateMachine.handleWheelIdle();
            } else {
                stateMachine.handlePointerUp();
            }

            if (boundaryHitPendingRef.current) {
                boundaryHitPendingRef.current = false;
                scheduleBoundaryClose();
            } else {
                stateMachine.handleMomentumEnd(false);
            }

            currentGestureSource.current = null;
        },
        [scheduleBoundaryClose, selectedValue.value, stateMachine],
    );

    const handleBoundaryHit = useCallback((boundary: 'min' | 'max', value: string | number) => {
        debugLog('boundaryHit', { boundary, value });
        boundaryHitPendingRef.current = true;
    }, []);

    const resetGestureState = useCallback(() => {
        openedViaRef.current = null;
        currentGestureSource.current = null;
        isOpeningInteraction.current = false;
        boundaryHitPendingRef.current = false;
        deferGestureCloseRef.current = false;
        clearBoundaryCloseTimer();
        clearWheelIdleTimer();
    }, [clearBoundaryCloseTimer, clearWheelIdleTimer]);

    // Event-driven gesture handler
    const onGesture: PickerGestureHandler = useCallback(
        (event: PickerGestureEvent) => {
            switch (event.type) {
                case 'drag:start':
                    handleDragStart();
                    break;
                case 'drag:end':
                    handleDragEnd(event.hasMoved);
                    break;
                case 'boundary:hit':
                    handleBoundaryHit(event.boundary, event.value);
                    break;
                case 'value:visual':
                case 'value:commit':
                    // Visual value changes are handled by the picker itself
                    break;
                default:
                    // Exhaustiveness check
                    const _exhaustive: never = event;
                    break;
            }
        },
        [handleBoundaryHit, handleDragEnd, handleDragStart]
    );

    useEffect(() => () => clearBoundaryCloseTimer(), [clearBoundaryCloseTimer]);
    useEffect(() => () => clearWheelIdleTimer(), [clearWheelIdleTimer]);

    return {
        onGesture,
        handlePointerDown,
        resetGestureState,
    };
};
