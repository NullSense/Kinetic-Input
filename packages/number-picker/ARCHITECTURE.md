# Number-Picker Package Architecture

Unified configuration, DRY principles, and ergonomic APIs.

---

## Directory Structure

```
src/
├── config/              # Centralized configuration
│   ├── index.ts        # Barrel export
│   ├── timing.ts       # Timing presets + builder
│   ├── ui.ts           # UI constants
│   └── physics.ts      # Snap physics presets
├── utils/              # Shared utilities
│   ├── debug.ts        # Unified debug system
│   └── pickerOptions.ts # Option normalization
├── types/              # Type definitions barrel
│   └── index.ts        # All package types
├── quick/              # CollapsibleNumberPicker component
│   ├── CollapsibleNumberPicker.tsx
│   ├── ThemedNumberInput.tsx  # Themed wrapper (recommended)
│   ├── hooks/          # Orchestration hooks
│   │   ├── usePickerCoordinator.ts        # Main coordinator
│   │   ├── useGestureCoordination.ts      # Gesture handling
│   │   └── usePickerStateMachine.xstate.ts
│   └── feedback/       # Haptic/audio adapters
├── picker/             # PickerGroup primitive (low-level)
│   ├── PickerGroup.tsx # Multi-column container
│   ├── PickerColumn.tsx # Single scrollable column
│   ├── PickerItem.tsx  # Individual option
│   ├── hooks/
│   │   └── usePickerPhysics.ts # Physics engine
│   └── gestures/       # Event-driven gesture system
│       ├── types.ts
│       ├── pointerCapture.ts
│       ├── velocityTracker.ts
│       └── eventEmitter.ts
└── wheel/              # StandaloneWheelPicker
    └── StandaloneWheelPicker.tsx
```

---

## Component Hierarchy

```
CollapsibleNumberPicker (orchestrator)
  ↓ uses
PickerGroup (container)
  ↓ contains
PickerGroup.Column (physics + virtualization)
  ↓ contains
PickerGroup.Item (render prop)

StandaloneWheelPicker (simplified wrapper)
  ↓ uses
PickerGroup (same primitive)
```

---

## Configuration System

### Centralized Imports

```typescript
// Single import for all config
import { TIMING, UI, SNAP_PHYSICS } from '@tensil/number-picker/config';

// All types from one place
import type { TimingConfig, PickerProps } from '@tensil/number-picker/types';

// Unified debug
import { debugLog, debugSnapLog } from '@tensil/number-picker/utils';
```

### Timing Configuration

**Simple (presets):**
```typescript
<CollapsibleNumberPicker timingPreset="fast" />
```

**Auto-detect (accessibility):**
```typescript
import { getRecommendedTiming } from '@tensil/number-picker/config';

<CollapsibleNumberPicker timingPreset={getRecommendedTiming()} />
// Auto-detects: mobile, reduced-motion preference
```

**Advanced (builder pattern):**
```typescript
import { TimingBuilder } from '@tensil/number-picker/config';

const timing = new TimingBuilder('balanced')
  .scale(1.5)              // 50% slower
  .setGracePeriod(200)     // Custom
  .build();                // Immutable

<CollapsibleNumberPicker timingConfig={timing} />
```

**Available presets:**
- `instant` - 50ms grace
- `fast` - 100ms grace
- `balanced` - 150ms grace
- `patient` - 300ms grace

---

## Themed Wrapper (Recommended)

For consistent styling across multiple pickers:

```typescript
import { ThemedNumberInput } from '@tensil/number-picker';

// All use same theme + auto-detected timing
<ThemedNumberInput label="Weight" value={weight} onChange={setWeight} />
<ThemedNumberInput label="Reps" value={reps} onChange={setReps} />
```

**What it does:**
- Applies `DEFAULT_THEME` automatically
- Uses `getRecommendedTiming()` for accessibility
- Still allows per-component overrides

**Alternative (custom theme):**
```typescript
// Create your own wrapper
export function AppNumberPicker(props: CollapsibleNumberPickerProps) {
  return (
    <CollapsibleNumberPicker
      theme={YOUR_APP_THEME}
      timingPreset="balanced"
      {...props}
    />
  );
}
```

---

## Debug System

**IMPORTANT: Debugging is OPT-IN only to prevent console spam and performance issues.**

### How to Enable (Development/Staging Only)

