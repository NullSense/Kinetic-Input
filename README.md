# @tensil/kinetic-input

High-performance numeric scrubber components for React. The package exposes:

- `CollapsiblePicker` – animated momentum picker with modal expansion
- `Picker` – lightweight list/range picker without modal chrome
- `PickerGroup` – bare-bones wheel primitive that powers both components
- Supporting hooks, theme builders, and configuration presets

**📚 Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - In-depth architecture guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development setup and contributing guidelines

All component docs now live in this README.

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
import '@tensil/kinetic-input/styles/quick.css'   // CollapsiblePicker
import '@tensil/kinetic-input/styles/wheel.css'   // Picker
```

The convenience bundle includes all styles (~6KB gzipped). Use granular imports if you only need specific components.

## Usage

### CollapsiblePicker

```tsx
import CollapsiblePicker from '@tensil/kinetic-input'

export function WeightField() {
  const [weight, setWeight] = useState(70)

  return (
    <CollapsiblePicker
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
  CollapsiblePicker,
  Picker,
  PickerGroup,
  DEFAULT_THEME,
  buildTheme,
  BOUNDARY_SETTLE_DELAY,
} from '@tensil/kinetic-input'
```

### Picker example

```tsx
import { Picker } from '@tensil/kinetic-input'

const colorOptions = [
  { value: 'rest', label: 'Rest Day', accentColor: '#8E77B5' },
  { value: 'short', label: 'Short Run', accentColor: '#3EDCFF' },
  { value: 'long', label: 'Long Run', accentColor: '#31E889' },
]

export function SessionPicker({ value, onChange }) {
  return (
    <Picker
      value={value}
      onChange={onChange}
      options={colorOptions}
      visibleItems={5}
      highlightColor="#3EDCFF"
    />
  )
}
```

## CollapsiblePicker Features

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
| `itemHeight` | `number` | `40` | Row height (px) |
| `theme` | `Partial<CollapsiblePickerTheme>` | - | Override palette/typography |
| `renderValue` / `renderItem` | custom renderers | default layout | Hook into value/item rendering |
| `helperText` | `ReactNode` | - | Optional caption below the input |
| `enableSnapPhysics` | `boolean` | `false` | Experimental magnetic snap for slow drags |
| `snapPhysicsConfig` | `Partial<SnapPhysicsConfig>` | defaults | Override snap parameters |
| `wheelSensitivity` | `number` | `1` | Wheel/trackpad scroll speed multiplier (higher = faster) |
| `wheelDeltaCap` | `number` | `1.25` | Maximum wheel delta per frame in rows (prevents jumps) |
| `enableHaptics` | `boolean` | `true` | Vibration feedback on selection (mobile) |
| `enableAudioFeedback` | `boolean` | `true` | Audio clicks on selection |
| `feedbackConfig` | `QuickPickerFeedbackConfig` | - | Override audio/haptic adapters or patterns |

### Theming

Every color, font, and spacing can be customized via the `theme` prop. The library ships with sensible defaults (cyan accents on dark backgrounds), but you can override any property to match your design system.

#### Theme Interface

```ts
interface CollapsiblePickerTheme {
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
<CollapsiblePicker
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

<CollapsiblePicker theme={iosTheme} />
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

<CollapsiblePicker theme={theme} />
```

#### Theme Builder

Use `buildTheme` for type-safe overrides:

```tsx
import { buildTheme } from '@tensil/kinetic-input'

const myTheme = buildTheme({
  activeTextColor: '#ff0000',
  // Unspecified properties use DEFAULT_THEME
})

<CollapsiblePicker theme={myTheme} />
```

#### Common Patterns

**Match modal background:**
```tsx
// If your picker opens in a yellow modal
<div className="bg-yellow-400">
  <CollapsiblePicker
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

<CollapsiblePicker theme={isDark ? darkTheme : lightTheme} />
```

**Brutalist high contrast:**
```tsx
<CollapsiblePicker
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

<CollapsiblePicker
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
window.__QNI_DEBUG__ = true;           // CollapsiblePicker events
window.__QNI_PICKER_DEBUG__ = true;    // Picker physics & pointer events
window.__QNI_SNAP_DEBUG__ = true;      // Snap physics calculations
window.__QNI_STATE_DEBUG__ = true;     // State machine transitions
window.__QNI_WHEEL_DEBUG__ = true;     // Wheel picker events
window.__QNI_ANIMATION_DEBUG__ = true; // Animation lifecycle

// Then reload the page
location.reload();
```

**Programmatically (before app initialization):**
```typescript
// Set debug flags before your app loads
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__QNI_DEBUG__ = true;
  window.__QNI_SNAP_DEBUG__ = true;
  // ... set other flags as needed
}
```

## Advanced Configuration

### Timing Presets

Control auto-close behavior with presets:

```tsx
<CollapsiblePicker
  timingPreset="fast"    // Quick auto-close timing
  // Available: "instant", "fast", "balanced" (default), "patient"
/>
```

Auto-detect based on device + user preferences:

```typescript
import { getRecommendedTiming } from '@tensil/kinetic-input/config';

// Auto-selects timing based on:
// - prefers-reduced-motion setting
// - Touch device detection
// - Screen size (mobile vs desktop)
<CollapsiblePicker timingPreset={getRecommendedTiming()} />
```

### Custom Timing

```tsx
<CollapsiblePicker
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
<CollapsiblePicker
  enableSnapPhysics
  snapPhysicsConfig={{
    snapRange: 0.3,          // 30% of item height
    pullStrength: 0.6,       // Magnetic strength (0-1)
    velocityThreshold: 120,  // px/s to override snap
  }}
/>
```

## Interactive Demo

See the components in action at the [live demo site](https://nullsense.github.io/Kinetic-Input/) or run it locally:

```bash
# From repo root
npm install
npm run build        # Build the library first
npm run dev:demo     # Run demo at http://localhost:3001
```

The demo app lives in `demo/` and showcases all features with an interactive code playground.

## Project Structure

This is an **npm workspaces monorepo** with unified tooling and configuration:

```
Kinetic-Input/                     # Root workspace
├── packages/
│   └── number-picker/             # Core library (@tensil/kinetic-input npm package)
│       ├── src/                   # Source code
│       ├── dist/                  # Build output (gitignored)
│       ├── package.json           # Package dependencies & scripts
│       ├── tsconfig.json          # TypeScript config (extends root)
│       ├── tsup.config.ts         # Build config (ESM bundles)
│       └── vitest.config.ts       # Test config
├── demo/                          # Demo application (Vite + React)
│   ├── src/                       # Demo source
│   ├── dist/                      # Build output (gitignored)
│   ├── package.json               # Demo dependencies & scripts
│   ├── vite.config.ts             # Vite config with HMR for library
│   └── tsconfig.json              # TypeScript config (extends root)
├── package.json                   # Root workspace orchestration
├── tsconfig.json                  # Base TypeScript config
├── .oxlintrc.json                 # Unified linting rules
├── .lintstagedrc.json             # Pre-commit linting
└── .husky/                        # Git hooks

```

### Configuration Philosophy

**Unified at root level** (single source of truth):
- ✅ Linting (oxlint) - Same rules for library & demo
- ✅ Type checking (TypeScript base config) - Shared compiler options
- ✅ Git hooks (husky) - Pre-commit quality gates
- ✅ Dev dependencies - Shared testing & linting tools

**Separate per workspace** (domain-specific):
- 📦 Build tools - `tsup` for library, `Vite` for demo app
- 📦 Runtime dependencies - Demo uses Tailwind, library doesn't
- 📦 Scripts - Each workspace has its own dev/build workflows

This structure enables:
- **Consistency** - Same lint & type rules across all code
- **Efficiency** - Shared `node_modules` for faster installs
- **Flexibility** - Each workspace optimized for its purpose
- **Portability** - Library can be easily extracted if needed

## Development

### Quick Start

```bash
# Install all workspace dependencies
npm install

# Start demo with live library reloading
npm run dev:demo

# Open http://localhost:3001
```

### Common Commands

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Alias for `dev:demo` - start demo |
| `npm run build` | Build library package only |
| `npm run build:demo` | Build demo for production |
| `npm run build:all` | Build both library and demo |
| `npm test` | Run all tests |
| `npm run lint` | Lint all code with oxlint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run typecheck` | Type check all workspaces |
| `npm run validate` | Full check (typecheck + lint + test) |

### Development Workflow

**Working on the library:**
```bash
# Edit files in packages/number-picker/src/
# Tests run automatically via git hooks
npm test                    # Run all tests manually
npm run test:ui             # Open Vitest UI for TDD
```

**Working on the demo:**
```bash
npm run dev:demo            # Start with HMR
# Edit files in demo/src/
# Changes hot-reload automatically
```

**Library changes reflect in demo instantly** via Vite workspace configuration (no rebuild needed during development).

### Testing

Tests are in the library package only (demo is a showcase, not production code):

```bash
npm test                    # Run all tests
npm run test:ui             # Interactive UI
npm run test:coverage       # Coverage report
```

All tests must pass before commits (enforced by git hooks).

### Code Quality

Pre-commit hooks automatically:
- ✅ Lint staged files with oxlint
- ✅ Type check all workspaces (manual: `npm run typecheck`)
- ✅ Run tests on changed files (manual: `npm test`)

```bash
npm run lint                # Check all files
npm run lint:fix            # Auto-fix issues
npm run lint:dead-code      # Find unused exports
```

## Browser Support

This library works in all modern browsers with:

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android Chrome 90+
- **Required APIs**: Pointer Events, CSS Grid (supported by all modern browsers)

See [ARCHITECTURE.md](./ARCHITECTURE.md#browser-support) for detailed compatibility information.

## License

MIT - See [LICENSE](./LICENSE) for details.
