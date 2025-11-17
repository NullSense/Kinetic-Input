# QuickNumberInput Snap Roadmap

This doc tracks the iOS-style magnetic snap effort ("Path B"). It replaces the older `engineering-specification-final.md`, `path-b-implementation-final.md`, and `path-b-quick-ref.md` files.

## Goals

- Make the center row feel "magnetic" for slow drags while keeping fast flicks free.
- Avoid dead zones—every value must remain selectable.
- Ship behind a feature flag so we can tune parameters on real usage data.

## Architecture Snapshot

```
User drag → PickerColumn pointer handlers
  ├─ usePointerVelocity (NEW) tracks delta & velocity per frame
  ├─ updateScrollerWhileMoving computes raw translate
  └─ useSnapPhysics (NEW) adjusts translate before setState
        • snapRange / thresholds create resistance band
        • velocity scaling weakens snap for quick swipes
        • hysteresis prevents jitter when leaving the band
setScrollerTranslate(snappedTranslate)
handlePointerUp → pickerActions.change → onChange
```

- **Integration point:** `packages/number-picker/src/reactMobilePicker/PickerColumn.tsx` inside `updateScrollerWhileMoving`. This is where we intercept motion *before* visual state updates.
- **No QuickNumberInput changes** are needed beyond optional props to toggle/override snap config.

## Implementation Plan & Status

| Task | Status |
| --- | --- |
| Introduce `SnapPhysicsConfig`, `SnapPhysicsState`, `DragContextFrame` types (`src/reactMobilePicker/types/snapPhysics.ts`) | ☐ |
| Build `usePointerVelocity` hook (tracks delta, velocity, distance) | ☐ |
| Build `useSnapPhysics` hook (non-linear mapping + hysteresis) | ☐ |
| Thread hooks into `PickerColumn` (feature flag, debug logging) | ☐ |
| Expose `enableSnap` & `snapConfig` props from `QuickNumberInput` / `WheelPicker` | ☐ |
| Unit tests for hooks (enter/exit thresholds, velocity scaling) | ☐ |
| Manual QA checklist (slow drag, fast flick, overscroll bounds) | ☐ |
| Snap tester modal wired to Sidebar for manual experimentation | ✅ |

> Toggle flag suggestion: `enableSnapPhysics?: boolean` on `QuickNumberInputProps`, default `false`.

## Default Parameters (based on research)

| Setting | Value | Notes |
| --- | --- | --- |
| `snapRange` | `0.22` | 22% of row height feels magnetic without trapping |
| `enterThreshold` | `0.12` | Easy to enter snap band |
| `exitThreshold` | `0.28` | Requires extra drag to break free → prevents jitter |
| `pullStrength` | `0.6` | 60% of distance pulled per frame inside zone |
| `velocityThreshold` | `250 px/s` | Above this, dampen snap |
| `velocityReducer` | `0.7` | Reduces pull to ~30% at threshold speed |
| `velocityScaling` | `true` | Keeps fast scans smooth |

These live in `packages/number-picker/src/constants.ts` so apps can override them centrally.

## Testing Checklist

- [ ] Slow drag to target → row snaps smoothly, outer rows dim
- [ ] Fast flick → snap mostly disabled, pointer can browse quickly
- [ ] Overscroll top/bottom → existing MAX_OVERSCROLL behavior unchanged
- [ ] Boundary hit callbacks still fire once per edge
- [ ] Feature flag OFF → picker behaves exactly as today

## Rollout Strategy

1. **Phase 0** – Land hooks + feature flag (disabled).
2. **Phase 1** – Internal QA with snap enabled.
3. **Phase 2** – Dogfood: enable for <10% of traffic, log drag velocity + snap adoption.
4. **Phase 3** – Tune parameters from telemetry.
5. **Phase 4** – Enable by default; keep flag for emergency rollback.

## Open Questions

- Do we need per-device tuning (desktop wheel vs. touch)?
- Should `WheelPicker` expose snap config separately from `QuickNumberInput`?
- Would a lighter "preview snap" mode (visual only) suffice for some contexts?

Keep this doc up to date as you tackle each step. If we add scope (e.g., haptics), start a new section rather than another standalone markdown file.

## Current Physics Gaps (ordered)

1. **Flick momentum never applied (✅ now projected).** Release velocity is now mapped through `rangeScaleIntensity` so a fast flick coasts for `projectionSeconds` before snapping, rather than stopping immediately on pointer up.
2. **Velocity recorded but never used (✅ now wired).** Pointer and wheel flows now pipe `velocityTracker.getVelocity()` into every snap frame and the settle logic, enabling the `velocityScaling` knobs we already shipped.
3. **Scroll deltas quantized to full rows (✅ removed).** Wheel events now honor sub-row deltas so high-resolution trackpads feel smooth instead of jumping a full row at a time.
4. **Wheel gestures consumed snapped values (✅ raw translate now).** Wheel math now uses the raw MotionValue rather than `ySnap`, preventing rounding from corrupting sampled deltas.
5. **Wheel velocity sampled in mixed coordinate spaces (✅ unified).** We track the actual translate fed to the column before snapping so flick physics see the same units pointer drags use.
6. **Wheel deltas were scaled down and re-snapped every frame (✅ normalized).** The hard-coded `0.1` multiplier and per-frame snap pass have been replaced by a configurable `wheelSensitivity` multiplier plus raw motion updates so slow scroll wheels and touchpads move without needing frantic gestures.

### Release velocity scaling

- **✅ Dynamic projection window.** `rangeScaleIntensity` now defines the base 120 ms of coast, and `rangeScaleVelocityBoost` extends that window up to `(1 + boost)` once release speed crosses `velocityThreshold`. Fast scrubs therefore advance multiple rows before the snap spring pulls them back, matching user expectations for “scroll faster → skip more”.
