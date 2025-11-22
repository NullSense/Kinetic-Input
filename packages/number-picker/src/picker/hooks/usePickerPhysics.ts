import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'framer-motion';
import type { PickerOption } from '../PickerGroup';
import type { SnapPhysicsConfig } from '../types/snapPhysics';
import {
  DEFAULT_SNAP_PHYSICS,
  MAX_OVERSCROLL_PIXELS,
  OPENING_DRAG_THRESHOLD_PIXELS,
  CLICK_STEP_THRESHOLD_RATIO,
  TOUCH_TAP_THRESHOLD_RATIO,
  MINIMUM_MOVEMENT_PIXELS,
  DOM_DELTA_MODE,
  OVERSCROLL_DAMPING_EXPONENT,
  MOMENTUM_PHYSICS,
} from '../../config/physics';
import { useSnapPhysics } from './useSnapPhysics';
import { useVirtualWindow } from './useVirtualWindow';
import { useSnappedIndexStore } from '../useSnappedIndexStore';
import { clamp, clampIndex, indexFromY, yFromIndex } from '../utils/math';
import { animationDebugger, debugSnapLog, debugPickerLog } from '../../utils/debug';
import {
  animateMomentumWithFriction,
  type FrictionMomentumControls,
} from '../utils/frictionMomentum';
import {
  createGestureEmitter,
  createVelocityTracker,
  type PickerGestureHandler,
} from '../gestures';

const clampWheelSensitivity = (value: number) => (Number.isFinite(value) && value > 0 ? value : 1);

const clampWheelDeltaCap = (value: number) => (Number.isFinite(value) && value > 0 ? value : 1.25);

export interface PickerColumnInteractionsConfig {
  key: string;
  options: PickerOption[];
  selectedIndex: number;
  itemHeight: number;
  height: number;
  isPickerOpen: boolean;
  wheelSensitivity: number;
  wheelDeltaCap: number;
  changeValue: (key: string, value: string | number) => boolean;
  /** Event-driven gesture handler */
  onGesture?: PickerGestureHandler;
  snapConfig?: SnapPhysicsConfig;
  virtualization: {
    slotCount: number;
    overscan: number;
  };
}

export interface PickerColumnInteractionsResult {
  columnRef: React.MutableRefObject<HTMLDivElement | null>;
  ySnap: MotionValue<number>;
  centerIndex: number;
  startIndex: number;
  windowLength: number;
  virtualOffsetY: number;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleWheel: (event: WheelEvent) => void;
  handleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  interruptMomentum: () => void;
}

/**
 * Encapsulates the picker column motion math, snapping, and virtualization bookkeeping.
 *
 * Uses event-driven architecture: all gesture interactions emit events through onGesture.
 *
 * @param {PickerColumnInteractionsConfig} config
 * @returns {PickerColumnInteractionsResult}
 */
