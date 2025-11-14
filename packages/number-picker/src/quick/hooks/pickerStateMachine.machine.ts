// @ts-nocheck
import { setup } from 'xstate';
import { pickerActions } from './pickerStateMachine.actions';
import {
  pickerGuards,
  type InteractionSource,
  type PickerContext,
  type PickerEvent,
  type PickerStateMachineConfig,
} from './pickerStateMachine.shared';

/**
 * XState definition for the picker lifecycle, tracking gesture sources and auto-close timers.
 */
export const pickerStateMachine = setup({
  types: {
    context: {} as PickerContext,
    events: {} as PickerEvent,
    input: {} as PickerStateMachineConfig,
  },
  guards: pickerGuards,
  actions: pickerActions as any,
  delays: {
    autoCloseDelay: ({ context }: { context: PickerContext }): number => {
      if (context.atBoundary) {
        return 0;
      }

      if (context.openedViaWheel && context.isSingleGesture) {
        return context.config.wheelIdleTimeout;
      }

      if (context.isSingleGesture) {
        return context.config.settleGracePeriod;
      }

      return context.config.idleTimeout;
    },
  },
}).createMachine({
  id: 'picker',
  initial: 'closed',
  context: ({ input }: { input: PickerStateMachineConfig }) => ({
    activeInputs: new Set<InteractionSource>(),
    interactionCount: 0,
    isSingleGesture: true,
    openedViaWheel: false,
    atBoundary: false,
    config: {
      isOpen: input.isOpen,
      isControlled: input.isControlled,
      idleTimeout: input.idleTimeout ?? 4000,
      settleGracePeriod: input.settleGracePeriod ?? 150,
      wheelIdleTimeout: input.wheelIdleTimeout ?? 800,
      onRequestClose: input.onRequestClose,
    },
  }),

  states: {
    closed: {
      on: {
        POINTER_DOWN: {
          target: 'interacting',
          actions: pickerActions.startPointerInteraction,
        },
        WHEEL_START: {
          target: 'interacting',
          actions: pickerActions.startWheelInteraction,
        },
        FORCE_CLOSE: {
          actions: pickerActions.resetInteractionState,
        },
        EXTERNAL_CLOSE: {
          // Already closed, but still notify in case audio/side effects needed
          actions: pickerActions.notifyExternalClose,
        },
      },
    },

    interacting: {
      on: {
        POINTER_DOWN: {
          actions: pickerActions.startPointerInteraction,
        },
        WHEEL_START: {
          actions: pickerActions.startWheelInteraction,
        },
        POINTER_UP: [
          {
            target: 'settling',
            guard: 'willBeEmptyAfterPointer',
            actions: pickerActions.endPointerInteraction,
          },
          {
            actions: pickerActions.endPointerInteraction,
          },
        ],
        WHEEL_IDLE: [
          {
            target: 'settling',
            guard: 'willBeEmptyAfterWheel',
            actions: pickerActions.endWheelInteraction,
          },
          {
            actions: pickerActions.endWheelInteraction,
          },
        ],
        FORCE_CLOSE: {
          target: 'closed',
          actions: pickerActions.resetInteractionState,
        },
        EXTERNAL_CLOSE: {
          target: 'closed',
          actions: [
            pickerActions.notifyExternalClose,
            pickerActions.resetInteractionState,
          ],
        },
      },
    },

    settling: {
      on: {
        MOMENTUM_END: {
          target: 'idle',
          actions: pickerActions.storeBoundaryFlag,
        },
        FORCE_CLOSE: {
          target: 'closed',
          actions: pickerActions.resetInteractionState,
        },
        EXTERNAL_CLOSE: {
          target: 'closed',
          actions: [
            pickerActions.notifyExternalClose,
            pickerActions.resetInteractionState,
          ],
        },
      },
      after: {
        1000: {
          target: 'idle',
          actions: pickerActions.logWatchdogTimeout,
        },
      },
    },

    idle: {
      on: {
        POINTER_DOWN: {
          target: 'interacting',
          actions: pickerActions.startPointerInteraction,
        },
        WHEEL_START: {
          target: 'interacting',
          actions: pickerActions.startWheelInteraction,
        },
        RESET_IDLE: {
          target: 'idle',
          reenter: true,
        },
        FORCE_CLOSE: {
          target: 'closed',
          actions: pickerActions.resetInteractionState,
        },
        EXTERNAL_CLOSE: {
          target: 'closed',
          actions: [
            pickerActions.notifyExternalClose,
            pickerActions.resetInteractionState,
          ],
        },
      },
      after: {
        autoCloseDelay: {
          target: 'closed',
          actions: [
            pickerActions.notifyRequestClose,
            pickerActions.resetWheelFlagIfNeeded,
            pickerActions.resetInteractionState,
          ],
        },
      },
    },
  },
});
