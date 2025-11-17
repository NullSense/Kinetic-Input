# Kinetic Input - Architecture Guide

> **Component library for high-performance React number pickers with kinetic scrolling**

This document provides an in-depth look at the architecture of the `@tensil/kinetic-input` library.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [Physics & Gestures](#physics--gestures)
- [Rendering Strategy](#rendering-strategy)
- [Event Flow](#event-flow)
- [Debug System](#debug-system)
- [Performance Considerations](#performance-considerations)

---

## Overview

Kinetic Input is built around three main component families:

1. **CollapsibleNumberPicker** (`quick/`) - Full-featured collapsible input with touch/mouse/wheel support
2. **PickerColumn** (`picker/`) - Core wheel picker primitive
3. **StandaloneWheelPicker** (`wheel/`) - Standalone wheel component

### Design Philosophy

- **Performance First**: Virtual rendering, memoization, and efficient event handling
- **Declarative State**: XState v5 state machines for interaction lifecycle
- **Physics-Based**: Momentum, snapping, and overscroll feel natural
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support
- **Type Safety**: Full TypeScript with strict mode enabled

---

## Core Concepts

### Virtual Windowing

Only renders visible items plus overscan buffer:

```
Physical List: [0, 1, 2, ..., 999]
Virtual Window: [47, 48, 49, 50, 51]  (visible items)
Overscan:       [44, 45, 46, ... 52, 53, 54]  (prerendered)
```

- **Window Size**: Configurable (default: 5 visible + 3 overscan per side)
- **Update Trigger**: When scroll position crosses threshold
- **Performance**: O(1) rendering regardless of list size

### Snap Physics

Magnetic attraction to center item:

```
┌─────────────────┐
│   Item N-1      │
├─────────────────┤  ← Snap Zone (configurable)
│ ► Item N ◄      │  ← Center (strongest pull)
├─────────────────┤
│   Item N+1      │
└─────────────────┘
```

- **Enter Threshold**: Distance to activate snapping (default: 0.8× item height)
- **Exit Threshold**: Distance to deactivate (default: 0.68× item height - hysteresis)
- **Pull Strength**: Configurable magnetic force (default: 1.4)
- **Velocity Scaling**: Reduces snap strength during fast scrolling

See [`config/physics.ts`](./packages/number-picker/src/config/physics.ts) for tunable constants.

### Gesture Coordination

Unified handling of pointer, wheel, and keyboard input:

```typescript
Input Sources → Gesture Handler → Physics Engine → Animation → DOM
```

- **Multi-touch Support**: Tracks multiple pointer IDs
- **Device Detection**: Auto-detects touchpad vs mouse wheel
- **Velocity Tracking**: Samples last 250ms of motion
- **Click vs Drag**: Distinguishes taps from swipes

---

## Component Hierarchy

### CollapsibleNumberPicker

```
CollapsibleNumberPicker
├── ThemedNumberInput (closed state)
│   └── Formatted display value
└── Picker Surface (open state)
    ├── PickerGroup
    │   └── PickerColumn (for each digit)
    │       ├── Virtual Window Manager
    │       ├── PickerItem × N (visible items)
    │       └── Highlight Overlay
    └── Feedback System
        ├── Haptics (Vibration API)
        └── Audio (Web Audio API)
```

### Hook Composition

#### CollapsibleNumberPicker Hooks

```
usePickerStateMachine (XState)
  ↓
usePickerCoordinator
  ├→ useGestureCoordination
  ├→ usePickerFeedback
  ├→ useFormattedValues
  ├→ useHighlightMetrics
  └→ useKeyboardControls
```

#### PickerColumn Hooks

```
usePickerPhysics
  ├→ useSnapPhysics
  ├→ useVirtualWindow
  └→ useSnappedIndexStore
```

---

## State Management

### XState State Machine

The picker lifecycle is modeled as a finite state machine:

```
┌─────────┐  POINTER_DOWN/WHEEL_START  ┌──────────────┐
│ closed  │ ────────────────────────→  │ interacting  │
└─────────┘                             └──────────────┘
     ↑                                         │
     │                                         │ POINTER_UP/WHEEL_IDLE
     │                                         ↓
     │                                  ┌──────────┐
     │                                  │ settling │
     │                                  └──────────┘
     │                                         │
     │                                         │ MOMENTUM_END
     │                                         ↓
     │    autoCloseDelay (4s)           ┌──────┐
     └──────────────────────────────────│ idle │
                                        └──────┘
```

**States:**
- `closed` - Picker is not visible
- `interacting` - User is actively dragging/scrolling
- `settling` - Momentum animation in progress
- `idle` - Waiting for auto-close timeout

**Events:**
- `POINTER_DOWN/UP` - Touch/mouse interactions
- `WHEEL_START/IDLE` - Scroll wheel events
- `MOMENTUM_END` - Physics animation completed
- `FORCE_CLOSE` - Programmatic close
- `EXTERNAL_CLOSE` - User clicked outside

**Context:**
```typescript
{
  activeInputs: Set<'pointer' | 'wheel'>  // Currently active inputs
  interactionCount: number                // Total gestures this session
  isSingleGesture: boolean               // Opened with one continuous gesture
  openedViaWheel: boolean                // Session started with wheel
  atBoundary: boolean                    // Last snap was at min/max
  config: { /* timing, callbacks */ }
}
```

### Timing Presets

Located in [`config/timing.ts`](./packages/number-picker/src/config/timing.ts):

- **QUICK**: 150ms settle, 800ms wheel idle, 3000ms close
- **DEFAULT**: 150ms settle, 800ms wheel idle, 4000ms close
- **RELAXED**: 300ms settle, 1200ms wheel idle, 6000ms close

---

## Physics & Gestures

### Velocity Tracking

```typescript
class VelocityTracker {
  samples: Array<{ y: number; timestamp: number }>

  addSample(y: number): void
  getVelocity(): number  // px/ms over last 250ms
  reset(): void
}
```

Samples are stored as `[y, timestamp]` pairs and velocity is calculated using linear regression over the last 250ms window.

### Momentum Projection

When released with velocity:

```typescript
const projection = projectReleaseTranslate({
  currentY,
  velocityY,
  itemHeight,
  lastIndex,
  minY,
  maxY,
  config: {
    friction: 0.002,      // Deceleration rate
    stopThreshold: 0.5,   // Minimum velocity to continue
    boundary: 0.4         // Damping at edges
  }
})
```

Algorithm:
1. Apply friction each frame: `v = v × (1 - friction)`
2. Project final position: `y_final = y + v / friction`
3. Clamp to boundaries with damping
4. Snap to nearest item

### Overscroll Damping

When dragging beyond min/max bounds:

```typescript
const distance = Math.abs(rawY - boundaryY)
const limitedDistance = Math.min(distance, MAX_OVERSCROLL_PIXELS)  // Cap at 80px
const damped = Math.pow(limitedDistance, OVERSCROLL_DAMPING_EXPONENT)  // 0.8 exponent
```

This creates a "rubber band" effect that provides resistance feedback.

---

## Rendering Strategy

### Virtual Window Implementation

```typescript
const useVirtualWindow = (
  centerY: number,        // Current scroll position
  itemHeight: number,     // Height of each item
  totalItems: number,     // Total items in list
  slotCount: number,      // Visible items (default: 5)
  overscan: number        // Extra items (default: 3)
) => {
  const centerIndex = Math.round(centerY / itemHeight)
  const halfSlots = Math.floor(slotCount / 2)
  const startIndex = centerIndex - halfSlots - overscan
  const endIndex = centerIndex + halfSlots + overscan

  return {
    startIndex: clamp(startIndex, 0, totalItems - 1),
    windowLength: endIndex - startIndex + 1,
    virtualOffsetY: startIndex * itemHeight
  }
}
```

### CSS Transform Strategy

Uses `transform: translateY()` for hardware-accelerated scrolling:

```tsx
<motion.div
  style={{
    transform: ySnap.use((y) => `translateY(${y}px)`)
  }}
>
  {visibleItems.map((item, i) => (
    <PickerItem
      key={item.value}
      style={{
        transform: `translateY(${(startIndex + i) * itemHeight}px)`
      }}
    />
  ))}
</motion.div>
```

### Framer Motion Integration

- **Motion Values**: `useMotionValue()` for 60fps updates without re-renders
- **Animations**: `animate()` for momentum and snapping
- **Spring Physics**: Configurable stiffness/damping for natural feel

---

## Event Flow

### Pointer Event Lifecycle

```
User touches screen
  ↓
handlePointerDown
  ├→ setPointerCapture(pointerId)
  ├→ capturedPointers.add(pointerId)
  ├→ velocityTracker.reset()
  ├→ emitter.dragStart('pointer')
  └→ stateMachine.send('POINTER_DOWN')
  ↓
handlePointerMove (during drag)
  ├→ velocityTracker.addSample(clientY)
  ├→ calculateDelta()
  ├→ snapPhysics.calculate()
  └→ yRaw.set(newY)
  ↓
handlePointerUp
  ├→ capturedPointers.delete(pointerId)
  ├→ releasePointerCapture(pointerId)
  ├→ velocity = velocityTracker.getVelocity()
  ├→ projectMomentum()
  ├→ animate() to final position
  ├→ emitter.dragEnd(velocity)
  └→ stateMachine.send('POINTER_UP')
```

### Wheel Event Handling

Auto-detects input device based on `event.deltaMode`:

```typescript
if (event.deltaMode === DOM_DELTA_MODE.PIXEL) {
  // Touchpad: Fine-grained, natural scrolling
  delta = -event.deltaY * 0.35
} else if (event.deltaMode === DOM_DELTA_MODE.LINE) {
  // Mouse wheel: Coarse, inverted scrolling
  delta = event.deltaY * itemHeight
}
```

**Delta Accumulation**: Sub-pixel deltas are accumulated to prevent lost precision:

```typescript
wheelRemainder += delta
const quantized = Math.round(wheelRemainder / itemHeight) * itemHeight
wheelRemainder -= quantized
```

---

## Debug System

Production-safe opt-in debugging system in [`utils/debug.ts`](./packages/number-picker/src/utils/debug.ts).

### Debug Namespaces

```typescript
window.__QNI_DEBUG__ = true           // CollapsibleNumberPicker
window.__QNI_SNAP_DEBUG__ = true      // Snap physics
window.__QNI_STATE_DEBUG__ = true     // State machine
window.__QNI_WHEEL_DEBUG__ = true     // Wheel picker
window.__QNI_ANIMATION_DEBUG__ = true // Animations
window.__QNI_PICKER_DEBUG__ = true    // Picker physics
```

Or enable all at once:
```typescript
enableAllDebugNamespaces()
```

### Usage in Code

```typescript
import { debugPickerLog } from '@tensil/kinetic-input/utils';

debugPickerLog('Pointer down', { pointerId, clientY })
// No-op in production, logs only if __QNI_PICKER_DEBUG__ = true in dev
```

**Production Safety:**
- All debug code is tree-shaken in production builds
- Zero runtime overhead when not enabled
- No console spam in development unless explicitly enabled

---

## Performance Considerations

### Optimization Strategies

1. **Virtual Rendering**
   - Only renders ~11 items regardless of list size
   - O(1) rendering complexity

2. **Memoization**
   - `useMemo()` for expensive calculations
   - `useCallback()` for event handlers
   - `React.memo()` for item components

3. **RAF Throttling**
   - Motion values update at 60fps
   - No re-renders during drag/scroll

4. **CSS Hardware Acceleration**
   - `transform: translateY()` instead of `top`
   - `will-change: transform` on active elements

5. **Event Delegation**
   - Single event listener per column
   - Pointer capture for reliable events

### Bundle Size

- **Core Library**: ~45KB minified + gzipped
- **XState**: ~15KB (peer dependency)
- **Framer Motion**: ~30KB (peer dependency)
- **Total**: ~90KB for full-featured picker

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android Chrome 90+
- **Pointer Events**: Required (all modern browsers)
- **CSS Grid**: Required (all modern browsers)

---

## File Structure Reference

```
packages/number-picker/src/
├── config/                    # Configuration & constants
│   ├── physics.ts            # Physics constants (snap, overscroll, gestures)
│   ├── timing.ts             # Timing presets (quick, default, relaxed)
│   └── ui.ts                 # UI constants (dimensions, colors)
│
├── picker/                    # Core wheel picker primitives
│   ├── PickerGroup.tsx       # Container for multiple columns
│   ├── PickerColumn.tsx      # Single scrollable column
│   ├── PickerItem.tsx        # Individual item renderer
│   ├── hooks/
│   │   ├── usePickerPhysics.ts      # Main physics & gesture handling
│   │   ├── useSnapPhysics.ts        # Magnetic snapping logic
│   │   └── useVirtualWindow.ts      # Virtual list bookkeeping
│   ├── gestures/
│   │   ├── eventEmitter.ts          # Gesture event system
│   │   ├── velocityTracker.ts       # Velocity calculation
│   │   └── pointerCapture.ts        # Multi-touch handling
│   └── utils/
│       ├── math.ts                  # Y ↔ index conversions
│       └── releaseMomentum.ts       # Momentum projection
│
├── quick/                     # CollapsibleNumberPicker component
│   ├── CollapsibleNumberPicker.tsx
│   ├── ThemedNumberInput.tsx         # Closed state input
│   ├── theme.ts                      # Color & typography tokens
│   ├── hooks/
│   │   ├── pickerStateMachine.machine.ts    # XState definition
│   │   ├── pickerStateMachine.actions.ts    # State actions
│   │   ├── pickerStateMachine.shared.ts     # Types & guards
│   │   ├── usePickerCoordinator.ts          # Gesture orchestration
│   │   ├── usePickerFeedback.ts             # Haptics & audio
│   │   └── [15+ other hooks]
│   └── feedback/
│       ├── haptics.ts                # Vibration API wrapper
│       └── audio.ts                  # Web Audio API wrapper
│
├── wheel/                     # StandaloneWheelPicker
│   └── StandaloneWheelPicker.tsx
│
├── utils/                     # Shared utilities
│   ├── debug.ts              # Production-safe debug system (497 lines)
│   └── pickerOptions.ts      # Decimal scaling utilities
│
└── styles/                    # Component CSS
    ├── picker-base.css
    ├── quick-number-input.css
    └── wheel-picker.css
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

---

## License

MIT © Tensil AI
