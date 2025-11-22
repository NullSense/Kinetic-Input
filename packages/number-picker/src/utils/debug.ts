// Extend Window interface with debug flags
interface DebugWindow extends Window {
  __QNI_DEBUG__?: boolean;
  __QNI_SNAP_DEBUG__?: boolean;
  __QNI_STATE_DEBUG__?: boolean;
  __QNI_WHEEL_DEBUG__?: boolean;
  __QNI_ANIMATION_DEBUG__?: boolean;
  __QNI_PICKER_DEBUG__?: boolean;
  __animationDebugger?: unknown;
  [key: string]: unknown; // Allow indexing by string
}

declare const window: DebugWindow;

/**
 * Unified debug logging system for number-picker package
 *
 * **IMPORTANT: Debug logging is OPT-IN only.**
 *
 * Performance characteristics:
 * - Production builds: Zero overhead (tree-shaken out)
 * - Development: No-op unless explicitly enabled via window flags
 * - When enabled: Minimal overhead (~0.001ms per call)
 *
 * How to enable (development/staging only):
 * ```javascript
 * // In browser console or before component mount:
 * window.__QNI_DEBUG__ = true;          // CollapsiblePicker logs
 * window.__QNI_SNAP_DEBUG__ = true;     // Snap physics logs
 * window.__QNI_STATE_DEBUG__ = true;    // State machine logs
 * window.__QNI_WHEEL_DEBUG__ = true;    // Picker logs
 * window.__QNI_ANIMATION_DEBUG__ = true; // Animation lifecycle logs
 *
 * // Or enable all at once:
 * enableAllDebugNamespaces();
 * ```
 *
 * Usage in code:
 * ```typescript
 * import { debugLog, debugSnapLog } from '@tensil/number-picker/utils';
 *
 * debugLog('Picker opened', { value });      // No-op unless flag set
 * debugSnapLog('Snap calculated', { offset }); // No-op unless flag set
 * ```
 *
 * Production safety:
 * - All debug code is stripped from production builds (tree-shaking)
 * - No performance impact in production
 * - No console spam in development unless explicitly enabled
 */

export interface DebugNamespace {
  readonly name: string;
  readonly enabled: () => boolean;
}

class DebugLogger {
  private namespaces = new Map<string, DebugNamespace>();

  register(name: string, enabledFn: () => boolean): DebugNamespace {
    const namespace = { name, enabled: enabledFn };
    this.namespaces.set(name, namespace);
    return namespace;
  }

  log(namespace: DebugNamespace, ...args: unknown[]): void {
    if (!namespace.enabled()) return;
    console.debug(`[${namespace.name}]`, ...args);
  }

  warn(namespace: DebugNamespace, ...args: unknown[]): void {
    if (!namespace.enabled()) return;
    console.warn(`[${namespace.name}]`, ...args);
  }

  error(namespace: DebugNamespace, ...args: unknown[]): void {
    if (!namespace.enabled()) return;
    console.error(`[${namespace.name}]`, ...args);
  }

  /** List all registered namespaces */
  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }
}

// ============ Production Gate ============

/**
 * Check if we're in a production environment
 * Used to completely disable debug logging in production (tree-shaking)
 *
 * Note: Relies on process.env.NODE_ENV which bundlers (Vite, webpack, etc.)
 * replace at build time. import.meta is intentionally NOT used to maintain
 * compatibility with all JavaScript environments including StackBlitz/WebContainers.
 */
const isProduction = (): boolean => {
  // Check process.env (bundlers replace this at build time)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return true;
  }

  return false;
};

// ============ Flag Resolution ============

/**
 * Resolves debug flag - OPT-IN only (no auto-enable)
 *
 * Only enables when:
 * 1. NOT in production AND
 * 2. window[key] is explicitly set to true
 *
 * This prevents console spam in development unless explicitly requested.
 */
