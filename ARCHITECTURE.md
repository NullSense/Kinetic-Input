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

1. **CollapsiblePicker** (`quick/`) - Full-featured collapsible input with touch/mouse/wheel support
2. **PickerColumn** (`picker/`) - Core wheel picker primitive
3. **Picker** (`wheel/`) - Standalone wheel component

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

See `packages/number-picker/src/config/physics.ts` for tunable constants.

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

### CollapsiblePicker

```
CollapsiblePicker
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

#### CollapsiblePicker Hooks

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
     │    idleTimeout (4s default)      ┌──────┐
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

Located in `packages/number-picker/src/config/timing.ts`:

- **instant**: 50ms settle, 300ms wheel idle, 1500ms close (power users)
- **fast**: 100ms settle, 500ms wheel idle, 2500ms close (desktop workflows)
- **balanced**: 150ms settle, 800ms wheel idle, 4000ms close (DEFAULT, general use)
- **patient**: 300ms settle, 1200ms wheel idle, 6000ms close (mobile/accessibility)

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

Production-safe opt-in debugging system in `packages/number-picker/src/utils/debug.ts`.

### Debug Namespaces

```typescript
window.__QNI_DEBUG__ = true           // CollapsiblePicker
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
├── quick/                     # CollapsiblePicker component
│   ├── CollapsiblePicker.tsx
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
├── wheel/                     # Picker
│   └── Picker.tsx
│
├── utils/                     # Shared utilities
│   ├── debug.ts              # Production-safe debug system
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
# Haptic Feedback Enhancement Analysis

## Request
Add stronger haptic feedback when picker settles after flicking (momentum scrolling) to indicate completion.

## Current Implementation

### Architecture
- **Haptic adapter**: `packages/number-picker/src/quick/feedback/haptics.ts`
- **Feedback hook**: `packages/number-picker/src/quick/hooks/usePickerFeedback.ts`
- **State machine**: `packages/number-picker/src/quick/hooks/pickerStateMachine.machine.ts`

### Current Behavior
- **Pattern**: `[3, 2, 1]` milliseconds (light tap, subtle)
- **Trigger**: Every value change during scrolling via `handleVisualValueChange`
- **No distinction**: Same haptic for active drag vs. final settle

### Code Flow
```
User flicks picker
  → Momentum scrolling starts
  → Value changes trigger haptics: [3, 2, 1]
  → Physics settles to final value
  → Same haptic: [3, 2, 1] ❌ No special "settle" feedback
```

---

## Proposed Implementation

### Goal
When picker settles after momentum scrolling, trigger **slightly stronger** haptic feedback (one step up) to indicate completion.

### Approach Options

#### **Option 1: Add Settle Flag to Haptic Trigger** (Recommended)
**Difficulty**: ⭐⭐ Easy (1-2 hours)
**Risk**: Low

**Changes needed**:
1. Update `createHapticAdapter` to accept settle pattern:
```typescript
// haptics.ts
const DEFAULT_PATTERN: VibratePattern = [3, 2, 1];
const SETTLE_PATTERN: VibratePattern = [8, 3, 5]; // Stronger settle feedback

export interface HapticAdapterOptions {
  pattern?: VibratePattern;
  settlePattern?: VibratePattern; // New
}

export function createHapticAdapter(options: HapticAdapterOptions = {}): HapticAdapter | null {
  return {
    trigger: (isSettle?: boolean) => { // New parameter
      const pattern = isSettle
        ? (options.settlePattern ?? SETTLE_PATTERN)
        : (options.pattern ?? DEFAULT_PATTERN);
      navigator.vibrate(pattern);
    },
    cleanup: () => {},
  };
}
```

2. Detect settle in physics layer:
```typescript
// usePickerPhysics.ts (or similar)
// When velocity reaches zero after momentum:
if (wasMomentumScrolling && velocityIsZero) {
  onValueChangeCallback(newValue, { isSettle: true });
}
```

3. Pass settle flag through feedback hook:
```typescript
// usePickerFeedback.ts
const handleVisualValueChange = useCallback(
  (value: string | number, meta?: { isSettle?: boolean }) => {
    const next = String(value);
    if (next !== lastHapticValueRef.current) {
      lastHapticValueRef.current = next;
      adapters.haptics?.trigger(meta?.isSettle); // Pass flag
    }
  },
  [adapters.haptics]
);
```

