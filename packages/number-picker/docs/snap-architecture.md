# Snap Architecture & Specification

This document describes the Path B "magnetic snap" addition for `@tensil/number-picker`. It captures the engineering spec (types, hooks, integration points) so the roadmap (`snap-roadmap.md`) can focus on status tracking.

## Goals

- Add iOS-style stickiness around the center row so slow drags settle on discrete values.
- Preserve fast-scroll behavior: high-velocity gestures should glide past snaps.
- Avoid dead zones: every value must remain selectable.
- Ship behind a feature flag with tunable params.

## High-Level Flow

```
User drag → PickerColumn pointer handlers
  ├─ usePointerVelocity (NEW) tracks per-frame delta/velocity
  ├─ updateScrollerWhileMoving computes raw translate
  └─ useSnapPhysics (NEW) adjusts translate before setState
        • snapRange + thresholds define attraction band
        • velocity scaling weakens snap when swiping fast
        • hysteresis prevents jitter exiting the band
setScrollerTranslate(snappedTranslate)
handlePointerUp → pickerActions.change() → onChange
```

### Integration Point

`packages/number-picker/src/reactMobilePicker/PickerColumn.tsx` `updateScrollerWhileMoving()` is where raw pointer delta becomes `setScrollerTranslate`. Snap physics plugs in here before the state update so visuals and committed value stay in sync.

## Types

Location: `packages/number-picker/src/reactMobilePicker/types/snapPhysics.ts`

```ts
export interface SnapPhysicsConfig {
  enabled: boolean;
  snapRange: number;        // % of itemHeight (default 0.22)
  enterThreshold: number;   // % of itemHeight (default 0.12)
  exitThreshold: number;    // % of itemHeight (default 0.28)
  velocityThreshold: number;// px/sec (default 250)
  velocityScaling: boolean;
  pullStrength: number;     // 0-1 (default 0.6)
  velocityReducer: number;  // 0-1 (default 0.7)
}

export interface DragContextFrame {
  deltaY: number;
  velocityY: number;
  totalPixelsMoved: number;
}

export interface SnapPhysicsResult {
  mappedTranslate: number;
  inSnapZone: boolean;
  debug?: {
    distanceToSnap: number;
    proportionInZone: number;
    appliedPullStrength: number;
  };
}

export interface SnapPhysicsState {
  wasInSnapZone: boolean;
}
```

## Hooks

### `usePointerVelocity`
Tracks drag deltas and computes velocity per frame so we can damp snap at high speed.

Responsibilities:
- `handleDragStart(pointerY)` – reset refs
- `updateDragFrame(currentPointerY)` – update `deltaY`, `velocityY`, `totalPixelsMoved`
- `getCurrentFrame()` – expose latest numbers to the snap hook
- `reset()` – clear on pointer up/cancel

### `useSnapPhysics`
Applies partial nonlinear mapping with hysteresis.

Inputs:
- `frame`: current drag state from `usePointerVelocity`
- `maxTranslate`: center-row translate (snap target)
- `itemHeight`: row height
- `config`: `SnapPhysicsConfig`

Logic:
1. Compute distance to center row.
2. Determine whether we’re in the snap band using hysteresis (enter vs. exit thresholds).
3. If outside band, return original delta.
4. If inside band, compute attraction toward center: `attraction = (target - delta) * proportionInZone * pullStrength`.
5. Scale `pullStrength` using velocity (fast drags weaken snap).
6. Return adjusted translate + diagnostic data.

State: remembers whether we were previously in the snap zone so exit threshold can be wider than entry.

## PickerColumn Changes

1. Import both hooks and default config.
2. Create the hooks inside the component:
   ```ts
   const dragContext = usePointerVelocity();
   const snapPhysics = useSnapPhysics(mergedConfig);
   ```
3. In `handlePointerDown`, call `dragContext.handleDragStart(event.clientY)`.
4. In `handlePointerMove`, update the drag frame and hand the frame to snap physics:
   ```ts
   const rawTranslate = startTranslateRef.current + deltaY;
   const frame = dragContext.updateDragFrame(event.clientY);
   const snapped = snapPhysics.calculate(frame, maxTranslate, itemHeight);
   updateScrollerWhileMoving(snapped.mappedTranslate);
   ```
5. On pointer up/cancel, call `dragContext.reset()`.
6. Guard everything behind `snapConfig.enabled` so we can toggle at runtime.

No changes are required in `QuickNumberInput` beyond optionally exposing `enableSnapPhysics`/`snapConfig` props that pass down via context.

`QuickNumberInput` and `WheelPicker` both surface two new props:

- `enableSnapPhysics` toggles the feature flag.
- `snapPhysicsConfig` lets consumers override the defaults (e.g., different snap ranges per use case).

Internally those props simply merge with `DEFAULT_SNAP_PHYSICS` and pass the result to `Picker.Column`.

## Default Parameters

| Setting | Value | Notes |
| --- | --- | --- |
| `snapRange` | `0.22` | 22% of row height creates a noticeable magnetic band |
| `enterThreshold` | `0.12` | Easy to slip into the band |
| `exitThreshold` | `0.28` | Harder to leave (hysteresis) |
| `pullStrength` | `0.6` | Pulls 60% toward center per frame |
| `velocityThreshold` | `250` px/sec | Above this we reduce pull |
| `velocityReducer` | `0.7` | At threshold speed, pull ≈ 30% |
| `velocityScaling` | `true` | Keeps high-speed flicks smooth |

Store these in `packages/number-picker/src/constants.ts` and allow overrides.

## Testing Strategy

- **Unit tests** for `useSnapPhysics`
  - entering/exiting snap zone
  - hysteresis (exit > enter)
  - velocity scaling (low vs. high velocity)
- **Unit tests** for `usePointerVelocity`
  - correct velocity computation with steady drag
  - reset behavior
- **Manual QA**
  - Slow drag to value → snaps cleanly
  - Fast flick → scan freely
  - Overscroll bounds unchanged
  - Feature flag off → behavior identical to current prod

## Rollout Summary

Roadmap (Phase 0-4) lives in `packages/number-picker/snap-roadmap.md`. Use that file to track progress; keep this doc focused on the intended architecture.

### Debugging

Set `window.__QNI_SNAP_DEBUG__ = true` in the browser console to print snap calculations. Set `window.__QNI_DEBUG__ = true` for the broader QuickNumberInput lifecycle logs.
