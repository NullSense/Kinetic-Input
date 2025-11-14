# Gesture System Refactoring Guide

## 🎯 Overview

This directory contains a **new event-driven gesture system** designed to replace the tangled callback-based approach in `usePickerColumnInteractions` and `usePickerGestures`.

### Problems Solved

**Before:**
- `usePickerColumnInteractions` (582 lines) = Physics + Gesture Handling mixed together
- `usePickerGestures` (285 lines) = Duplicates gesture logic for orchestration
- Callback soup: `onDragStart`, `onDragEnd`, `onBoundaryHit`, `onVisualValueChange`
- Hard to test (tightly coupled to React events and MotionValues)
- Confusing ownership (who handles what?)

**After:**
- **Primitives**: Reusable gesture handlers tested in isolation
- **Events**: Single `onGesture` prop with type-safe event union
- **Clear separation**: Physics (core) vs Orchestration (quick)
- **Easy testing**: Pure functions, mockable events
- **Maintainable**: Changes to gesture handling don't affect physics

---

## 📁 Module Structure

```
gestures/
├── types.ts              # Event type definitions
├── pointerCapture.ts     # Pointer event handling primitive
├── velocityTracker.ts    # Velocity calculation primitive
├── eventEmitter.ts       # Event creation helpers
├── __tests__/            # Unit tests for each primitive
│   ├── types.test.ts
│   ├── pointerCapture.test.ts
│   └── velocityTracker.test.ts
└── README.md            # This file
```

---

## 🔧 How To Use The Primitives

### 1. Pointer Capture

```typescript
import { createPointerCaptureHandlers } from './gestures/pointerCapture';

const handlers = createPointerCaptureHandlers({
  onCapture: (state) => {
    console.log('Pointer captured at Y:', state.startY);
  },
  onMove: (state, deltaY) => {
    updatePosition(deltaY);
  },
  onRelease: (state, totalDeltaY) => {
    applyMomentum(totalDeltaY);
  },
});

// Wire up to JSX
<div
  onPointerDown={handlers.handlePointerDown}
  onPointerMove={handlers.handlePointerMove}
  onPointerUp={handlers.handlePointerUp}
  onPointerCancel={handlers.handlePointerCancel}
  onPointerLeave={handlers.handlePointerLeave}
/>
```

### 2. Velocity Tracker

```typescript
import { createVelocityTracker } from './gestures/velocityTracker';

const velocityTracker = createVelocityTracker({
  sampleCount: 5,    // Track last 5 samples
  maxSampleAge: 100, // Discard samples older than 100ms
});

// On pointer move
velocityTracker.addSample(event.clientY);

// On pointer up
const velocity = velocityTracker.getVelocity(); // pixels/second
console.log(`Flick velocity: ${velocity}`);
```

### 3. Event Emitter

```typescript
import { createGestureEmitter } from './gestures/eventEmitter';

const emitter = createGestureEmitter(props.onGesture);

// Emit events
emitter.dragStart('pointer');
emitter.visualChange(value, index);
emitter.dragEnd(true, 1200);
emitter.boundaryHit('max', 100);
```

---

## 🔄 Refactoring Strategy

### Phase 1: Create Primitives ✅ DONE

- [x] Event types (`types.ts`)
- [x] Pointer capture (`pointerCapture.ts`)
- [x] Velocity tracker (`velocityTracker.ts`)
- [x] Event emitter (`eventEmitter.ts`)
- [x] Tests for all primitives

### Phase 2: Refactor `usePickerColumnInteractions` 🚧 IN PROGRESS

**Goal:** Extract ~200 lines of gesture code into primitives, emit events instead of callbacks

**Current Structure (simplified):**
```typescript
export function usePickerColumnInteractions({ onDragStart, onDragEnd, ... }) {
  // 582 lines of:
  // - Pointer event handling (extract to primitive)
  // - Velocity tracking (extract to primitive)
  // - Snap physics (keep - this is core functionality)
  // - Virtualization math (keep - this is core functionality)
  // - Callback invocations (replace with events)
}
```

