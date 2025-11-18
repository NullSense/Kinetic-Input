# @tensil/kinetic-input

High-performance numeric scrubber components for React. The package exposes:

- `CollapsibleNumberPicker` – animated momentum picker with modal expansion
- `StandaloneWheelPicker` – lightweight list/range picker without modal chrome
- `PickerGroup` – bare-bones wheel primitive that powers both components
- Supporting hooks, theme builders, and configuration presets

All component docs now live in this README.

## ⚠️ Beta Release Notice

**This package is in active development (v0.x).** We're publishing early to gather real-world feedback and validate the API design.

**What this means:**
- ✅ **Production-ready code**: All tests passing, comprehensive documentation, no known bugs
- ⚠️ **API may change**: Breaking changes can occur between minor versions (0.1 → 0.2) until we reach v1.0
- 🐛 **Report issues**: Found a bug or have feedback? [Open an issue](https://github.com/NullSense/Kinetic-Input/issues)

We'll follow semantic versioning once we hit v1.0.0. Until then, pin to exact versions or use `~0.1.0` in your package.json to avoid unexpected breaking changes.

## Installation

```bash
npm install @tensil/kinetic-input
# or
yarn add @tensil/kinetic-input
```

Peer dependencies you must provide in your host app:

- `react` / `react-dom` (18 or 19)
- `framer-motion` (^11.0.0)
- `xstate` (^5.0.0)
- `@xstate/react` (^6.0.0)

## CSS Import (Required)

Import the styles in your app's entry point (e.g., `main.tsx` or `App.tsx`):

**Option 1: Convenience bundle (recommended)**
```tsx
import '@tensil/kinetic-input/styles/all.css'
```

**Option 2: Granular imports (for optimization)**
```tsx
// Pick only what you need:
import '@tensil/kinetic-input/styles/picker.css'  // Base (required for all)
import '@tensil/kinetic-input/styles/quick.css'   // CollapsibleNumberPicker
import '@tensil/kinetic-input/styles/wheel.css'   // StandaloneWheelPicker
```

The convenience bundle includes all styles (~6KB gzipped). Use granular imports if you only need specific components.

## Usage

### CollapsibleNumberPicker

```tsx
import CollapsibleNumberPicker from '@tensil/kinetic-input'

export function WeightField() {
  const [weight, setWeight] = useState(70)

  return (
    <CollapsibleNumberPicker
      label="Weight"
      value={weight}
      onChange={setWeight}
      unit="kg"
      min={40}
      max={200}
      step={0.5}
    />
  )
}
```

Need lower-level control? Import the named utilities:

```ts
import {
  CollapsibleNumberPicker,
  StandaloneWheelPicker,
  PickerGroup,
  DEFAULT_THEME,
  buildTheme,
  BOUNDARY_SETTLE_DELAY,
} from '@tensil/kinetic-input'
```

### StandaloneWheelPicker example

```tsx
import { StandaloneWheelPicker } from '@tensil/kinetic-input'

const colorOptions = [
  { value: 'rest', label: 'Rest Day', accentColor: '#8E77B5' },
  { value: 'short', label: 'Short Run', accentColor: '#3EDCFF' },
  { value: 'long', label: 'Long Run', accentColor: '#31E889' },
]

export function SessionPicker({ value, onChange }) {
  return (
    <StandaloneWheelPicker
      value={value}
      onChange={onChange}
      options={colorOptions}
      visibleItems={5}
      highlightColor="#3EDCFF"
    />
  )
}
```

## CollapsibleNumberPicker Features

- Momentum-based wheel/touch scrolling with mixed pointer + wheel support
- Smart auto-close timing (150 ms pointer, 800 ms wheel, 1.5 s idle)
- Controlled & uncontrolled modes
- Integer-scaled decimal arithmetic to avoid float drift
- Full theming + custom render hooks for values/items
- Optional backdrop + helper text support

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Label text |
| `value` | `number \| undefined` | required | Current value |
| `onChange` | `(value: number) => void` | required | Change handler |
| `unit` | `string` | `''` | Unit suffix (kg, cm, etc.) |
| `min` / `max` | `number` | `0 / 500` | Range bounds |
| `step` | `number` | `1` | Increment step |
| `lastValue` | `number` | - | Fallback when provided value is out-of-range |
| `placeholder` | `string` | `'—'` | Display when `value` is `undefined` |
| `isOpen` | `boolean` | uncontrolled | Controlled open state |
| `onRequestOpen` / `onRequestClose` | `() => void` | - | Required when `isOpen` is provided |
| `showBackdrop` | `boolean` | `false` | Dim background when open |
| `itemHeight` | `number` | `40` | Row height (px) |
| `theme` | `Partial<CollapsibleNumberPickerTheme>` | - | Override palette/typography |
| `renderValue` / `renderItem` | custom renderers | default layout | Hook into value/item rendering |
| `helperText` | `ReactNode` | - | Optional caption below the input |
| `enableSnapPhysics` | `boolean` | `false` | Experimental magnetic snap for slow drags |
| `snapPhysicsConfig` | `Partial<SnapPhysicsConfig>` | defaults | Override snap parameters |
| `wheelMode` | `'natural' \| 'inverted' \| 'off'` | `'inverted'` | Mouse wheel/touchpad mode. `'natural'` respects OS direction, `'inverted'` mimics iOS pickers, and `'off'` removes the wheel listeners entirely so the host page keeps scrolling. |
| `wheelSensitivity` | `number` | `1` | Multiplier for wheel/touchpad deltas. Raise it (>1) to make slow trackpads move further per gesture, lower it (<1) to tame hypersensitive hardware. |
| `wheelDeltaCap` | `number` | `1.25` | Upper bound (in rows) per wheel frame to keep single touchpad spikes from skipping multiple rows. Any excess delta is carried over to the next frame so fast scrubs still feel responsive. |
| `enableHaptics` | `boolean` | `true` | Vibration feedback on selection (mobile) |
| `enableAudioFeedback` | `boolean` | `true` | Audio clicks on selection |
| `feedbackConfig` | `QuickPickerFeedbackConfig` | - | Override audio/haptic adapters, patterns, or disable features per instance |

#### Wheel & touchpad behavior

- `wheelMode="off"` now removes the wheel listeners entirely so embedded pickers no longer block the page scroll or synthetic scroll containers. Use this when the quick picker sits next to scrollable content.
- When wheel input is enabled (`'natural'` or `'inverted'`) we still call `preventDefault` to keep focus inside the picker, but pinch-to-zoom gestures (which surface as `ctrlKey` + wheel on macOS trackpads) now pass through untouched so browser zoom shortcuts keep working.
- Pick `wheelMode="natural"` when you want OS-style scrolling (positive delta = scroll down) and `wheelMode="inverted"` to mimic the native iOS picker where scrolling down increments the value. Both modes will automatically open the picker on first wheel input.
- Tune `wheelSensitivity` on `CollapsibleNumberPicker` or `PickerGroup` to match your hardware. The default `1` keeps deltas 1:1 with incoming pixels/lines, >1 amplifies tiny trackpad deltas, and <1 slows aggressive desktop wheels without touching the physics stack.
- Use `wheelDeltaCap` to cap any single wheel frame to roughly a row (default `1.25` rows). Excess delta is rolled into the next frame so slow touchpads stay smooth while still allowing high-speed scrubs across long lists.
- The same guard powers both `CollapsibleNumberPicker` and bare `PickerGroup`, so standalone wheel pickers opt into wheel capture explicitly while every other instance remains passive by default.

#### Performance notes

- Wheel listeners are only attached when `wheelMode` is `'natural'` or `'inverted'`, and they use `passive: false` deliberately so `preventDefault` can stop accidental page scrolling without forcing reflows on unrelated nodes.
- Deltas stay in raw MotionValues until a settle frame runs, avoiding React state churn while still sampling velocity for momentum projection. The virtualization window (`slotCount` × `overscan`) means only a handful of rows render at any time, so long option lists keep layout and paint work bounded.

### Theming

Every color, font, and spacing can be customized via the `theme` prop. The library ships with sensible defaults (cyan accents on dark backgrounds), but you can override any property to match your design system.

#### Theme Interface

```ts
interface CollapsibleNumberPickerTheme {
  // Picker rows (when open)
  textColor: string                  // Non-selected rows
  activeTextColor: string            // Currently selected row
  unitColor: string                  // Unit label (e.g., "kg", "lbs")

  // Closed state (when collapsed)
  closedBorderColor: string          // Border when has value
  closedBorderColorEmpty: string     // Border when empty
  closedBackgroundColor: string      // Background when has value
  closedBackgroundColorEmpty: string // Background when empty

  // Interactive elements
  labelColor: string                 // Field label above picker
  lastValueButtonColor: string       // "↺ LAST" restore button
  focusRingColor: string             // Keyboard focus indicator

  // Open state (when expanded)
  highlightBorderColor: string       // Border around picker window
  highlightFillColor: string         // Fill behind selected row
  backdropColor: string              // Dark overlay behind picker
  fadeColor: string                  // Gradient fade at top/bottom

  // Advanced (rarely changed)
  selectedColor: string              // Internal selection state
  pendingColor: string               // Transition state
  hoverColor: string                 // Hover highlights
  flashColor: string                 // Success flash animation
  deselectColorA: string             // Deselection gradient start
  deselectColorB: string             // Deselection gradient end
  deselectColorOff: string           // Deselection disabled

  // Typography
  fontSize: string                   // Picker text size
  fontFamily: string                 // Picker font family
}
```

#### Default Theme

```ts
import { DEFAULT_THEME } from '@tensil/kinetic-input'

// Default values:
{
  textColor: '#9DB1BE',                    // Muted gray
  activeTextColor: '#3EDCFF',              // Cyan accent
  unitColor: '#8E77B5',                    // Purple
  closedBorderColor: 'rgba(62,220,255,0.5)',
  closedBackgroundColor: 'rgba(0,0,0,0.5)',
  highlightBorderColor: 'rgba(62,220,255,0.5)',
  labelColor: '#8E77B5',
  focusRingColor: 'rgba(62,220,255,0.7)',
  fontSize: 'clamp(24px, 6vw, 32px)',
  fontFamily: "'Geist Mono', monospace",
  // ... (see theme.ts for complete defaults)
}
```

#### Custom Themes

**Minimal override (just accent color):**
```tsx
<CollapsibleNumberPicker
  value={weight}
  onChange={setWeight}
  theme={{
    activeTextColor: '#10b981',        // Green-500
    closedBorderColor: '#10b981',
    highlightBorderColor: '#10b981',
  }}
/>
```

### CSS surface area

The package ships two scoped style sheets:

- `quick-number-input.css` – used by `CollapsibleNumberPicker`
- `wheel-picker.css` – used by `StandaloneWheelPicker`

Both root selectors (`.quick-number-input-root` and `.np-wheel-picker`) define a
small set of CSS custom properties. Everything else is expressed relative to
those tokens, so theming the component means touching a handful of values instead
of copy/pasting large swaths of CSS.

#### Quick number input tokens

| Token | Purpose |
|-------|---------|
| `--qni-row-height` | Controls each row’s height and the highlight band thickness |
| `--qni-visible-rows` | Sets the viewport height (defaults to 5 rows) |
| `--qni-font-family` / `--qni-font-size` | Typography for rows and the closed value |
| `--qni-unit-font-family` / `--qni-unit-font-size` | Typography for the value suffix ("kg", "lbs") |
| `--qni-gap` / `--qni-padding-inline` | Spacing between value + unit and the row padding |
| `--qni-color-muted` / `--qni-color-active` | Non-selected vs. selected text color |
| `--qni-color-unit` | Unit label color in both open and closed states |
| `--qni-highlight-fill` | Semi-transparent fill that sits behind the center row |
| `--qni-fade-color` | Top/bottom gradient color for the ambient fades |
| `--qni-backdrop-color` | Full-screen scrim color when the picker is modal |
| `--qni-active-scale` / `--qni-selected-scale` | Scale factor for the focused row vs. the surrounding trail |
| `--qni-selected-opacity` | Dimmed opacity for the previously selected row |
| `--qni-accent-letter-spacing` / `--qni-accent-shadow` | Shared accent text cosmetics for both states |
| `--qni-chevron-size` | Closed-state chevron icon size |
| `--qni-viewport-offset` | Derived placement for fades + highlight (auto-calculated) |

The presenter sets `--qni-row-height`/`--qni-visible-rows` at runtime so
highlight math automatically tracks your `itemHeight` + `visibleItems` props.
Geometry is derived from those tokens. For example, the highlight band is placed
with `calc(((visibleRows - 1) / 2) * rowHeight)` so the math stays correct even
when you change the number of visible rows.

Structural selectors:

- `.picker-surface` and `.picker-container` – wrap the scrollable column
- `.picker-item`, `.picker-item-active`, `.picker-item-selected` – individual rows
- `.picker-item-unit` and `.qni-unit` – unit text in both states

Overlay selectors:

- `.picker-highlight-fill` / `.picker-highlight-hitbox` – selection band & click
  target
- `.picker-fade-top` / `.picker-fade-bottom` – ambient fades above/below the
  list, tinted by `--qni-fade-color`
- `.picker-backdrop` – optional modal scrim (`--qni-backdrop-color`)

The closed state is scoped under `.quick-number-input-root`, so it reuses the
same font + unit tokens and never leaks global selectors.

#### Standalone wheel tokens

`StandaloneWheelPicker` exposes matching variables on `.np-wheel-picker`. The
component only reads:

- `--np-wheel-item-height`
- `--np-wheel-font-family`
- `--np-wheel-font-size`
- `--np-wheel-color`
- `--np-wheel-accent-color`
- `--np-wheel-unit-color`
- `--np-wheel-unit-font-size`
- `--np-wheel-gap`
- `--np-wheel-padding-inline`
- `--np-wheel-ease`
- `--np-wheel-active-scale`
- `--np-wheel-active-weight`
- `--np-wheel-transition`

Override those to customize spacing, fonts, and accent colors without touching
the internal selectors.

### Performance

- **Scoped selectors only.** Both style sheets hang entirely off their root
  class, so they never trigger restyles elsewhere in the host app.
- **Minimal custom properties.** Only geometry, typography, and color tokens are
  exposed; animation timing and scaling stay constant to avoid recalculating
  transitions on every render.
- **Shared typography.** The open and closed states reference the same font
  tokens, cutting duplicate declarations and ensuring text is only painted once
  per change.
- **Reduced stacking contexts.** Overlay/fade elements share absolute-positioning
  rules via `:where(...)`, which trims selector cost and keeps the layer tree
  shallow.
- **Automatic layout math.** The highlight position and fade heights are derived
  from `--qni-row-height`/`--qni-visible-rows`, so changing row counts doesn’t
  require extra DOM reads or manual CSS overrides.
- **Respect `prefers-reduced-motion`.** Both pickers disable their scale
  animations when the OS requests reduced motion, preventing unnecessary paints
  while keeping colors and layout intact.

**Complete custom theme:**
```tsx
// iOS-inspired light theme
const iosTheme = {
  activeTextColor: '#3b82f6',          // Blue
  textColor: '#64748b',                // Slate-500
  closedBorderColor: 'rgba(59,130,246,0.5)',
  closedBackgroundColor: 'rgba(241,245,249,0.8)',
  closedBackgroundColorEmpty: 'rgba(226,232,240,0.6)',
  labelColor: '#64748b',
  lastValueButtonColor: '#3b82f6',
  focusRingColor: 'rgba(59,130,246,0.7)',
  highlightBorderColor: 'rgba(59,130,246,0.5)',
  highlightFillColor: 'rgba(59,130,246,0.1)',
  backdropColor: 'rgba(0,0,0,0.2)',
  fadeColor: '#f1f5f9',
  fontSize: '18px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

<CollapsibleNumberPicker theme={iosTheme} />
```

**Design system integration:**
```tsx
// Match your existing design tokens
const theme = {
  activeTextColor: 'var(--color-primary)',
  closedBorderColor: 'var(--color-border-focus)',
  closedBackgroundColor: 'var(--color-surface)',
  labelColor: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-lg)',
  fontFamily: 'var(--font-sans)',
}

<CollapsibleNumberPicker theme={theme} />
```

#### Theme Builder

Use `buildTheme` for type-safe overrides:

```tsx
import { buildTheme } from '@tensil/kinetic-input'

const myTheme = buildTheme({
  activeTextColor: '#ff0000',
  // Unspecified properties use DEFAULT_THEME
})

<CollapsibleNumberPicker theme={myTheme} />
```

#### Common Patterns

**Match modal background:**
```tsx
// If your picker opens in a yellow modal
<div className="bg-yellow-400">
  <CollapsibleNumberPicker
    theme={{
      fadeColor: '#facc15',              // yellow-400
      closedBackgroundColor: 'rgba(250,204,21,0.9)',
      backdropColor: 'rgba(250,204,21,0.3)',
    }}
  />
</div>
```

**Dark mode toggle:**
```tsx
const lightTheme = {
  activeTextColor: '#2563eb',
  closedBorderColor: 'rgba(37,99,235,0.5)',
  fadeColor: '#ffffff',
}

const darkTheme = {
  activeTextColor: '#60a5fa',
  closedBorderColor: 'rgba(96,165,250,0.5)',
  fadeColor: '#0a0b0d',
}

<CollapsibleNumberPicker theme={isDark ? darkTheme : lightTheme} />
```

**Brutalist high contrast:**
```tsx
<CollapsibleNumberPicker
  theme={{
    activeTextColor: '#000000',
    textColor: '#000000',
    closedBorderColor: '#000000',
    closedBackgroundColor: '#ffff00',
    highlightBorderColor: '#000000',
    fadeColor: '#ffff00',
    fontSize: '28px',
    fontFamily: '"Courier New", monospace',
  }}
/>
```

### Auto-Close Behavior

| Interaction | Timeout | Notes |
|-------------|---------|-------|
| Pointer drag released | 150 ms | Ideal for quick scrubs |
| Wheel / trackpad scroll | 800 ms | Allows momentum to finish |
| Idle (no interactions) | 1.5 s | Auto-closes after browsing |
| ESC / click outside | Immediate | Hard close via state machine |

The `BOUNDARY_SETTLE_DELAY` constant (150 ms) is exported for tweaking the overscroll bounce timing.

### Controlled Mode

```tsx
const [isOpen, setIsOpen] = useState(false)
const [reps, setReps] = useState(10)

<CollapsibleNumberPicker
  label="Reps"
  value={reps}
  onChange={setReps}
  isOpen={isOpen}
  onRequestOpen={() => setIsOpen(true)}
  onRequestClose={() => setIsOpen(false)}
  enableSnapPhysics
  snapPhysicsConfig={{ snapRange: 0.2, pullStrength: 0.55 }}
/>
```

### Decimal Precision

The hook uses integer scaling, so `step={0.1}` or `step={0.125}` produces `0.3` not `0.3000000004`. The number of decimals is inferred from `min`, `max`, and `step`, and every value is formatted consistently.

## Debugging

Debug logging is **disabled by default** to prevent console spam. Enable it when needed:

**In browser console:**
```javascript
window.__QNI_DEBUG__ = true;          // CollapsibleNumberPicker events
window.__QNI_SNAP_DEBUG__ = true;     // Snap physics calculations
window.__QNI_STATE_DEBUG__ = true;    // State machine transitions
window.__QNI_WHEEL_DEBUG__ = true;    // StandaloneWheelPicker events

// Then reload the page
location.reload();
```

**Programmatically:**
```typescript
import { enableAllDebugNamespaces } from '@tensil/kinetic-input/utils';

if (import.meta.env.DEV) {
  enableAllDebugNamespaces();
}
```

**Disable all:**
```typescript
import { disableAllDebugNamespaces } from '@tensil/kinetic-input/utils';
disableAllDebugNamespaces();
```

## Advanced Configuration

### Timing Presets

Control auto-close behavior with presets:

```tsx
<CollapsibleNumberPicker
  timingPreset="fast"    // 100ms pointer, 600ms wheel, 1s idle
  // or "balanced" (default), "slow", "accessible"
/>
```

Auto-detect based on device + user preferences:

```typescript
import { getRecommendedTiming } from '@tensil/kinetic-input/config';

<CollapsibleNumberPicker timingPreset={getRecommendedTiming()} />
```

### Custom Timing

```tsx
<CollapsibleNumberPicker
  timingConfig={{
    settleGracePeriod: 200,  // ms after pointer release
    wheelIdleTimeout: 1000,  // ms after wheel scroll
    idleTimeout: 2000,       // ms for multi-gesture browsing
  }}
/>
```

### Snap Physics

Enable magnetic snapping for slow drags:

```tsx
<CollapsibleNumberPicker
  enableSnapPhysics
  snapPhysicsConfig={{
    snapRange: 0.3,          // 30% of item height
    pullStrength: 0.6,       // Magnetic strength (0-1)
    velocityThreshold: 120,  // px/s to override snap
    rangeScaleIntensity: 0.12,       // Base flick projection window (seconds)
    rangeScaleVelocityBoost: 1.25,   // Multiply projection once velocity crosses the threshold
    rangeScaleVelocityCap: 3200,     // Clamp release velocity (px/s)
  }}
/>
```

The release scaler works in two stages:

1. **Base projection (`rangeScaleIntensity`)** gives every flick ~120 ms of extra coast, so a 500 px/s scrub glides ~60 px after you let go.
2. **Velocity boost (`rangeScaleVelocityBoost`)** measures how far the release speed exceeds `velocityThreshold` and multiplies the projection window up to `(1 + boost)x`. Faster flicks now reliably skip more values instead of instantly snapping back.

Pair the boost with `rangeScaleVelocityCap` if you want to keep runaway scroll wheels from skipping the entire dataset.

## Local Development

This package lives in a monorepo. From repo root:

| Command | Description |
| ------- | ----------- |
| `npm run build:number-picker` | Bundle ESM/CJS + types |
| `npm run dev` | Run demo app with HMR |

Changes in `packages/number-picker/src` hot-reload in the dev app via Vite path aliases.

## License

See [LICENSE](./LICENSE) for details.
### Audio & Haptic Configuration

`feedbackConfig` exposes a single object for tuning sound/vibration without reaching into internal hooks:

```tsx
<CollapsibleNumberPicker
  label="Speed"
  value={72}
  onChange={setSpeed}
  unit="mph"
  feedbackConfig={{
    enableAudioFeedback: false,           // disable audio globally for this picker
    haptics: { pattern: [8, 4, 8] },       // custom vibrate pattern per tick
    audio: { frequency: 660, waveform: 'sine' },
    adapters: {                           // inject bespoke adapters if you already own a feedback system
      audio: customAudioAdapter,
    },
  }}
/>
```

`QuickPickerFeedbackConfig` mirrors the exported adapter options:

```ts
type QuickPickerFeedbackConfig = {
  enableHaptics?: boolean;          // override legacy props per instance
  enableAudioFeedback?: boolean;
  haptics?: { pattern?: number | number[] };
  audio?: {
    frequency?: number;
    waveform?: OscillatorType;
    attackMs?: number;
    decayMs?: number;
    durationMs?: number;
    peakGain?: number;
  };
  adapters?: {
    haptics?: HapticAdapter | null;
    audio?: AudioAdapter | null;
  };
};
```

When you provide adapters the built-in modules are never instantiated, so host apps can plug into shared audio/haptic controllers or stub them entirely for tests.