const resolveDebugFlag = (key: string): boolean => {
  // Production: Always disabled (tree-shaken out by bundlers)
  if (isProduction()) {
    return false;
  }

  // Development/Test: Only enable if explicitly set via window flag
  if (typeof window !== 'undefined' && window[key] === true) {
    return true;
  }

  // Default: Disabled (opt-in only)
  return false;
};

// ============ Global Logger Instance ============

const logger = new DebugLogger();

// ============ Namespace Registration ============

export const DEBUG_QNI = logger.register('CollapsiblePicker', () =>
  resolveDebugFlag('__QNI_DEBUG__')
);

export const DEBUG_SNAP = logger.register('SnapPhysics', () =>
  resolveDebugFlag('__QNI_SNAP_DEBUG__')
);

export const DEBUG_STATE_MACHINE = logger.register('StateMachine', () =>
  resolveDebugFlag('__QNI_STATE_DEBUG__')
);

export const DEBUG_WHEEL_PICKER = logger.register('Picker', () =>
  resolveDebugFlag('__QNI_WHEEL_DEBUG__')
);

export const DEBUG_ANIMATION = logger.register('Animation', () =>
  resolveDebugFlag('__QNI_ANIMATION_DEBUG__')
);

export const DEBUG_PICKER = logger.register('PickerPhysics', () =>
  resolveDebugFlag('__QNI_PICKER_DEBUG__')
);

// ============ Convenience Exports ============

/**
 * CollapsiblePicker debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_DEBUG__ = true
 * @example debugLog('Picker opened', { value: 42 });
 */
export const debugLog = (...args: unknown[]) => logger.log(DEBUG_QNI, ...args);

/**
 * SnapPhysics debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_SNAP_DEBUG__ = true
 * @example debugSnapLog('Snap calculated', { offset: 10 });
 */
export const debugSnapLog = (...args: unknown[]) => logger.log(DEBUG_SNAP, ...args);

/**
 * StateMachine debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_STATE_DEBUG__ = true
 * @example debugStateLog('State transition', { from: 'idle', to: 'interacting' });
 */
export const debugStateLog = (...args: unknown[]) => logger.log(DEBUG_STATE_MACHINE, ...args);

/**
 * Picker debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_WHEEL_DEBUG__ = true
 * @example debugWheelLog('Wheel scrolled', { delta: 100 });
 */
export const debugWheelLog = (...args: unknown[]) => logger.log(DEBUG_WHEEL_PICKER, ...args);

/**
 * Animation lifecycle debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_ANIMATION_DEBUG__ = true
 * @example debugAnimationLog('Animation started', { animationId: 'abc123', target: 100 });
 */
export const debugAnimationLog = (...args: unknown[]) => logger.log(DEBUG_ANIMATION, ...args);

/**
 * Picker physics debug logging (production: no-op, tree-shaken)
 *
 * Enable in dev: window.__QNI_PICKER_DEBUG__ = true
 * @example debugPickerLog('Pointer down', { pointerId: 1, clientY: 100 });
 */
export const debugPickerLog = (...args: unknown[]) => logger.log(DEBUG_PICKER, ...args);

// ============ Smart Event Debugger Framework ============

/**
 * Generic event debugger that groups related events and only logs anomalies.
 * Reduces console spam from hundreds of logs to just a few collapsed groups.
 *
 * Usage:
 * ```typescript
 * const myDebugger = new EventDebugger('MyFeature', DEBUG_NAMESPACE, {
 *   maxEvents: 10,
 *   detectAnomaly: (events) => events.length > 5
 * });
 * myDebugger.logEvent('start', { data: 'foo' });
 * ```
 */
interface EventDebuggerConfig<T extends { timestamp: number }> {
  /** Maximum events to keep in memory */
  maxEvents?: number;
  /** Function to detect anomalies (returns warning message or null) */
  detectAnomaly?: (events: T[], newEvent: T) => string | null;
}

class EventDebugger<T extends { timestamp: number }> {
  private events: T[] = [];
  private config: Required<EventDebuggerConfig<T>>;
  private activeGroupCount = 0;

