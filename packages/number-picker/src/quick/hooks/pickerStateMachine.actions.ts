import { assign, assertEvent } from 'xstate';
import type { InteractionSource, PickerContext } from './pickerStateMachine.shared';

/**
 * Action implementations for the picker state machine, updating interaction tracking and notifying closes.
 */
export const pickerActions = {
  startPointerInteraction: assign(({ context }: { context: PickerContext }) => ({
    activeInputs: new Set(context.activeInputs).add('pointer' as InteractionSource),
    interactionCount: context.interactionCount + 1,
    isSingleGesture: context.interactionCount === 0,
  })),
  startWheelInteraction: assign(({ context }: { context: PickerContext }) => ({
    activeInputs: new Set(context.activeInputs).add('wheel' as InteractionSource),
    interactionCount: context.interactionCount + 1,
    isSingleGesture: context.interactionCount === 0,
    openedViaWheel: context.interactionCount === 0 ? true : context.openedViaWheel,
  })),
  endPointerInteraction: assign(({ context }: { context: PickerContext }) => {
    const next = new Set(context.activeInputs);
    next.delete('pointer');
    return { activeInputs: next };
  }),
  endWheelInteraction: assign(({ context }: { context: PickerContext }) => {
    const next = new Set(context.activeInputs);
    next.delete('wheel');
    return { activeInputs: next };
  }),
  resetInteractionState: assign(() => ({
    activeInputs: new Set<InteractionSource>(),
    interactionCount: 0,
    isSingleGesture: true,
    openedViaWheel: false,
    atBoundary: false,
  })),
  storeBoundaryFlag: assign(({ event }: { event: { type: string; atBoundary: boolean } }) => {
    assertEvent(event, 'MOMENTUM_END');
    return { atBoundary: event.atBoundary };
  }),
  resetWheelFlag: assign(() => ({
    openedViaWheel: false,
  })),
  resetWheelFlagIfNeeded: assign(({ context }: { context: PickerContext }) => {
    if (context.openedViaWheel && context.isSingleGesture) {
      return { openedViaWheel: false };
    }
    return {};
  }),
  notifyRequestClose: ({ context }: { context: PickerContext }) => {
    const reason = context.isSingleGesture ? 'gesture' : 'idle';
    context.config.onRequestClose({
      reason,
      atBoundary: context.atBoundary,
    });
  },
  notifyExternalClose: ({ context, event }: { context: PickerContext; event: Extract<PickerEvent, { type: 'EXTERNAL_CLOSE' }> }) => {
    const reason = event.reason || 'external-close';
    context.config.onRequestClose({
      reason,
      atBoundary: context.atBoundary,
    });
  },
  logWatchdogTimeout: () => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.warn('[CollapsiblePicker] Forcing settle - vendor callback timeout');
    }
  },
};