#### **Method 1: Browser console**
```javascript
// Enable specific namespaces
window.__QNI_DEBUG__ = true;          // CollapsibleNumberPicker
window.__QNI_SNAP_DEBUG__ = true;     // Snap physics
window.__QNI_STATE_DEBUG__ = true;    // State machine
window.__QNI_WHEEL_DEBUG__ = true;    // StandaloneWheelPicker
```

#### **Method 2: Helper function**

```javascript
import { enableAllDebugNamespaces } from '@tensil/number-picker/utils';

enableAllDebugNamespaces();  // Enable all namespaces
```

#### **Method 3: Set before app loads**

```typescript
// In your main.tsx or App.tsx (before component renders)
if (import.meta.env.DEV) {
  window.__QNI_DEBUG__ = true;
}
```

### Usage in Code

```typescript
import { debugLog, debugSnapLog, debugStateLog } from '@tensil/number-picker/utils';

// These are no-ops unless flags are set
debugLog('Picker opened', { value: 42 });
debugSnapLog('Snap calculated', { offset: 10 });
debugStateLog('State transition', { from: 'idle', to: 'interacting' });
```

### Production Safety

1. **Bundlers strip debug code** - Rollup/Webpack/Vite remove dead code when `NODE_ENV=production`
2. **No flags in production** - Even if flags are set, `isProduction()` check prevents logging
3. **Zero runtime overhead** - Function calls are optimized away by minifiers

### Why OPT-IN?

**Before (auto-enable in dev):**
```
[CollapsibleNumberPicker] Picker opened { value: 42 }
[SnapPhysics] Snap calculated { offset: 10 }
[StateMachine] State transition { from: 'idle', to: 'interacting' }
... 1000s of logs spamming console
```

**After (opt-in only):**
```
(clean console - only your app's logs)
```

**Enable when you need it**, disable when you don't.

---

## Event-Driven Gesture System

### Architecture

All gesture handling uses a **unified event system** instead of multiple callback props:

```typescript
// ✅ NEW: Single event handler
<PickerGroup.Column
  name="value"
  onGesture={(event) => {
    switch (event.type) {
      case 'drag:start':
        handleDragStart(event.source);
        break;
      case 'drag:end':
        handleDragEnd(event.hasMoved, event.velocity);
        break;
      case 'boundary:hit':
        handleBoundaryHit(event.boundary, event.value);
        break;
      case 'value:visual':
        handleVisualChange(event.value);
        break;
    }
  }}
/>

// ❌ OLD: Multiple callbacks (removed in v1.0)
<PickerGroup.Column
  onDragStart={...}
  onDragEnd={...}
  onBoundaryHit={...}
  onVisualValueChange={...}
/>
```

### Event Types

```typescript
type PickerGestureEvent =
  | { type: 'drag:start'; source: 'pointer' | 'wheel' | 'keyboard'; timestamp: number }
  | { type: 'drag:end'; hasMoved: boolean; velocity: number; timestamp: number }
  | { type: 'boundary:hit'; boundary: 'min' | 'max'; value: any; timestamp: number }
  | { type: 'value:visual'; value: any; index: number; timestamp: number }
  | { type: 'value:commit'; value: any; index: number; timestamp: number };
```

### Primitives

Low-level gesture primitives are available in `src/picker/gestures/`:

- **pointerCapture** - Pointer event handling with capture
- **velocityTracker** - Sample-based velocity calculation
- **eventEmitter** - Type-safe event creation

All primitives are fully tested (53 test cases) and reusable outside the picker.

---

## State Machine Complexity

The picker state machine handles real UX edge cases:

- **Interaction counting** - Smart timing (150ms vs 4s)
- **Input ref counting** - macOS trackpad multi-touch
- **Wheel timeout** - Prevents premature close during momentum
- **Boundary detection** - Enables haptic feedback
- **Watchdog timer** - Protects against vendor callback bugs
- **Controlled mode** - Standard React pattern

**Total complexity:** ~66 lines
**Performance cost:** ~0.01ms per gesture
**Justification:** Every feature solves a real UX problem

---

## Testing

**Run tests:**

```bash
npm test -- packages/number-picker
```

**Build:**

```bash
npm run build
# Outputs: dist/index.js, dist/index.d.ts
```

---

## Key Design Principles

1. **Semantic over raw values** - `timingPreset="fast"` not milliseconds
2. **Safe by default** - Builder validates invalid ratios
3. **Accessible automatically** - `getRecommendedTiming()` respects user preferences
4. **Event-driven** - Single `onGesture` handler replaces multiple callbacks
5. **DRY without over-engineering** - Shared code where it makes sense
6. **Testable primitives** - Gesture system built from composable, tested units