  constructor(
    private name: string,
    private namespace: DebugNamespace,
    config: EventDebuggerConfig<T> = {}
  ) {
    this.config = {
      maxEvents: config.maxEvents ?? 10,
      detectAnomaly: config.detectAnomaly ?? (() => null),
    };
  }

  /** Log an event (automatically manages grouping) */
  logEvent(event: T, groupLabel?: string, collapsed = true): void {
    if (!this.namespace.enabled()) return;

    this.events.push(event);
    this.trimEvents();

    // Check for anomalies
    const anomaly = this.config.detectAnomaly(this.events, event);
    if (anomaly) {
      console.warn(`[${this.name}] ⚠️ ${anomaly}`, event);
    }

    // Create group if label provided
    if (groupLabel) {
      if (collapsed) {
        console.groupCollapsed(groupLabel);
      } else {
        console.group(groupLabel);
      }
      this.activeGroupCount++;
    }
  }

  /** End current group */
  endGroup(): void {
    if (!this.namespace.enabled()) return;
    if (this.activeGroupCount > 0) {
      console.groupEnd();
      this.activeGroupCount--;
    }
  }

  /** Log data within current group */
  logInGroup(label: string, data: unknown): void {
    if (!this.namespace.enabled()) return;
    console.log(label, data);
  }

  /** Get recent event history */
  getHistory(): T[] {
    return [...this.events];
  }

  /** Print summary of recent events */
  printSummary(formatEvent: (event: T, index: number, events: T[]) => string): void {
    if (!this.namespace.enabled()) return;

    console.group(`[${this.name}] Recent History`);
    this.events.forEach((event, i) => {
      console.log(formatEvent(event, i, this.events));
    });
    console.groupEnd();
  }

  private trimEvents(): void {
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }
  }
}

// ============ Animation-Specific Debugger ============

interface AnimationEvent {
  type: 'start' | 'stop' | 'complete' | 'cancelled';
  animationId: string;
  targetIndex: number;
  timestamp: number;
  currentY?: number;
  target?: number;
}

class AnimationDebugger {
  private debugger: EventDebugger<AnimationEvent>;
  private activeAnimationId: string | null = null;
  private animationCount = 0;

  constructor() {
    this.debugger = new EventDebugger<AnimationEvent>('Animation', DEBUG_ANIMATION, {
      maxEvents: 10,
      detectAnomaly: (events, newEvent) => {
        // Detect if starting animation while another is active
        if (
          newEvent.type === 'start' &&
          this.activeAnimationId &&
          this.activeAnimationId !== newEvent.animationId
        ) {
          return `Starting new animation while ${this.activeAnimationId} is active`;
        }
        return null;
      },
    });
  }

  /** Start tracking an animation */
  start(animationId: string, targetIndex: number, currentY: number, target: number): void {
    if (!DEBUG_ANIMATION.enabled()) return;

    const event: AnimationEvent = {
      type: 'start',
      animationId,
      targetIndex,
      timestamp: performance.now(),
      currentY,
      target,
    };

    this.activeAnimationId = animationId;
    this.animationCount++;

    this.debugger.logEvent(
      event,
      `[Animation] #${this.animationCount} → Index ${targetIndex} (${animationId})`,
      true // collapsed
    );
    this.debugger.logInGroup('Start:', {
      currentY,
      target,
      distance: Math.abs(target - currentY).toFixed(1),
    });
  }

  /** Track animation stop */
  stop(animationId: string, targetIndex: number | null): void {
    if (!DEBUG_ANIMATION.enabled()) return;

    const event: AnimationEvent = {
      type: 'stop',
      animationId,
      targetIndex: targetIndex ?? -1,
      timestamp: performance.now(),
    };

    this.debugger.logEvent(event);
    this.debugger.logInGroup('Stop:', { targetIndex, reason: 'Superseded by new animation' });
    this.debugger.endGroup();

    this.activeAnimationId = null;
  }

