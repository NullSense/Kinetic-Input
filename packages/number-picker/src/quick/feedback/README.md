# Feedback System - Tree-Shaking Optimization

## Overview

The feedback system provides haptic and audio feedback for picker interactions. It's designed to be **tree-shakeable**, meaning unused feedback code can be eliminated from production bundles when disabled.

## Architecture

```
feedback/
├── index.ts      # Main adapter factory (conditionally loads modules)
├── haptics.ts    # Haptic feedback (navigator.vibrate API)
├── audio.ts      # Audio feedback (Web Audio API)
└── README.md     # This file
```

## Usage

### Default (Both Enabled)

```tsx
<QuickNumberInput
  enableHaptics={true}          // Default: true
  enableAudioFeedback={true}    // Default: true
  // ... other props
/>
```

**Bundle impact:** Haptics (~0.5 KB) + Audio (~1.5 KB) = ~2 KB overhead

### Disabled (Maximum Tree-Shaking)

```tsx
<QuickNumberInput
  enableHaptics={false}
  enableAudioFeedback={false}
  // ... other props
/>
```

**Bundle impact:** Feedback code can be tree-shaken (eliminated by bundler)

### Partially Enabled

```tsx
// Only haptics (audio module can be tree-shaken)
<QuickNumberInput
  enableHaptics={true}
  enableAudioFeedback={false}
/>

// Only audio (haptics module can be tree-shaken)
<QuickNumberInput
  enableHaptics={false}
  enableAudioFeedback={true}
/>
```

## How Tree-Shaking Works

### 1. Conditional Imports

The `createFeedbackAdapters()` function uses conditional `require()` calls:

```typescript
export function createFeedbackAdapters(config: FeedbackConfig) {
  return {
    haptics: config.enableHaptics
      ? require('./haptics').createHapticAdapter()
      : null,
    audio: config.enableAudioFeedback
      ? require('./audio').createAudioAdapter()
      : null,
  };
}
```

### 2. Static Analysis

Modern bundlers (Webpack, Rollup, esbuild) can statically analyze:

```typescript
// If both are false (constant propagation):
const adapters = createFeedbackAdapters({
  enableHaptics: false,
  enableAudioFeedback: false,
});

// Bundler sees this simplifies to:
const adapters = { haptics: null, audio: null };

// Therefore, haptics.ts and audio.ts are never imported → tree-shaken!
```

### 3. Production Build

When you build with `NODE_ENV=production`, bundlers perform:

- **Dead code elimination** - Remove unreachable code
- **Tree-shaking** - Remove unused exports
- **Minification** - Compress remaining code

## Configuration Hooks

### `feedbackConfig` Prop

`CollapsibleNumberPicker` exposes a `feedbackConfig` prop so apps can tune sound & vibration without touching hooks:

```tsx
<CollapsibleNumberPicker
  label="Dial"
  value={5}
  onChange={setValue}
  feedbackConfig={{
    haptics: { pattern: [6, 2, 6] },
    audio: { waveform: 'sine', frequency: 660 },
    adapters: { audio: customAudio },
  }}
/>
```

### Adapter Options

- **Haptics** – `pattern` (number or array) passed directly to `navigator.vibrate`
- **Audio** – `frequency`, `waveform`, `attackMs`, `decayMs`, `durationMs`, `peakGain`
- **Adapter overrides** – Provide `audio`/`haptics` adapters to skip the built-in modules entirely.

## Module Details

### Haptics Module (`haptics.ts`)

- **Size:** ~0.5 KB minified
- **API:** `navigator.vibrate(pattern)` where `pattern` defaults to `[3, 2, 1]`
- **Fallback:** Gracefully degrades if Vibration API unsupported
- **Platforms:** Mobile browsers, some desktop browsers

### Audio Module (`audio.ts`)

- **Size:** ~1.5 KB minified
- **API:** Web Audio API with configurable waveform, frequency, and envelope
- **Fallback:** Gracefully degrades if Web Audio API unsupported
- **Autoplay:** Handles browser autoplay restrictions automatically

## Integration Example

### Custom Hook Using Adapters

```typescript
import { createFeedbackAdapters } from '@tensil/number-picker/quick/feedback';

function useCustomFeedback() {
  const adapters = useMemo(
    () =>
      createFeedbackAdapters({
        enableHaptics: userPreferences.haptics,
        enableAudioFeedback: userPreferences.audio,
      }),
    [userPreferences]
  );

  const playSuccess = useCallback(() => {
    adapters.haptics?.trigger();
    adapters.audio?.playConfirmation();
  }, [adapters]);

  useEffect(() => {
    return () => {
      adapters.audio?.cleanup();
      adapters.haptics?.cleanup();
    };
  }, [adapters]);

  return { playSuccess };
}
```

## Performance Notes

- **Lazy AudioContext:** Audio context is only created when first needed (avoids Chrome autoplay warnings)
- **Cleanup on Close:** Audio context is closed when picker closes to free resources
- **Debounced Haptics:** Duplicate vibrations are prevented during rapid scrolling
- **Memoized Adapters:** Adapters are only recreated when enable flags change

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Haptics (mobile) | ✅ | ✅ | ✅ | ✅ |
| Haptics (desktop) | ❌ | ❌ | ❌ | ❌ |
| Audio (all) | ✅ | ✅ | ✅ (webkit) | ✅ |

## Migration Guide

### Before (Monolithic)

```typescript
// All feedback code always loaded
const audioContextRef = useRef<AudioContext | null>(null);
// ... 100+ lines always in bundle
```

### After (Modular)

```typescript
// Feedback code only loaded when enabled
const adapters = createFeedbackAdapters({ enableHaptics, enableAudioFeedback });
// ... 0-2 KB depending on flags
```

## Debugging

To verify tree-shaking is working:

```bash
# Build production bundle
npm run build

# Analyze bundle (Webpack)
npx webpack-bundle-analyzer dist/stats.json

# Search for feedback code in bundle
grep -c "createHapticAdapter" dist/*.js
grep -c "createAudioAdapter" dist/*.js
```

If counts are 0, tree-shaking worked! ✅
