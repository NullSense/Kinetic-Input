# Kinetic Input Demo Site - Implementation Plan

**Package Name:** `@tensil/kinetic-input`
**Demo URL:** TBD (Vercel)
**Design System:** `/design-system/DESIGN_SYSTEM_V2.4.md`
**Status:** 🟡 In Progress

---

## ✅ Completed

### Core Setup
- [x] Next.js 15 project scaffolding
- [x] Tailwind config with design system colors
- [x] Global CSS with design tokens
- [x] Haptics Indicator component (fully functional!)
- [x] TypeScript configuration
- [x] Package.json with dependencies

### Components Built
- [x] `HapticsIndicator.tsx` - Live haptics detection with:
  - Real-time browser API detection
  - Expandable info panel
  - Test haptics button
  - Reduced motion support
  - Design system compliant (Cyber-Editorial Brutalism)

---

## 🚧 Next Steps - Priority Order

### Phase 1: Core Pages (Est: 3-4 hours)

#### 1.1 Create Root Layout
**File:** `app/layout.tsx`

```tsx
import './globals.css'
import { HapticsIndicator } from '@/components/HapticsIndicator'
import { Navigation } from '@/components/Navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Anta&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <HapticsIndicator />
      </body>
    </html>
  )
}
```

#### 1.2 Build Navigation Component
**File:** `components/Navigation.tsx`