export function usePickerPhysics({
  key,
  options,
  selectedIndex,
  itemHeight,
  height,
  isPickerOpen,
  wheelSensitivity,
  wheelDeltaCap,
  changeValue,
  onGesture,
  snapConfig,
  virtualization,
}: PickerColumnInteractionsConfig): PickerColumnInteractionsResult {
  // Create gesture emitter for event-driven API
  const emitter = useMemo(() => createGestureEmitter(onGesture), [onGesture]);

  // Create velocity tracker for pointer/wheel gestures
  const velocityTracker = useMemo(
    () =>
      createVelocityTracker({
        sampleCount: 8, // Increased from 5 for better mobile accuracy
        maxSampleAge: 150, // Reduced from 250ms for more responsive velocity calculation
      }),
    []
  );

  const mergedSnapConfig = useMemo<SnapPhysicsConfig>(
    () => ({
      ...DEFAULT_SNAP_PHYSICS,
      ...snapConfig,
    }),
    [snapConfig]
  );
  const snapEnabled = mergedSnapConfig.enabled;
  const snapPhysics = useSnapPhysics(mergedSnapConfig);

  // Wheel-specific snap: VERY strong magnetic pull for precision (especially important for ranges like reps)
  const wheelSnapConfig = useMemo<SnapPhysicsConfig>(
    () => ({
      ...mergedSnapConfig,
      pullStrength: 1.4, // Maximum pull strength (same as pointer) for rigid feel
      centerLock: 0.85, // Very sticky center - easy to land precisely on target value
      velocityReducer: 0.05, // Minimal scaling - snap stays strong even when scrolling
      // Gentler projection for wheel (touchpad has acceleration, don't over-project)
      rangeScaleIntensity: 0.1, // 100ms projection (vs 250ms for pointer) - less aggressive
      rangeScaleVelocityBoost: 1.0, // No boost (vs 2.0 for pointer)
    }),
    [mergedSnapConfig]
  );
  const wheelSnapPhysics = useSnapPhysics(wheelSnapConfig);

  const lastIndex = Math.max(0, options.length - 1);
  const maxTranslate = useMemo(() => height / 2 - itemHeight / 2, [height, itemHeight]);
  const minTranslate = useMemo(
    () => height / 2 - itemHeight * options.length + itemHeight / 2,
    [height, itemHeight, options.length]
  );

  const yRaw = useMotionValue(0);
  const ySnap = useMotionValue(0);

  const normalizedWheelSensitivity = useMemo(
    () => clampWheelSensitivity(wheelSensitivity),
    [wheelSensitivity]
  );
  const normalizedWheelDeltaCap = useMemo(() => clampWheelDeltaCap(wheelDeltaCap), [wheelDeltaCap]);

  useMotionValueEvent(yRaw, 'change', (latest) => {
    const snapped = Math.round(Number(latest));
    if (ySnap.get() !== snapped) {
      ySnap.set(snapped);
    }
  });

  useEffect(() => {
    const initialIndex = clampIndex(selectedIndex, lastIndex);
    const initialTranslate = yFromIndex(initialIndex, itemHeight, maxTranslate, lastIndex);
    yRaw.set(initialTranslate);
    ySnap.set(Math.round(initialTranslate));
  }, [itemHeight, lastIndex, maxTranslate, selectedIndex, yRaw, ySnap]);

  const columnRef = useRef<HTMLDivElement | null>(null);
  const isMovingRef = useRef(false);
  const startPointerYRef = useRef(0);
  const startTranslateRef = useRef(0);
  const boundaryHitFiredRef = useRef(false);
  const lastVisualValueRef = useRef<string | number | null>(null);
  const wasOpenOnPointerDownRef = useRef(false);
  const openingDragThresholdPassedRef = useRef(false);
  const skipClickRef = useRef(false);
  const pointerTypeRef = useRef<'mouse' | 'pen' | 'touch' | ''>('');
  const activeAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const activeFrictionMomentumRef = useRef<FrictionMomentumControls | null>(null);
  const activeAnimationIdRef = useRef<symbol | null>(null);
  const activeTargetIndexRef = useRef<number | null>(null);
  const lastIsPickerOpenRef = useRef(isPickerOpen);

  useEffect(() => {
    lastVisualValueRef.current = options[selectedIndex]?.value ?? null;
  }, [options, selectedIndex]);

  const centerIndex = useSnappedIndexStore(ySnap, itemHeight, maxTranslate, lastIndex);

  useEffect(() => {
    const wasClosed = !lastIsPickerOpenRef.current && isPickerOpen;
    lastIsPickerOpenRef.current = isPickerOpen;
    if (
      wasClosed &&
      isMovingRef.current &&
      skipClickRef.current &&
      !openingDragThresholdPassedRef.current
    ) {
      startTranslateRef.current = yRaw.get();
    }
  }, [isPickerOpen, yRaw]);

  useEffect(() => {
    const candidate = options[centerIndex]?.value;
    if (candidate !== undefined && candidate !== lastVisualValueRef.current) {
      lastVisualValueRef.current = candidate;
      emitter.visualChange(candidate, centerIndex);
    }
  }, [centerIndex, emitter, options]);

  const { startIndex, windowLength, virtualOffsetY } = useVirtualWindow({
    centerIndex,
    itemHeight,
    optionCount: options.length,
    slotCount: virtualization.slotCount,
    overscan: virtualization.overscan,
  });

  const updateScrollerWhileMoving = useCallback(
    (nextTranslate: number) => {
      let applied = nextTranslate;
      if (applied < minTranslate) {
        const distance = minTranslate - applied;
        const limitedDistance = Math.min(distance, MAX_OVERSCROLL_PIXELS);
        const overscroll = Math.pow(limitedDistance, OVERSCROLL_DAMPING_EXPONENT);
        applied = minTranslate - overscroll;
        if (distance > 0 && !boundaryHitFiredRef.current) {
          const value = options[lastIndex]?.value;
          emitter.boundaryHit('max', value);
          boundaryHitFiredRef.current = true;
        }
      } else if (applied > maxTranslate) {
        const distance = applied - maxTranslate;
        const limitedDistance = Math.min(distance, MAX_OVERSCROLL_PIXELS);
        const overscroll = Math.pow(limitedDistance, OVERSCROLL_DAMPING_EXPONENT);
        applied = maxTranslate + overscroll;
        if (distance > 0 && !boundaryHitFiredRef.current) {
          const value = options[0]?.value;
          emitter.boundaryHit('min', value);
          boundaryHitFiredRef.current = true;
        }
      }

      yRaw.set(applied);
      return applied;
    },
    [emitter, lastIndex, maxTranslate, minTranslate, options, yRaw]
  );

  const commitValueAtIndex = useCallback(
    (targetIndex: number) => {
      const option = options[targetIndex];
      if (option) {
        changeValue(key, option.value);
      }
    },
    [changeValue, key, options]
  );

  const finishAnimationInstantly = useCallback(() => {
    const targetIndex = activeTargetIndexRef.current;
    if (targetIndex == null) {
      return;
    }

    const targetTranslate = yFromIndex(targetIndex, itemHeight, maxTranslate, lastIndex);
    yRaw.set(targetTranslate);
    commitValueAtIndex(targetIndex);
    activeTargetIndexRef.current = null;
  }, [commitValueAtIndex, itemHeight, lastIndex, maxTranslate, yRaw]);

  const stopActiveAnimation = useCallback(() => {
    // Stop friction momentum animation if running
    if (activeFrictionMomentumRef.current) {
      activeFrictionMomentumRef.current.stop();
      activeFrictionMomentumRef.current = null;
    }

    // Stop spring animation if running
    if (!activeAnimationRef.current) {
      return;
    }

    const stoppedAnimationId = activeAnimationIdRef.current;
    animationDebugger.stop(
      stoppedAnimationId?.toString() ?? 'unknown',
      activeTargetIndexRef.current
    );

    activeAnimationRef.current.stop();
    activeAnimationRef.current = null;
    activeAnimationIdRef.current = null;
    finishAnimationInstantly();
  }, [finishAnimationInstantly]);

  const settleToIndex = useCallback(
    (index: number, onComplete?: () => void) => {
      if (options.length === 0) {
        onComplete?.();
        return;
      }
      const clampedIndex = clampIndex(index, lastIndex);
      const target = yFromIndex(clampedIndex, itemHeight, maxTranslate, lastIndex);
      const currentY = yRaw.get();

      // Optimization: Skip animation if already at target position (prevents no-op animations)
      const distance = Math.abs(currentY - target);
      if (distance < 1 && !activeAnimationRef.current) {
        // Already at target and not animating - commit immediately (no animation delay needed)
        yRaw.set(target); // Snap to exact position (prevent sub-pixel drift)
        commitValueAtIndex(clampedIndex);
        onComplete?.();
        return;
      }

      stopActiveAnimation();

      const animationId = Symbol('picker-settle');
      const animationIdStr = animationId.toString();

      // CRITICAL: Set refs BEFORE animate() to handle synchronous onComplete
      // If yRaw is already at target, Framer Motion calls onComplete synchronously
      // before animate() returns. Setting refs first ensures the guard check works.
      activeAnimationIdRef.current = animationId;
      activeTargetIndexRef.current = clampedIndex;

      animationDebugger.start(animationIdStr, clampedIndex, currentY, target);

      const controls = animate(yRaw, target, {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        restDelta: 0.5,
        restSpeed: 10,
        onComplete: () => {
          // Guard: If this animation was stopped, activeAnimationIdRef will be null/different
          // This check now works correctly even for synchronous completion
          if (activeAnimationIdRef.current !== animationId) {
            animationDebugger.cancel(
              animationIdStr,
              activeAnimationIdRef.current?.toString() ?? null
            );
            // Animation was stopped/superseded - do nothing
            return;
          }

          // This animation completed successfully
          const finalY = yRaw.get();
          animationDebugger.complete(animationIdStr, clampedIndex, finalY);

          activeAnimationRef.current = null;
          activeAnimationIdRef.current = null;

          if (activeTargetIndexRef.current === clampedIndex) {
            activeTargetIndexRef.current = null;
            commitValueAtIndex(clampedIndex);
            yRaw.set(target); // Only snap if we committed (no race with new animation)

            // Emit settle event (direct settle without momentum)
            const settledValue = options[clampedIndex]?.value;
            if (settledValue !== undefined) {
              emitter.settle(settledValue, clampedIndex, false);
            }

            onComplete?.();
          }
        },
      });

      // Set controls ref after animate() (controls can't be used in synchronous onComplete anyway)
      activeAnimationRef.current = controls;
    },
    [
      commitValueAtIndex,
      emitter,
      itemHeight,
      lastIndex,
      maxTranslate,
      options,
      stopActiveAnimation,
      yRaw,
    ]
  );

  const settleFromY = useCallback(
    (currentY: number, velocity: number, onComplete?: () => void) => {
      // Stop any active animation before starting new one
      stopActiveAnimation();

      debugPickerLog('SETTLE FROM Y', {
        currentY: currentY.toFixed(1),
        velocity: velocity.toFixed(1) + ' px/s',
        minTranslate,
        maxTranslate,
      });

      // If velocity is negligible, just snap to nearest item immediately
      if (Math.abs(velocity) < 10) {
        const index = clampIndex(indexFromY(currentY, itemHeight, maxTranslate), lastIndex);
        settleToIndex(index, onComplete);
        return;
      }

      // Start friction-based momentum animation
      // Scale velocity to 22% for controlled, precise flick speed
      // Lower scaling provides more predictable momentum behavior
      const controls = animateMomentumWithFriction({
        control: yRaw,
        initialVelocity: velocity * 0.22,
        bounds: {
          min: minTranslate,
          max: maxTranslate,
        },
        snapFunction: (position) => {
          // Calculate which item index this position corresponds to
          const index = clampIndex(indexFromY(position, itemHeight, maxTranslate), lastIndex);
          // Return the exact Y position for that index
          return yFromIndex(index, itemHeight, maxTranslate, lastIndex);
        },
        config: MOMENTUM_PHYSICS,
        onComplete: () => {
          // Calculate final index from yRaw position
          const finalY = yRaw.get();
          const finalIndex = clampIndex(indexFromY(finalY, itemHeight, maxTranslate), lastIndex);

          debugPickerLog('FRICTION MOMENTUM COMPLETE', {
            finalY: finalY.toFixed(1),
            finalIndex,
          });

          // Commit the value
          commitValueAtIndex(finalIndex);
          activeTargetIndexRef.current = null;
          activeFrictionMomentumRef.current = null;

          // Emit settle event (momentum settle after flicking)
          const settledValue = options[finalIndex]?.value;
          if (settledValue !== undefined) {
            emitter.settle(settledValue, finalIndex, true);
          }

          onComplete?.();
        },
        snapSpring: {
          stiffness: 100,
          damping: 20,
          restDelta: 0.5,
          restSpeed: 10,
        },
      });

      // Store controls for potential interruption
      activeFrictionMomentumRef.current = controls;

      // Track target for debugging (will be set when snap phase starts)
      const estimatedIndex = clampIndex(indexFromY(currentY, itemHeight, maxTranslate), lastIndex);
      activeTargetIndexRef.current = estimatedIndex;
    },
    [
      commitValueAtIndex,
      emitter,
      itemHeight,
      lastIndex,
      maxTranslate,
      minTranslate,
      options,
      settleToIndex,
      stopActiveAnimation,
      yRaw,
    ]
  );

  // Track all captured pointer IDs for proper cleanup
  const capturedPointersRef = useRef<Set<number>>(new Set());

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = event.currentTarget as HTMLElement;
      element.setPointerCapture?.(event.pointerId);

      // Track this pointer ID
      capturedPointersRef.current.add(event.pointerId);

      debugPickerLog('POINTER DOWN', {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        isMovingBefore: isMovingRef.current,
        capturedPointers: Array.from(capturedPointersRef.current),
        timestamp: Date.now(),
      });

      pointerTypeRef.current =
        event.pointerType === 'mouse' ||
        event.pointerType === 'pen' ||
        event.pointerType === 'touch'
          ? event.pointerType
          : '';
      stopActiveAnimation();
      isMovingRef.current = true;
      startPointerYRef.current = event.clientY;
      startTranslateRef.current = yRaw.get();
      boundaryHitFiredRef.current = false;
      wasOpenOnPointerDownRef.current = isPickerOpen;
      openingDragThresholdPassedRef.current = isPickerOpen;
      skipClickRef.current = !isPickerOpen;
      snapPhysics.reset();

      // Reset velocity tracker for new gesture
      velocityTracker.reset();
      velocityTracker.addSample(event.clientY);
      emitter.dragStart('pointer');
    },
    [emitter, isPickerOpen, snapPhysics, stopActiveAnimation, velocityTracker, yRaw]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isMovingRef.current) {
        debugPickerLog('POINTER MOVE BLOCKED (isMoving=false)', {
          pointerId: event.pointerId,
          timestamp: Date.now(),
        });
        return;
      }

      // Track velocity
      velocityTracker.addSample(event.clientY);

      const deltaY = event.clientY - startPointerYRef.current;
      const contentDelta = deltaY;
      if (!openingDragThresholdPassedRef.current) {
        if (Math.abs(deltaY) < OPENING_DRAG_THRESHOLD_PIXELS) {
          return;
        }
        openingDragThresholdPassedRef.current = true;
        skipClickRef.current = false;
      }

      const rawTranslate = startTranslateRef.current + contentDelta;
      const nearestIndex = indexFromY(rawTranslate, itemHeight, maxTranslate);
      const snapTargetTranslate = yFromIndex(nearestIndex, itemHeight, maxTranslate, lastIndex);

      let nextTranslate = rawTranslate;
      const deltaToTarget = rawTranslate - snapTargetTranslate;
      if (snapEnabled) {
        const totalPixelsMoved = Math.abs(event.clientY - startPointerYRef.current);
        const snapResult = snapPhysics.calculate(
          { deltaY: deltaToTarget, velocityY: velocityTracker.getVelocity(), totalPixelsMoved },
          0,
          itemHeight
        );
        nextTranslate = snapResult.mappedTranslate + snapTargetTranslate;
      } else {
        nextTranslate = rawTranslate;
      }

      updateScrollerWhileMoving(nextTranslate);
    },
    [
      itemHeight,
      lastIndex,
      maxTranslate,
      snapEnabled,
      snapPhysics,
      updateScrollerWhileMoving,
      velocityTracker,
    ]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      debugPickerLog('POINTER UP', {
        pointerId: event.pointerId,
        isMovingBefore: isMovingRef.current,
        capturedPointersBefore: Array.from(capturedPointersRef.current),
        timestamp: Date.now(),
      });

      // Remove from tracked pointers
      capturedPointersRef.current.delete(event.pointerId);

      try {
        (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
        debugPickerLog(
          'Released capture for ID',
          event.pointerId,
          'remaining:',
          Array.from(capturedPointersRef.current)
        );
      } catch (error) {
        debugPickerLog('Failed to release capture', error);
        debugSnapLog('releasePointerCapture failed', error);
      }

      const currentTranslate = yRaw.get();
      const movementDelta = Math.abs(currentTranslate - startTranslateRef.current);
      const hasMoved = movementDelta > MINIMUM_MOVEMENT_PIXELS;

      const shouldSkipSettle =
        !openingDragThresholdPassedRef.current && !wasOpenOnPointerDownRef.current;

      isMovingRef.current = false;
      debugPickerLog('Set isMoving = false');
      snapPhysics.reset();

      const pointerType = pointerTypeRef.current;
      pointerTypeRef.current = '';

      if (shouldSkipSettle) {
        openingDragThresholdPassedRef.current = false;
        wasOpenOnPointerDownRef.current = false;

        // Get velocity before emitting event
        const velocity = velocityTracker.getVelocity();
        emitter.dragEnd(false, velocity);
        velocityTracker.reset();
        return;
      }

      const currentIndex = clampIndex(
        indexFromY(currentTranslate, itemHeight, maxTranslate),
        lastIndex
      );

      if (
        !hasMoved &&
        isPickerOpen &&
        !skipClickRef.current &&
        (pointerType === 'mouse' || pointerType === 'pen' || pointerType === 'touch') &&
        columnRef.current
      ) {
        const rect = columnRef.current.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const relativeOffset = event.clientY - centerY;
        const thresholdRatio =
          pointerType === 'touch' ? TOUCH_TAP_THRESHOLD_RATIO : CLICK_STEP_THRESHOLD_RATIO;
        const threshold = itemHeight * thresholdRatio;
        if (Math.abs(relativeOffset) > threshold) {
          const rawSteps = relativeOffset / itemHeight;
          const direction = rawSteps > 0 ? 1 : -1;
          const magnitude =
            pointerType === 'touch' ? 1 : Math.max(1, Math.round(Math.abs(rawSteps)));
          const targetIndex = clampIndex(currentIndex + direction * magnitude, lastIndex);

          if (targetIndex !== currentIndex) {
            // Get velocity before emitting event
            const velocity = velocityTracker.getVelocity();

            settleToIndex(targetIndex, () => {
              openingDragThresholdPassedRef.current = false;
              wasOpenOnPointerDownRef.current = false;
              skipClickRef.current = false;
              emitter.dragEnd(true, velocity);
              velocityTracker.reset();
            });
            return;
          }
        }
      }

      // Get velocity before settling
      const velocity = velocityTracker.getVelocity();

      const finalize = (didMove: boolean) => {
        openingDragThresholdPassedRef.current = false;
        wasOpenOnPointerDownRef.current = false;
        skipClickRef.current = false;
        emitter.dragEnd(didMove, velocity);
        velocityTracker.reset();
      };

      // Single-gesture mode (open-and-drag): NO momentum for precise value selection
      // Multi-gesture mode (picker already open): Full momentum for fluid scrolling
      // This architectural decision ensures users can precisely select values when
      // opening the picker, while maintaining the kinetic feel during normal scrolling.
      const velocityForSettle = wasOpenOnPointerDownRef.current
        ? velocity // Multi-gesture: use full velocity for momentum
        : 0; // Single-gesture: no momentum, snap directly to nearest value

      debugPickerLog('VELOCITY', {
        measured: velocity.toFixed(0) + ' px/s',
        used: velocityForSettle.toFixed(0) + ' px/s',
        mode: wasOpenOnPointerDownRef.current ? 'multi-gesture' : 'single-gesture',
        behavior: wasOpenOnPointerDownRef.current ? 'momentum' : 'direct-snap',
      });

      settleFromY(currentTranslate, velocityForSettle, () => finalize(hasMoved));
    },
    [
      columnRef,
      emitter,
      isPickerOpen,
      itemHeight,
      lastIndex,
      maxTranslate,
      settleFromY,
      settleToIndex,
      snapPhysics,
      velocityTracker,
      yRaw,
    ]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      handlePointerUp(event);
    },
    [handlePointerUp]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isMovingRef.current) {
        handlePointerUp(event);
      }
    },
    [handlePointerUp]
  );

  const wheelingTimer = useRef<number | null>(null);
  const wheelStartTranslateRef = useRef<number | null>(null);
  const wheelRemainderRef = useRef(0);
  const wheelWasCappedRef = useRef(false);

  const handleWheeling = useCallback(
    (event: WheelEvent) => {
      let delta = event.deltaY;

      if (event.deltaMode === DOM_DELTA_MODE.LINE) {
        delta *= itemHeight;
      } else if (event.deltaMode === DOM_DELTA_MODE.PAGE) {
        delta *= height;
      }

      delta *= normalizedWheelSensitivity;

      // Auto-detect scrolling direction based on input device
      if (event.deltaMode === DOM_DELTA_MODE.PIXEL) {
        // Touchpad (DOM_DELTA_MODE.PIXEL): natural scrolling (like smartphones)
        // Touchpads provide fine-grained pixel deltas, so reduce sensitivity
        // to prevent scrolling too fast (0.35 = roughly 1:1 pixel movement)
        delta = delta * 0.35;
      }
      // LINE mode (mouse wheel) uses delta as-is after sensitivity scaling

      const maxDelta = itemHeight * normalizedWheelDeltaCap;
      const accumulated = wheelRemainderRef.current + delta;
      const boundedDelta = clamp(accumulated, -maxDelta, maxDelta);
      const wasCapped = Math.abs(accumulated) > Math.abs(boundedDelta);
      // Flag as spike if capped by >20% (touchpad accel creates high velocity, don't over-project)
      if (wasCapped && Math.abs(accumulated - boundedDelta) / Math.abs(boundedDelta) > 0.2) {
        wheelWasCappedRef.current = true;
      }
      wheelRemainderRef.current = accumulated - boundedDelta;

      const currentTranslate = yRaw.get();
      // Subtract delta because coordinate system: higher index = lower translateY
      // Positive wheel delta (scroll down) → subtract → lower translateY → higher index
      const rawTranslate = currentTranslate - boundedDelta;

      // Apply strong snap physics for satisfying magnetic "thunk" feel (like phone touch)
      const nearestIndex = indexFromY(rawTranslate, itemHeight, maxTranslate);
      const snapTargetTranslate = yFromIndex(nearestIndex, itemHeight, maxTranslate, lastIndex);
      const deltaToTarget = rawTranslate - snapTargetTranslate;

      let nextTranslate = rawTranslate;
      if (snapEnabled) {
        const wheelStartTranslate = wheelStartTranslateRef.current ?? currentTranslate;
        const totalPixelsMoved = Math.abs(rawTranslate - wheelStartTranslate);
        const snapResult = wheelSnapPhysics.calculate(
          { deltaY: deltaToTarget, velocityY: velocityTracker.getVelocity(), totalPixelsMoved },
          0,
          itemHeight
        );
        nextTranslate = snapResult.mappedTranslate + snapTargetTranslate;
      }

      // Track ALL deltas for accurate velocity (flicks need full velocity captured)
      velocityTracker.addSample(rawTranslate);

      updateScrollerWhileMoving(nextTranslate);
    },
    [
      height,
      itemHeight,
      lastIndex,
      maxTranslate,
      normalizedWheelDeltaCap,
      normalizedWheelSensitivity,
      snapEnabled,
      updateScrollerWhileMoving,
      velocityTracker,
      wheelSnapPhysics,
      yRaw,
    ]
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }
      event.preventDefault();

      if (wheelStartTranslateRef.current === null) {
        // Interrupt any active momentum animation before wheel scrolling starts
        // This ensures wheel behaves like keyboard arrow keys (immediate interruption)
        stopActiveAnimation();

        wheelStartTranslateRef.current = yRaw.get();

        // Reset velocity tracker for new wheel gesture
        velocityTracker.reset();
        velocityTracker.addSample(wheelStartTranslateRef.current);
        wheelRemainderRef.current = 0;
        wheelWasCappedRef.current = false;
        emitter.dragStart('wheel');

        snapPhysics.reset();
        wheelSnapPhysics.reset();
        boundaryHitFiredRef.current = false;
      }

      handleWheeling(event);

      if (wheelingTimer.current !== null) {
        window.clearTimeout(wheelingTimer.current);
      }

      wheelingTimer.current = window.setTimeout(() => {
        const currentTranslate = yRaw.get();
        const startTranslate = wheelStartTranslateRef.current ?? currentTranslate;
        const movementDelta = Math.abs(currentTranslate - startTranslate);
        const hasMoved = movementDelta > MINIMUM_MOVEMENT_PIXELS;

        // Wheel scrolling should NEVER use momentum/flicking - always velocity = 0
        // Only pointer/touch gestures should have momentum physics
        const velocity = 0;

        // Settle to nearest snap point without momentum projection
        settleFromY(currentTranslate, velocity, () => {
          snapPhysics.reset();
          emitter.dragEnd(hasMoved, velocity);
          wheelStartTranslateRef.current = null;
          wheelingTimer.current = null;
          wheelRemainderRef.current = 0;
          wheelWasCappedRef.current = false;
          velocityTracker.reset();
        });
      }, 200);
    },
    [emitter, handleWheeling, settleFromY, snapPhysics, velocityTracker, wheelSnapPhysics, yRaw]
  );

  useEffect(() => {
    return () => {
      if (wheelingTimer.current !== null) {
        window.clearTimeout(wheelingTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = columnRef.current;
    if (!node) return undefined;

    const wheelListener = (event: WheelEvent) => {
      handleWheel(event);
    };

    const wheelListenerOptions: AddEventListenerOptions = { passive: false };
    node.addEventListener('wheel', wheelListener, wheelListenerOptions);
    return () => {
      node.removeEventListener('wheel', wheelListener, wheelListenerOptions);
    };
  }, [handleWheel]);

  useEffect(
    () => () => {
      stopActiveAnimation();
    },
    [stopActiveAnimation]
  );

  useEffect(() => {
    boundaryHitFiredRef.current = false;
  }, [options.length]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    debugPickerLog('CLICK', {
      timestamp: Date.now(),
      detail: event.detail, // 1 for single, 2 for double
      isMoving: isMovingRef.current,
      capturedPointers: Array.from(capturedPointersRef.current),
    });
  }, []);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    debugPickerLog('DOUBLE-CLICK detected', {
      timestamp: Date.now(),
      isMoving: isMovingRef.current,
      capturedPointers: Array.from(capturedPointersRef.current),
      clientX: event.clientX,
      clientY: event.clientY,
    });

    // SAFETY: Force release ALL captured pointers and cleanup
    debugPickerLog('SAFETY: Forcing cleanup due to dblclick');
    capturedPointersRef.current.forEach((id) => {
      try {
        columnRef.current?.releasePointerCapture(id);
        debugPickerLog('SAFETY: Released pointer ID', id);
      } catch (e) {
        debugPickerLog('SAFETY: Failed to release pointer ID', id, e);
      }
    });
    capturedPointersRef.current.clear();
    isMovingRef.current = false;
    debugPickerLog('SAFETY: Forced isMoving = false, cleared all captures');
  }, []);

  return {
    columnRef,
    ySnap,
    centerIndex,
    startIndex,
    windowLength,
    virtualOffsetY,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleWheel,
    handleClick,
    handleDoubleClick,
    // Exposed for external interruption (e.g., keyboard navigation, wheel events)
    interruptMomentum: stopActiveAnimation,
  };
}
