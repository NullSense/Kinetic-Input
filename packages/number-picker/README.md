# @tensil/number-picker

High-performance numeric scrubber components for React. The package exposes:

- `CollapsibleNumberPicker` – animated momentum picker with modal expansion
- `StandaloneWheelPicker` – lightweight list/range picker without modal chrome
- `PickerGroup` – bare-bones wheel primitive that powers both components
- Supporting hooks, theme builders, and configuration presets

All component docs now live in this README.

## Installation

```bash
npm install @tensil/number-picker
# or
yarn add @tensil/number-picker
```

Peer dependencies you must provide in your host app:

- `react` / `react-dom` (18 or 19)
- `framer-motion`
- `lucide-react`

## Usage

### CollapsibleNumberPicker

```tsx
import CollapsibleNumberPicker from '@tensil/number-picker'

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
} from '@tensil/number-picker'
```

### StandaloneWheelPicker example

```tsx
import { StandaloneWheelPicker } from '@tensil/number-picker'

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
| `wheelMode` | `'natural' \| 'inverted' \| 'off'` | `'inverted'` | Mouse wheel scroll direction (inverted: down=increment) |
| `enableHaptics` | `boolean` | `true` | Vibration feedback on selection (mobile) |
| `enableAudioFeedback` | `boolean` | `false` | Audio clicks on selection |

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
import { DEFAULT_THEME } from '@tensil/number-picker'

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
import { buildTheme } from '@tensil/number-picker'

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
import { enableAllDebugNamespaces } from '@tensil/number-picker/utils';

if (import.meta.env.DEV) {
  enableAllDebugNamespaces();
}
```

**Disable all:**
```typescript
import { disableAllDebugNamespaces } from '@tensil/number-picker/utils';
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
import { getRecommendedTiming } from '@tensil/number-picker/config';

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
  }}
/>
```

## Local Development

This package lives in a monorepo. From repo root:

| Command | Description |
| ------- | ----------- |
| `npm run build:number-picker` | Bundle ESM/CJS + types |
| `npm run dev` | Run demo app with HMR |

Changes in `packages/number-picker/src` hot-reload in the dev app via Vite path aliases.

## License

See [LICENSE](./LICENSE) for details.