**New Structure:**
```typescript
export function usePickerColumnInteractions({ onGesture, ... }) {
  // Use primitives
  const velocityTracker = useMemo(() => createVelocityTracker(), []);
  const emitter = useMemo(() => createGestureEmitter(onGesture), [onGesture]);

  const pointerHandlers = useMemo(() =>
    createPointerCaptureHandlers({
      onCapture: () => emitter.dragStart('pointer'),
      onMove: (state, deltaY) => {
        velocityTracker.addSample(state.currentY);
        updateScrollerWhileMoving(deltaY);
      },
      onRelease: () => {
        const velocity = velocityTracker.getVelocity();
        emitter.dragEnd(hasMoved, velocity);
      },
    }),
    [emitter, velocityTracker]
  );

  // Keep snap physics and virtualization (core functionality)
  const snapPhysics = useSnapPhysics(...);
  const { centerIndex, windowLength } = useVirtualWindow(...);

  return {
    ...pointerHandlers,
    // ... rest
  };
}
```

**Expected Savings:** ~150-200 LOC

### Phase 3: Update `PickerColumn` Interface

**Before:**
```tsx
<Picker.Column
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onBoundaryHit={handleBoundaryHit}
  onVisualValueChange={handleVisualValueChange}
/>
```

**After:**
```tsx
<Picker.Column
  onGesture={(event) => {
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
        handleVisualValueChange(event.value);
        break;
    }
  }}
/>
```

**Or use event-specific handlers:**
```tsx
<Picker.Column
  onGesture={(event) => {
    // Type-safe event handling
    if (isGestureEvent(event, 'drag:start')) {
      console.log('Drag source:', event.source);
    }
  }}
/>
```

### Phase 4: Refactor `usePickerGestures`

**Goal:** Consume events instead of providing callbacks

**Before:**
```typescript
export function usePickerGestures({ ... }) {
  return {
    handleDragStart: () => { /* 50 lines of logic */ },
    handleDragEnd: () => { /* 60 lines of logic */ },
    handleBoundaryHit: () => { /* 40 lines of logic */ },
  };
}
```

**After:**
```typescript
export function createGestureEventHandler({ stateMachine, ... }) {
  return (event: PickerGestureEvent) => {
    switch (event.type) {
      case 'drag:start':
        clearTimers();
        currentGestureSource.current = event.source;
        stateMachine.handleDragStart();
        break;

      case 'drag:end':
        if (event.hasMoved) {
          stateMachine.handleMomentumEnd(false);
        }
        break;

      case 'boundary:hit':
        scheduleBoundaryClose();
        break;
    }
  };
}
```

**Expected Savings:** ~100 LOC (cleaner switch vs scattered functions)

### Phase 5: Update Tests

**For each primitive:**
- ✅ Unit tests already written (see `__tests__/`)

**For refactored hooks:**
- Update `usePickerColumnInteractions.test.tsx` to test event emissions
- Update `usePickerGestures.test.ts` to test event consumption
- Update integration tests in `PickerColumn.test.tsx`

**Testing Pattern:**
```typescript
it('emits drag:start event on pointer capture', () => {
  const onGesture = vi.fn();
  const { result } = renderHook(() =>
    usePickerColumnInteractions({ onGesture, ... })
  );

  // Simulate pointer down
  act(() => {
    result.current.handlePointerDown(mockPointerEvent());
  });

  expect(onGesture).toHaveBeenCalledWith({
    type: 'drag:start',
    timestamp: expect.any(Number),
    source: 'pointer',
  });
});
```

---

## 📊 Expected Impact

### Lines of Code

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| `usePickerColumnInteractions` | 582 | ~380 | **-200** |
| `usePickerGestures` | 285 | ~180 | **-105** |
| New primitives | 0 | +350 | -350 |
| **Net Savings** | — | — | **~45 LOC** |

**But wait, net savings are small?**