**Testing Requirements**:
- Physical device testing (haptics don't work in simulator)
- Test both active dragging (light feedback) and flick-settle (stronger feedback)
- Verify pattern feels appropriate on different devices

---

#### **Option 2: Separate Settle Callback**
**Difficulty**: ⭐⭐⭐ Medium (2-3 hours)
**Risk**: Medium (more intrusive)

Add separate `onSettle` callback to physics system:
- More separation of concerns
- Cleaner API
- Requires more changes across multiple files

---

#### **Option 3: State Machine-Based Detection**
**Difficulty**: ⭐⭐⭐⭐ Hard (4-6 hours)
**Risk**: High (complex state tracking)

Use XState transitions to detect flicking → idle:
- Most architecturally pure
- Requires deep state machine changes
- Overkill for this feature

---

## Recommendation: Option 1

### Estimated Effort: **1-2 hours**

### Why This Approach?
1. ✅ **Minimal changes**: Only 3 files need updates
2. ✅ **Low risk**: Doesn't affect state machine or physics calculations
3. ✅ **Backward compatible**: Optional parameter, defaults to current behavior
4. ✅ **Testable**: Easy to verify on device
5. ✅ **Configurable**: Users can customize both patterns via `feedbackOverrides`

### Implementation Checklist
- [ ] Update `HapticAdapter` interface to accept `isSettle?: boolean`
- [ ] Add `SETTLE_PATTERN` constant (e.g., `[8, 3, 5]`)
- [ ] Detect momentum completion in physics layer
- [ ] Pass `isSettle: true` flag through callback chain
- [ ] Test on physical iOS and Android devices
- [ ] Document new `settlePattern` option in types
- [ ] Add JSDoc examples showing customization

### Pattern Recommendations
| Feedback Type | Pattern | Description |
|---------------|---------|-------------|
| **Scroll** (current) | `[3, 2, 1]` | Subtle tap per value |
| **Settle** (new) | `[8, 3, 5]` | Slightly stronger double-tap |
| **Alternative** | `[10]` | Single medium pulse |
| **Alternative** | `[15, 5, 10]` | Stronger cascade |

**User Testing**: Start with `[8, 3, 5]` and gather feedback. Some users might prefer a simple `[10]` pulse.

---

## API Design

### User Configuration
```typescript
<CollapsiblePicker
  enableHaptics={true}
  feedbackOverrides={{
    haptics: {
      pattern: [3, 2, 1],        // Regular scroll haptic
      settlePattern: [8, 3, 5],  // Settle haptic (NEW)
    }
  }}
/>
```

### Default Behavior
- No breaking changes
- Existing users get enhanced feedback automatically
- Patterns are tuned based on user testing

---

## Next Steps

1. **Prototype**: Implement Option 1 in feature branch
2. **Test**: Physical device testing on iOS + Android
3. **Iterate**: Adjust patterns based on feel
4. **Document**: Add to README and API docs
5. **Release**: Minor version bump (backward compatible enhancement)

---

## Notes
- Haptics require physical device testing (simulators don't vibrate)
- Browser Vibration API support: [Can I Use](https://caniuse.com/vibration)
- Consider adding A/B testing for pattern preferences
- Some devices/browsers may have haptic intensity limits
# Dependency Reduction Analysis

## Current State

### Main Package Dependencies (peerDependencies)
```json
{
  "@xstate/react": "^6.0.0",      // ~3 KB
  "framer-motion": "^11.0.0",     // ~34 KB (when using `motion` component)
  "lucide-react": "^0.546.0",     // ~1 KB (tree-shaken for 2 icons)
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "xstate": "^5.0.0"              // ~16.7 KB (min+gzip)
}
```

**Total Additional Dependencies**: ~54.7 KB (minified + gzipped)
**Source**: Bundlephobia + Web Research (2025)

---

## Dependency Usage Breakdown

### 1. **lucide-react** ❌ EASILY REMOVABLE
**Used for**: 2 chevron icons (ChevronDown, ChevronUp)
**Location**: `src/quick/CollapsiblePicker.presenter.tsx:217, 220`
**Bundle Impact**: ~1-2 KB when tree-shaken, but forces users to install 600 KB package

#### Recommendation: **REMOVE**
Replace with inline SVG components:

```tsx
// Simple inline components - no dependencies needed
const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
```

**Benefit**:
- Removes entire `lucide-react` dependency
- Saves ~1 KB in final bundle
- One less package users need to install
- No breaking changes (props are compatible)

---

### 2. **framer-motion** ⚠️ OPTIMIZE (Keep but optimize)
**Used for**:
- `motion` components: Declarative animations (34 KB)
- `animate()`: Physics-based momentum scrolling
- `useMotionTemplate()`: Dynamic CSS value interpolation
- `MotionValue`: Reactive animation state
- `AnimationPlaybackControls`: Animation control interface

**Locations**:
- `src/picker/utils/frictionMomentum.ts` - Core physics engine
- `src/picker/PickerColumn.tsx` - Scroll animations
- `src/quick/CollapsiblePicker.presenter.tsx` - Expand/collapse animations
- `src/quick/hooks/useValueDisplay.tsx` - Value transitions

**Current Size**: ~34 KB (using `motion` component)

#### Recommendation: **OPTIMIZE with `m` + LazyMotion**

Framer Motion provides multiple component options:
- **`motion`** component: 34 KB (full features)
- **`m`** component: 13.7 KB / 5.5 KB gzipped (lightweight)
- **`m` + LazyMotion**: 4.6 KB (ultra-optimized)

**Optimization Strategy**:
```tsx
// Instead of:
import { motion } from 'framer-motion';

// Use:
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Wrap app/component:
<LazyMotion features={domAnimation}>
  <m.div>...</m.div>
</LazyMotion>
```

**Potential Savings**: ~29 KB (from 34 KB → 4.6 KB)

**Why Keep It**:
- **Spring physics engine** - Recreating this is ~5-10 KB of complex code
- **Gesture handling** - Touch/drag interactions built-in
- **MotionValue reactivity** - Complex state management
- **Animation controls** - Playback manipulation
- **Industry standard** - Well-tested and maintained
- **Superior UX** - Physics-based animations feel natural

**Final Decision**: **KEEP** but optimize with `m` + LazyMotion

---

### 3. **xstate + @xstate/react** ⚠️ POTENTIALLY REMOVABLE
**Used for**: Auto-close state machine for CollapsiblePicker
**Locations**:
- `src/quick/hooks/pickerStateMachine.machine.ts` - State machine definition
- `src/quick/hooks/pickerStateMachine.actions.ts` - State actions
- `src/quick/hooks/usePickerStateMachine.xstate.ts` - React integration

**Functionality**:
```typescript
// Manages auto-close logic with ~60 lines of state machine code
States: { closed, open, pendingClose }
Events: { OPEN, CLOSE, INTERACT, SETTLE }
Guards: { shouldAutoClose, isUserInteraction }
```

#### Recommendation: **CONSIDER REMOVING**
**Replace with**: Simple React state + useEffect

```tsx
// Equivalent functionality without XState (~30 lines)
function usePickerAutoClose(config) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastInteractionSource, setLastInteractionSource] = useState(null);
  const interactionTimeoutRef = useRef(null);

  const open = (source) => {
    setIsOpen(true);
    setLastInteractionSource(source);
  };

  const close = () => {
    setIsOpen(false);
    clearTimeout(interactionTimeoutRef.current);
  };

  const interact = (source) => {
    setLastInteractionSource(source);
    clearTimeout(interactionTimeoutRef.current);
  };

  const settle = () => {
    if (config.autoClose && lastInteractionSource !== 'user') {
      interactionTimeoutRef.current = setTimeout(close, config.autoCloseDelay);
    }
  };

  useEffect(() => () => clearTimeout(interactionTimeoutRef.current), []);

  return { isOpen, open, close, interact, settle };
}
```

**Benefits**:
- Removes **~40 KB** (xstate + @xstate/react)
- Simpler mental model for contributors
- Fewer dependencies for users

**Drawbacks**:
- Lose formal state machine guarantees
- Less explicit state transitions
- Harder to visualize state flow

**Decision**: **REMOVE** - The auto-close logic is simple enough that XState is overkill

---

## Summary of Recommendations

### ✅ REMOVE (High Priority)
1. **lucide-react** → Inline SVG (2 components, ~40 lines)
   - **Saves**: 1 dependency, ~1-2 KB bundle
   - **Effort**: 15 minutes
   - **Risk**: None (drop-in replacement)

### ✅ REMOVE (Medium Priority)
2. **xstate + @xstate/react** → Simple React state
   - **Saves**: 2 dependencies, ~40 KB bundle
   - **Effort**: 2-3 hours
   - **Risk**: Low (logic is straightforward)

### ❌ KEEP
3. **framer-motion** - Critical for UX quality
   - Complex physics engine
   - Worth the ~30 KB cost
   - Industry standard

---

## Impact Summary

### Before
```
Dependencies: 5 (lucide-react, xstate, @xstate/react, framer-motion, react)
Bundle Size: ~54.7 KB additional (min+gzip)
```

### After (Recommended Changes)
```
Dependencies: 2 (framer-motion optimized, react)
Bundle Size: ~4.6 KB additional (min+gzip with LazyMotion)
```

**Total Reduction**:
- **3 fewer dependencies** (-60%)
- **~50 KB smaller** (-91%!)
- **Simpler codebase** (less abstraction)
- **Easier onboarding** (fewer concepts)
- **Better DX** (fewer peer dependency warnings)

---

## Implementation Priority

1. ✅ **Phase 1**: Remove lucide-react (15 min)
   - **Effort**: 15 minutes
   - **Savings**: 1 dependency, ~1 KB
   - **Risk**: None (drop-in replacement)
   - **Breaking**: No

2. ✅ **Phase 2**: Optimize Framer Motion (1-2 hours)
   - **Effort**: 1-2 hours
   - **Savings**: ~29 KB (from 34 KB → 4.6 KB)
   - **Risk**: Low (same API, just lazy-loaded)
   - **Breaking**: No (transparent to users)
   - **Action**: Replace `motion` with `m` + `LazyMotion`

3. ✅ **Phase 3**: Remove xstate (2-3 hours)
   - **Effort**: 2-3 hours
   - **Savings**: 2 dependencies, ~19.7 KB
   - **Risk**: Moderate (logic changes)
   - **Breaking**: No (internal implementation)
   - **Action**: Replace with React state + useEffect

4. ❌ **Phase 4**: Remove Framer Motion entirely (NOT RECOMMENDED)
   - Would require weeks of work
   - Quality degradation
   - Not worth the effort

---

## Additional Optimization Opportunities

### CSS Bundle Optimization
Currently shipping 3 CSS files:
- `picker-base.css` - 1.2 KB
- `quick-number-input.css` - 4.5 KB
- `wheel-picker.css` - 1.8 KB
- `all.css` - Imports all above

**Opportunity**: Users import `all.css` even if only using one component

**Solution**: Document selective imports:
```tsx
// Instead of
import '@tensil/kinetic-input/styles/all.css';

// Use
import '@tensil/kinetic-input/styles/quick.css'; // Only for CollapsiblePicker
```

**Savings**: ~3-5 KB for users who only need one component type

---

## Long-term Considerations

### If Package Grows Large
Consider splitting into separate packages:
```
@tensil/kinetic-input          (Core utilities, no dependencies)
@tensil/quick-number-picker    (Only framer-motion)
@tensil/wheel-picker           (Only framer-motion)
@tensil/picker-primitives      (Only framer-motion)
```

This allows users to install only what they need, but adds maintenance overhead.

**Current Recommendation**: Not needed yet. Current bundle size is acceptable.

---

## Developer Experience Considerations

### Documentation Improvements
- Add bundle size badges to README
- Show tree-shaking effectiveness
- Provide bundle analysis guide
- List peer dependencies clearly with explanations

### Example README Addition
```markdown
## Bundle Size

| Component | Core | Peer Deps | Total (min+gzip) |
|-----------|------|-----------|------------------|
| CollapsiblePicker | ~4 KB | ~4.6 KB (framer-motion) | **~8.6 KB** |
| WheelPicker | ~3 KB | ~4.6 KB (framer-motion) | **~7.6 KB** |
| PickerGroup | ~5 KB | ~4.6 KB (framer-motion) | **~9.6 KB** |

### Selective Imports
Only import what you need to minimize bundle size:

```tsx
// ✅ Good - Import specific component
import { CollapsiblePicker } from '@tensil/kinetic-input/quick';
import '@tensil/kinetic-input/styles/quick.css';

// ❌ Avoid - Imports everything
import { CollapsiblePicker } from '@tensil/kinetic-input';
import '@tensil/kinetic-input/styles/all.css';
```

### Peer Dependencies
```json
{
  "framer-motion": "^11.0.0"  // Only required dependency (~4.6 KB optimized)
}
```

**Why Framer Motion?** We use it for physics-based animations that make the picker feel natural. It's heavily optimized with tree-shaking and lazy-loading.
```

### Version Range Strategy
Following 2025 best practices, use flexible version ranges:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",        // Support both major versions
    "react-dom": "^18.0.0 || ^19.0.0",
    "framer-motion": "^11.0.0 || ^12.0.0" // Future-proof
  }
}
```

This prevents dependency conflicts and gives users flexibility.

---

## Conclusion

**Recommended Actions** (in priority order):
1. ✅ **Remove `lucide-react`** → Inline SVG components (15 min, ~1 KB saved)
2. ✅ **Optimize `framer-motion`** → Use `m` + LazyMotion (1-2 hrs, ~29 KB saved)
3. ✅ **Remove `xstate` ecosystem** → Simple React state (2-3 hrs, ~19.7 KB saved)

**Expected Results**:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Peer Dependencies | 5 | 2 | **-60%** |
| Bundle Size (min+gzip) | ~54.7 KB | ~4.6 KB | **-91%** |
| Time to implement | - | ~4 hours | Worth it! |

**Benefits**:
- ✅ **91% smaller bundle** - Faster load times for end users
- ✅ **60% fewer dependencies** - Simpler install process
- ✅ **Cleaner codebase** - Less abstraction, easier to understand
- ✅ **Better DX** - Fewer peer dependency warnings
- ✅ **No quality loss** - Same UX, same features
- ✅ **Future-proof** - Only depends on industry-standard Framer Motion

**Industry Alignment**:
This aligns with 2025 React component library best practices:
- Minimal dependencies
- Aggressive bundle optimization
- Tree-shaking friendly
- Flexible version ranges
- Modern tooling (Rollup for bundling)
