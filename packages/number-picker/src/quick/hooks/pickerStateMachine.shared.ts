export type InteractionSource = 'pointer' | 'wheel';

export interface PickerContext {
  activeInputs: Set<InteractionSource>;
  interactionCount: number;
  isSingleGesture: boolean;
  openedViaWheel: boolean;
  atBoundary: boolean;
  config: {
    isOpen: boolean;
    isControlled: boolean;
    idleTimeout: number;
    settleGracePeriod: number;
    wheelIdleTimeout: number;
    onRequestClose: (context: CloseContext) => void;
  };
}

export type PickerEvent =
  | { type: 'POINTER_DOWN' }
  | { type: 'POINTER_UP' }
  | { type: 'WHEEL_START' }
  | { type: 'WHEEL_IDLE' }
  | { type: 'MOMENTUM_END'; atBoundary: boolean }
  | { type: 'FORCE_CLOSE' }
  | { type: 'RESET_IDLE' }
  | { type: 'EXTERNAL_CLOSE'; reason?: string }
  | { type: 'AUTO_CLOSE' };

export interface CloseContext {
  reason: 'gesture' | 'idle' | 'backdrop-click' | 'escape' | 'middle-row-highlight-click' | 'click-outside' | 'external-close' | string;
  atBoundary: boolean;
}

export interface PickerStateMachineConfig {
  isOpen: boolean;
  isControlled: boolean;
  onRequestClose: (context: CloseContext) => void;
  idleTimeout?: number;
  settleGracePeriod?: number;
  wheelIdleTimeout?: number;
}

/**
 * Guard predicates for the picker state machine, derived from active input bookkeeping.
 */
export const pickerGuards = {
  hasNoActiveInputs: ({ context }: { context: PickerContext }) => context.activeInputs.size === 0,
  willBeEmptyAfterPointer: ({ context }: { context: PickerContext }) =>
    context.activeInputs.size === 1 && context.activeInputs.has('pointer'),
  willBeEmptyAfterWheel: ({ context }: { context: PickerContext }) =>
    context.activeInputs.size === 1 && context.activeInputs.has('wheel'),
  isSingleGesture: ({ context }: { context: PickerContext }) => context.isSingleGesture,
  isWheelOpened: ({ context }: { context: PickerContext }) => context.openedViaWheel,
  isExternallyClosed: ({ context }: { context: PickerContext }) =>
    context.config.isControlled && !context.config.isOpen,
};
