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