  /** Track animation completion */
  complete(animationId: string, targetIndex: number, finalY: number): void {
    if (!DEBUG_ANIMATION.enabled()) return;

    const startEvent = this.debugger
      .getHistory()
      .find((e) => e.type === 'start' && e.animationId === animationId);
    const duration = startEvent ? performance.now() - startEvent.timestamp : 0;

    const event: AnimationEvent = {
      type: 'complete',
      animationId,
      targetIndex,
      timestamp: performance.now(),
    };

    this.debugger.logEvent(event);
    this.debugger.logInGroup('Complete:', {
      targetIndex,
      finalY,
      duration: `${duration.toFixed(1)}ms`,
    });
    this.debugger.endGroup();

    this.activeAnimationId = null;
  }

  /** Track animation cancellation (guard triggered) */
  cancel(animationId: string, currentActiveId: string | null): void {
    if (!DEBUG_ANIMATION.enabled()) return;

    const event: AnimationEvent = {
      type: 'cancelled',
      animationId,
      targetIndex: -1,
      timestamp: performance.now(),
    };

    this.debugger.logEvent(event);
    console.warn(`[Animation] ⚠️ onComplete guard triggered - animation was stopped`, {
      stoppedId: animationId,
      currentActiveId,
    });
    this.debugger.endGroup();
  }

  /** Get recent animation history */
  getHistory(): AnimationEvent[] {
    return this.debugger.getHistory();
  }

  /** Print summary of recent animations */
  printSummary(): void {
    this.debugger.printSummary((event, i, events) => {
      const relTime = i > 0 ? `+${(event.timestamp - events[0].timestamp).toFixed(0)}ms` : '0ms';
      return `${relTime} ${event.type.padEnd(10)} ${event.animationId} → index ${event.targetIndex}`;
    });
  }
}

/** Global animation debugger instance */
export const animationDebugger = new AnimationDebugger();

// Expose to window for manual inspection
if (typeof window !== 'undefined' && !isProduction()) {
  window.__animationDebugger = animationDebugger;
}

// ============ Advanced API ============

/** Export EventDebugger for creating custom smart debuggers */
export { EventDebugger, type EventDebuggerConfig };

/** Access to underlying logger for advanced use cases */
export { logger as debugLogger };

/**
 * Enable all debug namespaces (development/staging only)
 *
 * Use this in browser console to turn on all debug logging at once.
 * Only works in non-production environments.
 *
 * @example
 * ```javascript
 * // In browser console:
 * import { enableAllDebugNamespaces } from '@tensil/number-picker/utils';
 * enableAllDebugNamespaces();
 * ```
 */
export const enableAllDebugNamespaces = () => {
  if (typeof window !== 'undefined' && !isProduction()) {
    window.__QNI_DEBUG__ = true;
    window.__QNI_SNAP_DEBUG__ = true;
    window.__QNI_STATE_DEBUG__ = true;
    window.__QNI_WHEEL_DEBUG__ = true;
    window.__QNI_ANIMATION_DEBUG__ = true;
    console.log('[Debug] All number-picker namespaces enabled:', logger.getNamespaces());
    console.log('[Debug] Reload page for changes to take effect');
  } else if (isProduction()) {
    console.warn('[Debug] Cannot enable debug logging in production');
  }
};

/**
 * Disable all debug namespaces
 *
 * @example
 * ```javascript
 * // In browser console:
 * import { disableAllDebugNamespaces } from '@tensil/number-picker/utils';
 * disableAllDebugNamespaces();
 * ```
 */
export const disableAllDebugNamespaces = () => {
  if (typeof window !== 'undefined') {
    window.__QNI_DEBUG__ = false;
    window.__QNI_SNAP_DEBUG__ = false;
    window.__QNI_STATE_DEBUG__ = false;
    window.__QNI_WHEEL_DEBUG__ = false;
    window.__QNI_ANIMATION_DEBUG__ = false;
    console.log('[Debug] All number-picker namespaces disabled');
    console.log('[Debug] Reload page for changes to take effect');
  }
};