Yes! The **value isn't in LOC reduction** — it's in:
- ✅ **Reusability** (primitives work outside picker)
- ✅ **Testability** (primitives tested in isolation)
- ✅ **Clarity** (event-driven is easier to understand)
- ✅ **Maintainability** (changes don't ripple through system)

### Bundle Size

- **Tree-shaking**: Unused primitives can be eliminated
- **Code splitting**: Primitives can be lazy-loaded
- **Expected impact**: Neutral to slightly smaller

---

## 🧪 Testing Strategy

### 1. Primitive Tests (✅ Done)

Each primitive has comprehensive unit tests:
- `types.test.ts` - Type guards and event structure
- `pointerCapture.test.ts` - Pointer lifecycle, edge cases
- `velocityTracker.test.ts` - Velocity calculation, sample management

### 2. Integration Tests (🚧 TODO)

**Test that refactored hooks emit correct events:**

```typescript
describe('usePickerColumnInteractions with events', () => {
  it('emits drag:start on pointer capture', () => {
    const handler = vi.fn();
    // ... test
  });

  it('emits boundary:hit at max boundary', () => {
    // ... test overscroll scenario
  });

  it('emits drag:end with velocity on release', () => {
    // ... test momentum
  });
});
```

### 3. Backwards Compatibility Tests

**Ensure existing behavior is preserved:**

```typescript
describe('Backwards compatibility', () => {
  it('QuickNumberInput still works with new events', () => {
    render(<QuickNumberInput value={50} onChange={vi.fn()} />);
    // ... test interactions still work
  });
});
```

---

## 🚀 Migration Checklist

- [x] Create event types and primitives
- [x] Write comprehensive primitive tests
- [ ] Refactor `usePickerColumnInteractions` to use primitives
- [ ] Update `PickerColumn` to accept `onGesture` prop
- [ ] Refactor `usePickerGestures` to consume events
- [ ] Update `QuickNumberInput` integration
- [ ] Update all existing tests
- [ ] Run full test suite
- [ ] Update TypeScript types/exports
- [ ] Add migration guide to main README
- [ ] Update Storybook examples (if applicable)

---

## 💡 Key Design Decisions

### Why Events Over Callbacks?

**Callbacks (old):**
```typescript
<Component
  onDragStart={() => {}}
  onDragEnd={() => {}}
  onBoundaryHit={() => {}}
  onVisualValueChange={() => {}}
/>
```
- 4 separate props
- Hard to add new events (breaks API)
- Confusing which to implement

**Events (new):**
```typescript
<Component
  onGesture={(event) => {
    // Handle only events you care about
    if (event.type === 'drag:start') { /* ... */ }
  }}
/>
```
- Single prop
- Easy to add new events (non-breaking)
- Clear consumption pattern

### Why Primitives?

**Monolithic (old):**
- Hard to test (need to mock React, MotionValues, refs)
- Hard to reuse (tightly coupled to picker)
- Hard to understand (582 lines of mixed concerns)

**Primitives (new):**
- Easy to test (pure functions, no dependencies)
- Easy to reuse (work in any React component)
- Easy to understand (single responsibility)

---

## 📚 Further Reading

- [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Testing Pure Functions](https://kentcdodds.com/blog/pure-functions)

---

## ❓ FAQ

**Q: Do I need to refactor everything at once?**
A: No! You can migrate incrementally:
1. Add `onGesture` prop while keeping old callbacks
2. Migrate consumers one at a time
3. Remove old callbacks after migration

**Q: What about backwards compatibility?**
A: Keep both APIs during migration:
```typescript
interface PickerColumnProps {
  // New API
  onGesture?: PickerGestureHandler;

  // Old API (deprecated)
  /** @deprecated Use onGesture instead */
  onDragStart?: () => void;
  /** @deprecated Use onGesture instead */
  onDragEnd?: (hasMoved: boolean) => void;
}
```

**Q: How do I debug event flow?**
A: Add logging to event handler:
```typescript
<Picker.Column
  onGesture={(event) => {
    console.log('Gesture event:', event);
    // ... handle event
  }}
/>
```

---

## 🎉 Summary

This refactoring **clarifies architecture** without major API changes:

- **Physics stays in core** (`usePickerColumnInteractions`)
- **Orchestration stays in quick** (`usePickerGestures`)
- **Interface is cleaner** (events vs callbacks)
- **Code is more testable** (primitives in isolation)
- **System is more maintainable** (clear separation)

The primitives are **production-ready** and **fully tested**. The refactoring guide above provides a clear path to complete the migration.
