# Kinetic Input Demo

Interactive demo showcasing all features of `@tensil/kinetic-input` with live code editing and theme customization.

## Quick Start

```bash
# From project root
npm install
npm run dev:demo

# Open http://localhost:3001
```

The demo is wired directly to the local `packages/number-picker` source (no npm publish required). The `predev` script rebuilds the
package once so Vite can use the latest local types while runtime imports resolve to the raw source for instant feedback.

## Full Configuration Example

### Complete Setup with All Options

```tsx
import { useState } from 'react'
import CollapsiblePicker from '@tensil/kinetic-input'
import '@tensil/kinetic-input/styles/all.css'

export function CompleteExample() {
  const [weight, setWeight] = useState(70)
  const [lastWeight, setLastWeight] = useState(70)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <CollapsiblePicker
      // Required props
      label="Weight"
      value={weight}
      onChange={(newValue) => {
        setWeight(newValue)
        setLastWeight(weight) // Save for restore
      }}

      // Range configuration
      min={40}
      max={200}
      step={0.5}
      unit="kg"

      // Controlled mode (optional)
      isOpen={isOpen}
      onRequestOpen={() => setIsOpen(true)}
      onRequestClose={() => setIsOpen(false)}

      // Last value restore (optional)
      lastValue={lastWeight}

      // Visual configuration
      placeholder="—"
      helperText="Your current body weight"
      showBackdrop={true}
      itemHeight={40}

      // Timing presets
      timingPreset="balanced" // "instant" | "fast" | "balanced" | "patient"

      // Custom timing (overrides preset)
      timingConfig={{
        settleGracePeriod: 150,  // ms after pointer release
        wheelIdleTimeout: 800,   // ms after wheel scroll
        idleTimeout: 4000,       // ms for browsing mode
      }}

      // Snap physics (experimental)
      enableSnapPhysics={false}
      snapPhysicsConfig={{
        snapRange: 0.3,          // 30% of item height
        pullStrength: 0.6,       // Magnetic strength (0-1)
        velocityThreshold: 120,  // px/s to override snap
      }}

      // Wheel configuration
      wheelSensitivity={1}       // Scroll speed multiplier
      wheelDeltaCap={1.25}       // Max wheel delta per event

      // Feedback
      enableHaptics={true}       // Vibration on mobile
      enableAudioFeedback={false} // Click sounds

      // Theme customization
      theme={{
        // Active state
        activeTextColor: '#3EDCFF',
        highlightBorderColor: 'rgba(62, 220, 255, 0.5)',
        highlightFillColor: 'rgba(62, 220, 255, 0.05)',

        // Closed state
        closedBorderColor: 'rgba(62, 220, 255, 0.5)',
        closedBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        closedBorderColorEmpty: 'rgba(62, 220, 255, 0.2)',
        closedBackgroundColorEmpty: 'rgba(0, 0, 0, 0.3)',

        // Text colors
        textColor: '#9DB1BE',
        unitColor: '#8E77B5',
        labelColor: '#8E77B5',
        lastValueButtonColor: '#3EDCFF',

        // Interactive states
        focusRingColor: 'rgba(62, 220, 255, 0.7)',
        backdropColor: 'rgba(0, 0, 0, 0.3)',

        // Visual effects
        fadeColor: '#0A0B0D',
        flashColor: '#31E889',

        // Typography
        fontSize: 'clamp(24px, 6vw, 32px)',
        fontFamily: "'Geist Mono', monospace",
      }}

      // Custom renderers (advanced)
      renderValue={({ value, unit }) => (
        <span>{value !== undefined ? `${value} ${unit}` : '—'}</span>
      )}
      renderItem={({ value, unit, isActive, isSelected }) => (
        <div className={isActive ? 'active' : ''}>
          {value} <span className="unit">{unit}</span>
        </div>
      )}
    />
  )
}
```

### Minimal Configuration

```tsx
import CollapsiblePicker from '@tensil/kinetic-input'
import '@tensil/kinetic-input/styles/all.css'

export function MinimalExample() {
  const [value, setValue] = useState(10)

  return (
    <CollapsiblePicker
      label="Reps"
      value={value}
      onChange={setValue}
      min={1}
      max={50}
    />
  )
}
```

### Picker Example

```tsx
import { Picker } from '@tensil/kinetic-input'
import '@tensil/kinetic-input/styles/all.css'

const sessionTypes = [
  { value: 'rest', label: 'Rest Day', accentColor: '#8E77B5' },
  { value: 'easy', label: 'Easy Run', accentColor: '#3EDCFF' },
  { value: 'tempo', label: 'Tempo Run', accentColor: '#FFB84D' },
  { value: 'interval', label: 'Intervals', accentColor: '#E03E3E' },
  { value: 'long', label: 'Long Run', accentColor: '#31E889' },
]

export function SessionPicker() {
  const [session, setSession] = useState('easy')

  return (
    <Picker
      value={session}
      onChange={setSession}
      options={sessionTypes}
      visibleItems={5}
      highlightColor="#3EDCFF"
      itemHeight={48}
    />
  )
}
```

## Project Structure

```
demo/
├── src/
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point (CSS imports here)
│   ├── index.css                  # Global styles + design tokens
│   └── components/
│       ├── Hero.tsx               # Landing section
│       ├── ComponentShowcase.tsx  # Interactive demos
│       ├── PresetsGallery.tsx     # Theme presets showcase
│       ├── CodeSnippets.tsx       # Live code editor
│       ├── TimePickerExample.tsx  # Multi-column picker demo
│       └── HapticsIndicator.tsx   # Feedback visualizations
├── vite.config.ts                 # Vite + Tailwind config
└── package.json                   # Demo dependencies
```

## Key Features Demonstrated

- **All component variants**: CollapsiblePicker, Picker, PickerGroup
- **Live code editing**: Edit React code and see changes instantly
- **Theme customization**: Visual theme editor with preset gallery
- **Timing presets**: Compare instant, fast, balanced, and patient modes
- **Feedback systems**: Haptics and audio visualization
- **Responsive design**: Touch, mouse, and keyboard interactions
- **Accessibility**: Keyboard navigation, screen reader support

## CSS Import Location

The demo imports all styles in `src/main.tsx`:

```tsx
import './index.css'                                  // Global styles
import '../../packages/number-picker/src/styles/all.css'  // Component styles
```

This ensures styles are loaded before any components render.

## Design Tokens

The demo uses CSS custom properties defined in `src/index.css`:

```css
:root {
  --bg: #0A0B0D;
  --fg: #E7EDF2;
  --accent: #3EDCFF;
  --secondary: #8E77B5;
  /* ... more tokens */
}
```

These align with the library's default theme for visual consistency.

## Development

### Hot Module Replacement (HMR)

Vite provides instant feedback:
- Edit component code → instant update
- Edit styles → instant update
- Edit demo code → instant update

### Building for Production

```bash
npm run build:demo  # Outputs to demo/dist/
npm run preview     # Preview production build
```

## Live Demo

Visit [https://nullsense.github.io/Kinetic-Input/](https://nullsense.github.io/Kinetic-Input/) to see the deployed demo.
