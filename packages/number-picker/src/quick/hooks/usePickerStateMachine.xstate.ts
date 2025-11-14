import { useEffect, useCallback, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import type { PickerStateMachineConfig } from './pickerStateMachine.shared';
import { pickerStateMachine } from './pickerStateMachine.machine';
export type {
  InteractionSource,
  PickerContext,
  PickerEvent,
  PickerStateMachineConfig,
  CloseContext,
} from './pickerStateMachine.shared';

/**
 * Picker state machine using XState v5
 * Manages picker lifecycle: Closed → Interacting → Settling → Idle → Closed
 *
 * Key features:
 * - Multiple interaction sources (pointer, wheel) tracked in Set
 * - Different auto-close delays based on gesture type
 * - Watchdog timeout for vendor callback failures
 * - Controlled/uncontrolled mode support
 */


// ============ React Hook ============

/**
 * Wraps the picker XState machine with React bindings and exposes lifecycle handlers.
 * @param {PickerStateMachineConfig} config
 * @returns {{ state: 'closed'|'interacting'|'settling'|'idle', isInteracting: boolean, isSettling: boolean, shouldBlockClose: boolean, handlePointerDown: Function, handlePointerUp: Function, handleWheelStart: Function, handleWheelIdle: Function, handleMomentumEnd: Function, resetIdleTimer: Function, forceClose: Function }}
 */
export const usePickerStateMachine = ({
  isOpen,
  isControlled,
  onRequestClose,
  idleTimeout = 4000,
  settleGracePeriod = 150,
  wheelIdleTimeout = 800,
}: PickerStateMachineConfig) => {
  const [state, send] = useMachine(pickerStateMachine, {
    input: {
      isOpen,
      isControlled,
      onRequestClose,
      idleTimeout,
      settleGracePeriod,
      wheelIdleTimeout,
    },
  });
  const matches = (value: string) => state.matches(value as never);

  // Sync with controlled mode
  useEffect(() => {
    if (isControlled && !isOpen && !matches('closed')) {
      send({ type: 'EXTERNAL_CLOSE' });
    }
  }, [isControlled, isOpen, matches, send]);

  // ✅ PERFORMANCE FIX: Memoize functions to prevent re-renders downstream
  // Without this, every render creates new arrow functions, causing CollapsibleNumberPickerPresenter
  // to re-render at 60Hz during any state update
  const handlePointerDown = useCallback(() => send({ type: 'POINTER_DOWN' }), [send]);
  const handlePointerUp = useCallback(() => send({ type: 'POINTER_UP' }), [send]);
  const handleWheelStart = useCallback(() => send({ type: 'WHEEL_START' }), [send]);
  const handleWheelIdle = useCallback(() => send({ type: 'WHEEL_IDLE' }), [send]);
  const handleMomentumEnd = useCallback((atBoundary: boolean) => send({ type: 'MOMENTUM_END', atBoundary }), [send]);
  const resetIdleTimer = useCallback(() => send({ type: 'RESET_IDLE' }), [send]);
  const forceClose = useCallback(() => send({ type: 'FORCE_CLOSE' }), [send]);
  const handleExternalClose = useCallback((reason?: string) => send({ type: 'EXTERNAL_CLOSE', reason }), [send]);

  // Compute boolean values
  const stateValue = state.value as 'closed' | 'interacting' | 'settling' | 'idle';
  const isInteracting = matches('interacting');
  const isSettling = matches('settling');
  const shouldBlockClose = isInteracting || isSettling;

  // ✅ Memoize return object to prevent creating new object on every render
  return useMemo(() => ({
    state: stateValue,
    isInteracting,
    isSettling,
    shouldBlockClose,
    handlePointerDown,
    handlePointerUp,
    handleWheelStart,
    handleWheelIdle,
    handleMomentumEnd,
    resetIdleTimer,
    forceClose,
    handleExternalClose,
  }), [
    stateValue,
    isInteracting,
    isSettling,
    shouldBlockClose,
    handlePointerDown,
    handlePointerUp,
    handleWheelStart,
    handleWheelIdle,
    handleMomentumEnd,
    resetIdleTimer,
    forceClose,
    handleExternalClose,
  ]);
};
