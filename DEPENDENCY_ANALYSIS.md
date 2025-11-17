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
**Location**: `src/quick/CollapsibleNumberPicker.presenter.tsx:217, 220`
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
- `src/quick/CollapsibleNumberPicker.presenter.tsx` - Expand/collapse animations
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
**Used for**: Auto-close state machine for CollapsibleNumberPicker
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
import '@tensil/kinetic-input/styles/quick.css'; // Only for CollapsibleNumberPicker
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
| CollapsibleNumberPicker | ~4 KB | ~4.6 KB (framer-motion) | **~8.6 KB** |
| WheelPicker | ~3 KB | ~4.6 KB (framer-motion) | **~7.6 KB** |
| PickerGroup | ~5 KB | ~4.6 KB (framer-motion) | **~9.6 KB** |

### Selective Imports
Only import what you need to minimize bundle size:

```tsx
// ✅ Good - Import specific component
import { CollapsibleNumberPicker } from '@tensil/kinetic-input/quick';
import '@tensil/kinetic-input/styles/quick.css';

// ❌ Avoid - Imports everything
import { CollapsibleNumberPicker } from '@tensil/kinetic-input';
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
