# Open-source readiness audit

This library currently exposes three different picker experiences (the legacy multi-column `Picker`,
the single-column `WheelPicker`, and the orchestrated `QuickNumberInput`). A pass to eliminate
redundant APIs, unused helpers, and defensive abstractions can trim hundreds of lines while keeping
the core scrolling picker intact.

## 1. Overlapping picker surfaces
- `QuickNumberInput` stitches together eleven hooks, a presenter component, and picker body wrapper,
  even though it ultimately renders the same `Picker.Column` implementation that the rest of the
  package already exports.【F:packages/number-picker/src/quick/QuickNumberInput.tsx†L1-L288】【F:packages/number-picker/src/quick/QuickNumberInput.pickerBody.tsx†L1-L153】
- `WheelPicker` replicates the same value-window rendering, range generation, and highlight chrome,
  only to pipe the data back through `Picker.Column` as well.【F:packages/number-picker/src/wheel/WheelPicker.tsx†L1-L172】
- The re-export shim at `src/reactMobilePicker.ts` keeps both stacks alive under different import
  paths, which makes it harder to collapse the API surface for external consumers.【F:packages/number-picker/src/reactMobilePicker.ts†L1-L2】

**Opportunity:** Ship a single `Picker` shell (plus a light “themed” wrapper) instead of maintaining
three almost-identical entry points. Consolidating the wheel UI into the quick presenter would remove
hundreds of lines of duplicated JSX, documentation, and storybook plumbing.

## 2. Gesture/state orchestration stack
- The quick picker keeps a full XState machine definition (`pickerStateMachine.machine.ts`) plus
  separate guards/actions files purely to auto-close after pointer, wheel, or idle gestures.【F:packages/number-picker/src/quick/hooks/pickerStateMachine.machine.ts†L1-L173】
- `useQuickPickerOrchestration` wires that machine to DOM refs, click-outside listeners, highlight tap
  detection, and keyboard fallbacks, which adds another 250 lines of bespoke imperative logic around
  a single spinbutton.【F:packages/number-picker/src/quick/hooks/useQuickPickerOrchestration.ts†L1-L265】
- The orchestration hook immediately delegates again to `usePickerGestures` (285 lines) to manage the
  same pointer/wheel bookkeeping, timers, and refs that the picker column already tracks internally.
  It duplicates wheel idle timers, overscroll boundary detection, and even keeps manual flags like
  `deferGestureCloseRef` to paper over state-machine transitions.【F:packages/number-picker/src/quick/hooks/usePickerGestures.ts†L1-L285】
- Keyboard and last-value controllers (`useQuickNumberControllers` + `useKeyboardControls`) further
  duplicate selection logic (`values`, `selectedIndex`, `handleValueChange`) that already lives in the
  picker context.【F:packages/number-picker/src/quick/hooks/useQuickNumberControllers.ts†L1-L61】【F:packages/number-picker/src/quick/hooks/useKeyboardControls.ts†L1-L141】

**Opportunity:** Replace the XState layer with a small `useReducer` or even `useRef`+`setTimeout`
helper, and have the surface delegate gesture lifecycle to `Picker.Column`. Collapsing the state
machine + orchestration + gesture hooks into a single `usePickerOpenState` would reclaim well over
500 lines and reduce bundle weight (no more `@xstate/react`).

## 3. Number-range + formatting duplication
- `useFormattedValues` generates the numeric range list, caches formatted strings, and tracks the
  selected index for the quick picker.【F:packages/number-picker/src/quick/hooks/useFormattedValues.ts†L75-L164】
- `WheelPicker` implements its own `generateRangeOptions`/`normalizeOptions` helpers plus value ↔ key
  maps that repeat the same scaling and formatting logic, only to feed those values right back into
  the picker column.【F:packages/number-picker/src/wheel/WheelPicker.tsx†L38-L149】

**Opportunity:** Move the range + formatting builder into `src/utils` and reuse it in both surfaces.
Sharing that layer would immediately cut ~150 lines and guarantee both entry points stay in sync when
adding decimal support or placeholder handling.