**Design specs:**
- Fixed header, 80px height (desktop)
- Logo: "KINETIC INPUT" in Anta font
- Nav links: Components | Presets | Playground | Docs
- GitHub star button (right side)
- Hairline bottom border (#15181B)
- Subtle hover states (#3EDCFF glow)

```tsx
// Pseudo-code structure:
<nav className="fixed top-0 w-full h-20 border-b border-hairline bg-bg/95 backdrop-blur-sm z-dropdown">
  <div className="container mx-auto px-6x flex items-center justify-between h-full">
    <div className="font-display text-xl tracking-wide">KINETIC INPUT</div>

    <div className="flex gap-8x text-sm font-sans">
      <Link href="/components" className="hover-accent">COMPONENTS</Link>
      <Link href="/presets" className="hover-accent">PRESETS</Link>
      <Link href="/playground" className="hover-accent">PLAYGROUND</Link>
      <Link href="/docs" className="hover-accent">DOCS</Link>
    </div>

    <GitHubStarButton />
  </div>
</nav>
```

#### 1.3 Hero Section (Homepage)
**File:** `app/page.tsx`

**Design:**
- Full viewport height
- Centered CollapsibleNumberPicker (large scale)
- Headline: "Physics-Based Input for React" (Anta, 4xl)
- Subheadline: "Momentum pickers that feel natural" (Archivo, muted)
- Stats row: "94% Coverage" | "10ms Budget" | "53 Tests" (Geist Mono)
- Smooth scroll indicator (animated ▼)

**Key Features:**
- Picker connects to scroll position (advanced: scroll → picker value sync)
- Subtle parallax on headline
- Staggered fade-in for stats (50ms delay each)

```tsx
export default function HomePage() {
  const [weight, setWeight] = useState(70);

  return (
    <section className="h-screen flex flex-col items-center justify-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-6xl mb-4x"
      >
        PHYSICS-BASED INPUT
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted text-xl mb-8x"
      >
        Momentum pickers that feel natural
      </motion.p>

      <CollapsibleNumberPicker
        label="Weight"
        value={weight}
        onChange={setWeight}
        unit="kg"
        min={40}
        max={200}
        step={0.5}
        theme={{
          selectedColor: '#3EDCFF',
          highlightBorderColor: '#3EDCFF',
        }}
      />

      <motion.div className="flex gap-6x mt-8x font-mono text-sm">
        <Stat label="Coverage" value="94%" />
        <Stat label="Frame Budget" value="10ms" />
        <Stat label="Tests" value="53" />
      </motion.div>
    </section>
  );
}
```

---

### Phase 2: Component Showcase Pages (Est: 4-5 hours)

#### 2.1 Components Index Page
**File:** `app/components/page.tsx`

**Layout:**
- 3-column grid (desktop), 1-column (mobile)
- Cards for each component type
- Live mini demo in each card
- "View Examples" CTA button

**Cards:**
1. CollapsibleNumberPicker
2. StandaloneWheelPicker
3. PickerGroup

```tsx
const components = [
  {
    name: 'CollapsibleNumberPicker',
    description: 'Inline input that expands to modal picker',
    demo: <CollapsibleNumberPicker ... />,
    link: '/components/collapsible'
  },
  {
    name: 'StandaloneWheelPicker',
    description: 'Standalone wheel picker without chrome',
    demo: <StandaloneWheelPicker ... />,
    link: '/components/wheel'
  },
  {
    name: 'PickerGroup',
    description: 'Low-level multi-column primitive',
    demo: <PickerGroup.Column ... />,
    link: '/components/group'
  },
];

return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4x p-6x">
    {components.map(comp => (
      <ComponentCard key={comp.name} {...comp} />
    ))}
  </div>
);
```

#### 2.2 CollapsibleNumberPicker Examples
**File:** `app/components/collapsible/page.tsx`

**Examples (8 total):**

1. **Default** - Clean, no customization
2. **Dark Accent** - Custom accent color (#8E77B5)
3. **Decimal Precision** - step={0.01}, 2 decimal places
4. **Large Range** - min={0}, max={10000}, shows virtualization
5. **Snap Physics** - enableSnapPhysics={true}, magnetic feel
6. **Fast Timing** - timingPreset="fast", quick close
7. **Custom Render** - renderItem with emojis
8. **Haptic Feedback** - enableHaptics={true} (when supported)

**Layout per example:**
```
┌──────────────────────────────────────┐
│  Example Name (Anta)                 │
│  ────────────────────────────────    │
│                                      │
│  [Live Demo Component]               │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Configuration Panel           │ │
│  │  • Theme: [Dropdown]           │ │
│  │  • Timing: [Fast/Balanced/Slow]│ │
│  │  • Snap Physics: [Toggle]      │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Code (collapsible)            │ │
│  │  [Syntax highlighted TSX]      │ │
│  │  [Copy Button]                 │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

### Phase 3: Preset Gallery (Est: 3 hours)

#### 3.1 Presets Page
**File:** `app/presets/page.tsx`

**Presets (8 total):**

```typescript
const presets = [
  {
    name: 'iOS Native',
    description: 'Apple-style picker aesthetics',
    theme: {
      selectedColor: '#007AFF',
      highlightBorderColor: '#007AFF',
      fontSize: '17px',
      fontFamily: '-apple-system',
    },
    timing: 'balanced',
  },
  {
    name: 'Material Design',
    description: 'Google Material 3 style',
    theme: {
      selectedColor: '#6750A4',
      highlightBorderColor: '#6750A4',
      highlightFillColor: 'rgba(103,80,164,0.12)',
    },
    timing: 'balanced',
  },
  {
    name: 'Neumorphism',
    description: 'Soft UI with depth',
    theme: {
      // Soft shadows, muted colors
      selectedColor: '#9DB1BE',
      highlightBorderColor: '#9DB1BE',
    },
    timing: 'slow',
  },
  {
    name: 'Vaporwave',
    description: '80s aesthetic with gradients',
    theme: {
      selectedColor: '#FF6FF2',
      highlightBorderColor: '#FF6FF2',
      activeTextColor: '#00F0FF',
    },
    timing: 'fast',
  },
  {
    name: 'High Contrast',
    description: 'Accessibility-focused',
    theme: {
      textColor: '#FFFFFF',
      selectedColor: '#FFFF00',
      highlightBorderColor: '#FFFF00',
    },
    timing: 'slow',
  },
  {
    name: 'Monochrome',
    description: 'Black & white minimalism',
    theme: {
      textColor: '#000000',
      selectedColor: '#000000',
      highlightBorderColor: '#000000',
      backdropColor: 'rgba(255,255,255,0.95)',
    },
    timing: 'balanced',
  },
  {
    name: 'RGB Gaming',
    description: 'Colorful with glow effects',
    theme: {
      selectedColor: '#00FF41',
      highlightBorderColor: '#00FF41',
      highlightFillColor: 'rgba(0,255,65,0.2)',
    },
    timing: 'fast',
  },
  {
    name: 'Professional',
    description: 'Business app aesthetic',
    theme: {
      textColor: '#1F2937',
      selectedColor: '#3B82F6',
      highlightBorderColor: '#3B82F6',
      backdropColor: 'rgba(255,255,255,0.98)',
    },
    timing: 'balanced',
  },
];
```

**Grid Layout:**
- 2x4 grid (desktop), 1-column (mobile)
- Auto-playing demo (cycles through values)
- "Apply Theme" button
- "Customize" button (opens playground with preset)

---

### Phase 4: Live Playground (Est: 5-6 hours)

#### 4.1 Playground Structure
**File:** `app/playground/page.tsx`

**Features:**
- Split screen: Code editor (left 50%) | Live preview (right 50%)
- Props configuration panel (collapsible sidebar)
- Theme builder (visual color pickers)
- Share URL (encode state in query params)
- Export options (CodeSandbox, StackBlitz, Download)

**Tech Stack:**
- Code editor: `@monaco-editor/react` OR `react-simple-code-editor` (lighter)
- Syntax highlighting: `prism-react-renderer`
- URL state: `next/navigation` useSearchParams

**Layout:**
```tsx
<div className="h-screen flex">
  {/* Left: Code Editor */}
  <div className="w-1/2 border-r border-hairline">
    <CodeEditor
      value={code}
      onChange={setCode}
      language="typescript"
      theme="vs-dark"
    />
  </div>

  {/* Right: Live Preview */}
  <div className="w-1/2 flex items-center justify-center bg-bg">
    <LivePreview code={code} />
  </div>

  {/* Bottom: Controls */}
  <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-hairline bg-bg/95">
    <div className="flex items-center justify-between px-4x h-full">
      <div className="flex gap-2x">
        <button onClick={handleReset}>RESET</button>
        <button onClick={handleShare}>SHARE URL</button>
        <button onClick={handleExport}>EXPORT</button>
      </div>
      <FPSCounter />
    </div>
  </div>
</div>
```

#### 4.2 URL State Management
```typescript
// Encode/decode playground state
const encodeState = (state: PlaygroundState) => {
  return btoa(JSON.stringify(state));
};

const decodeState = (encoded: string) => {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return defaultState;
  }
};

// In component:
const searchParams = useSearchParams();
const router = useRouter();

const shareURL = () => {
  const encoded = encodeState(playgroundState);
  const url = `${window.location.origin}/playground?state=${encoded}`;
  navigator.clipboard.writeText(url);
  toast.success('URL copied!');
};
```

---

### Phase 5: Performance Dashboard (Est: 2 hours)

#### 5.1 FPS Counter Component
**File:** `components/FPSCounter.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export function FPSCounter() {
  const [fps, setFPS] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFPS(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }, []);

  const color = fps >= 55 ? 'text-success' : fps >= 30 ? 'text-warning' : 'text-danger';

  return (
    <div className={`font-mono text-xs ${color}`}>
      {fps} FPS
    </div>
  );
}
```

#### 5.2 Performance Stats Panel
**File:** `components/PerformanceStats.tsx`

Shows:
- Current FPS (live)
- Frame time graph (last 60 frames)
- Bundle size comparison
- Animation frame budget meter
- "Run Benchmark" button

---

### Phase 6: Documentation (Est: 2 hours)

#### 6.1 Docs Page
**File:** `app/docs/page.tsx`

**Sections:**
1. **Quick Start** - Installation, basic usage
2. **Components** - API reference for each component
3. **Props Reference** - Full props table with types
4. **Theming** - Theme object structure, examples
5. **Timing Presets** - Explanation of fast/balanced/slow
6. **Snap Physics** - How magnetic snapping works
7. **Accessibility** - Keyboard nav, ARIA, reduced motion
8. **Examples** - Copy-paste ready code snippets

**Layout:**
- Left sidebar: Section navigation (sticky)
- Main content: Markdown-style docs
- Right sidebar: "On this page" links (auto-generated from headings)

---

## 🎨 Design System Compliance Checklist

### Colors
- [x] Use CSS variables from design system
- [x] No hardcoded hex values (except in theme presets)
- [x] Gradients only for data viz (avoid decorative gradients)

### Typography
- [x] Anta for headings/display
- [x] Archivo for UI/body text
- [x] Geist Mono for data/code
- [ ] Uppercase for section titles (e.g., "/ COMPONENTS")

### Animations
- [x] Max 200ms for UI transitions
- [x] Respect prefers-reduced-motion
- [x] Use design system easing curves
- [ ] No bounce/spring effects (except where documented)

### Components
- [ ] All overlays use design system z-index scale
- [ ] Focus indicators use --accent (#3EDCFF)
- [ ] Interactive targets ≥44px
- [ ] Hairline dividers use #15181B

---

## 📦 Deployment Checklist

### Pre-Deploy
- [ ] Install all dependencies: `npm install`
- [ ] Build successfully: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Test on mobile device (haptics!)
- [ ] Test with reduced motion enabled
- [ ] Verify all fonts load correctly

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Environment variables: None needed (public site)
5. Deploy!

**vercel.json** (optional optimizations):
```json
{
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd apps/kinetic-demo
npm install

# Run dev server
npm run dev

# Visit http://localhost:3001

# Build for production
npm run build
npm start
```

---

## 📝 Notes & Gotchas

### Haptics
- Only works on mobile devices with Vibration API
- iOS Safari requires user gesture before enabling
- Desktop browsers will show "NO HAPTICS" - this is expected!

### Fonts
- Anta, Archivo loaded from Google Fonts
- Geist Mono loaded separately (add to head)
- Fallbacks defined in Tailwind config

### Performance
- Keep FPS ≥55 during picker interactions
- Use `transform` and `opacity` only (no layout animations)
- Profile with Chrome DevTools before shipping

### Accessibility
- Test keyboard navigation (Tab, Enter, Escape)
- Verify focus indicators visible
- Test with screen reader
- Provide text alternatives for color-coded states

---

## 🎯 Success Criteria

A successful demo site should:
1. ✅ Show haptics support status immediately
2. ✅ Run at 60 FPS on mid-range devices
3. ✅ Work on mobile (haptics!) and desktop
4. ✅ Follow design system (Cyber-Editorial Brutalism)
5. ✅ Provide copy-paste ready code examples
6. ✅ Support URL sharing from playground
7. ✅ Load in <2 seconds on 3G
8. ✅ Respect user accessibility preferences

---

**Version:** 0.1.0
**Last Updated:** 2025-11-13
**Next Review:** After Phase 1 completion