## 4. Timing + interaction configuration bloat
- `config/timing.ts` contains a 340-line builder, validation helpers, and detection utilities, but the
  rest of the package only ever reads `TIMING_PRESETS` (plus `getRecommendedTiming` inside the themed
  wrapper). None of the builder/resolver/type guard exports are referenced in the source tree.【F:packages/number-picker/src/config/timing.ts†L1-L342】【F:packages/number-picker/src/quick/hooks/useQuickPickerFeedbackService.ts†L1-L58】【F:packages/number-picker/src/quick/ThemedNumberInput.tsx†L1-L26】
- `config/interaction.ts` defines gesture thresholds that are never imported anywhere in the repo.【F:packages/number-picker/src/config/interaction.ts†L1-L4】
- `src/constants.ts` and `src/quick/constants.ts` simply re-export the same values from `config/ui`
  for backwards compatibility, which keeps duplicate files alive and confuses the “official” import
  path.【F:packages/number-picker/src/constants.ts†L1-L5】【F:packages/number-picker/src/quick/constants.ts†L1-L11】

**Opportunity:** Delete the unused timing builder + gesture config and collapse the deprecated export
files. Exporting `UI`/`TIMING_PRESETS` from a single module will shrink the config folder by ~200
lines and avoid keeping stale APIs around.

## 5. Optional feedback + media side effects
- The picker feedback hook spins up `AudioContext`, keeps custom oscillators, vibrates via
  `navigator.vibrate`, and maintains multiple refs purely to play confirmation chirps. That is a large
  chunk of imperative code to ship by default, and it runs even when haptics/audio are disabled.
  Splitting this into optional adapters or removing the audio portion would simplify the quick picker
  without affecting the core scrolling behavior.【F:packages/number-picker/src/quick/hooks/usePickerFeedback.ts†L1-L167】

## 6. Debug + re-export shims
- `quick/debug.ts` and `reactMobilePicker.ts` exist only to forward exports, but they force consumers
  to keep two sets of entry points alive and complicate tree-shaking.【F:packages/number-picker/src/quick/debug.ts†L1-L5】【F:packages/number-picker/src/reactMobilePicker.ts†L1-L2】
- The debug helper itself (`src/utils/debug.ts`) spans ~200 lines of opt-in logging plumbing. Once the
  quick picker is simplified, most of these namespaces can be removed or guarded behind a build flag.

## Largest DRY opportunities (order of impact)
1. **Unify picker surfaces** – Collapse `QuickNumberInput`, `WheelPicker`, and the bare `Picker`
   exports into a single component + themed wrapper. Removes duplicated JSX, CSS variables, and docs
   while keeping the existing prop API. Estimated savings: 300–400 LOC by deleting redundant
   presenter/picker-body/wheel markup.【F:packages/number-picker/src/quick/QuickNumberInput.tsx†L1-L288】【F:packages/number-picker/src/wheel/WheelPicker.tsx†L1-L172】
2. **Drop the XState layer** – Replace `pickerStateMachine.*`, `useQuickPickerOrchestration`, and
   `usePickerGestures` with a compact hook that tracks `isOpen` + an idle timeout. No change to the
   UI, but it erases >500 lines and removes the `@xstate/react` dependency.【F:packages/number-picker/src/quick/hooks/pickerStateMachine.machine.ts†L1-L173】【F:packages/number-picker/src/quick/hooks/useQuickPickerOrchestration.ts†L1-L265】【F:packages/number-picker/src/quick/hooks/usePickerGestures.ts†L1-L285】
3. **Centralize number-range utilities** – Extract the logic from `useFormattedValues` and
   `WheelPicker` into a shared helper so both surfaces pull from the same formatter/cache. This trims
   another ~150 lines and guarantees both pickers respect decimals, placeholders, and cached maps.
   【F:packages/number-picker/src/quick/hooks/useFormattedValues.ts†L75-L164】【F:packages/number-picker/src/wheel/WheelPicker.tsx†L38-L149】
4. **Remove unused config + feedback extras** – Delete the unused timing builder, gesture constants,
   and back-compat export files, and gate the audio/haptic feedback hook behind feature flags or a
   lighter adapter so projects can tree-shake it. Estimated savings: 200+ LOC without touching the
   picker UI.【F:packages/number-picker/src/config/timing.ts†L1-L342】【F:packages/number-picker/src/config/interaction.ts†L1-L4】【F:packages/number-picker/src/quick/hooks/usePickerFeedback.ts†L1-L167】

Taken together, these cleanup items eliminate the bulk of the redundant code paths and side-effect
heavy utilities that currently block the package from being a slim, open-source-friendly number
picker.
