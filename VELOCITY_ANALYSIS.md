# 🔍 ULTRATHINK VELOCITY SYSTEM ANALYSIS

## Executive Summary

**CRITICAL FINDING**: Velocity-based momentum is **COMPLETELY DISABLED** for the most common mobile interaction pattern (touch-to-open-and-drag). This explains why fast scrolling feels the same as slow scrolling on phones.

---

## 🚨 CRITICAL ISSUES FOUND

### 1. **Single-Gesture Mode Kills Velocity** (SEVERITY: CRITICAL)

**Location:** `usePickerPhysics.ts:587`

```typescript
// CRITICAL: Disable flicking/momentum in single-gesture mode (touch-to-open-and-drag)
// Only multi-gesture (picker already open) should have momentum projection
const velocityForSettle = wasOpenOnPointerDownRef.current ? velocity : 0;

settleFromY(currentTranslate, velocityForSettle, () => finalize(hasMoved));
```

**What This Means:**
- ❌ **If picker is closed when you start dragging**: `velocity = 0` (NO MOMENTUM)
- ✅ **If picker is already open when you start dragging**: velocity is used

**Impact on Mobile:**
On mobile, users typically:
1. Tap on a closed number input
2. Immediately start dragging to scroll

This is "single-gesture mode" - and velocity is **FORCED TO ZERO** regardless of how fast you scroll.

**Why This Was Done:**
The comment suggests this was intentional to avoid unwanted flicking when opening the picker. But it completely breaks the UX expectation that "fast scroll = travel further".

**Reproduction:**
1. Open demo on mobile
2. Tap a closed picker and immediately drag fast
3. Result: Same distance as slow drag ❌

**Fix Priority:** 🔴 **HIGHEST** - This breaks the core UX

---

### 2. **Projection Time Too Conservative** (SEVERITY: HIGH)

**Location:** `config/physics.ts:94`

```typescript
rangeScaleIntensity: 0.12, // 120ms base projection
```

**Current Behavior:**
- Base projection: `0.12 seconds` = **120 milliseconds**
- With max boost (2.1x): `0.252 seconds` = **252 milliseconds**

**Example Calculation:**
```typescript
// Fast mobile swipe: 3000 px/s
// Current projection: 3000 * 0.12 = 360 pixels
// With 40px item height: 360 / 40 = 9 items

// Expected for "fast swipe": 20-30 items
// Actual: 9 items ❌
```

**Problem:**
Modern mobile UIs (iOS, Android) use 300-600ms projection times for momentum scrolling. Our 120ms feels sluggish and unresponsive.

**Industry Standards:**
- iOS UIScrollView: ~400-500ms deceleration
- Android RecyclerView: ~250-400ms fling duration
- Our implementation: 120-252ms ❌

---

### 3. **Velocity Tracker Window Too Small** (SEVERITY: MEDIUM)

**Location:** `velocityTracker.ts:50`

```typescript
const { sampleCount = 5, maxSampleAge = 100 } = config;
```

**Issues:**

**A. 100ms Sample Window:**
- Only keeps samples from last 100ms
- Problem: Touch events on mobile can have 16-33ms gaps (60fps - 30fps)
- With 100ms window, you might only capture 3-6 samples
- Not enough data for accurate velocity on slower devices

**B. First-Last Sample Calculation:**
```typescript
const first = recentSamples[0];
const last = recentSamples[recentSamples.length - 1];
const deltaPosition = last.position - first.position;
const deltaTime = (last.timestamp - first.timestamp) / 1000;
return deltaPosition / deltaTime;
```

**Problems:**
- Ignores intermediate samples (wasted data)
- Susceptible to outliers
- No smoothing/filtering

**Better Approach:**
Use linear regression over all samples for noise reduction:
```typescript
// Least squares fit: y = mx + b
// Slope (m) = velocity
```

---

### 4. **Velocity Boost Insufficient** (SEVERITY: MEDIUM)

**Location:** `config/physics.ts:96`

```typescript
rangeScaleVelocityBoost: 1.1, // up to 2.1x projection
```

**Current Formula:**
```typescript
// Max boost at velocityThreshold * 2 (600 px/s)
projectionSeconds *= 1 + normalized * 1.1;
// Max: 1 + 1.0 * 1.1 = 2.1x
```

**Problem:**
Mobile swipes can reach 5000-8000 px/s for "throw" gestures. But boost caps at 600 px/s (velocityThreshold * 2).

**Example:**
```typescript
// Slow swipe: 400 px/s → no boost → 0.12s projection
// Fast swipe: 600 px/s → full boost → 0.252s projection
// VERY fast swipe: 3000 px/s → still 0.252s projection ❌
```

There's no benefit to scrolling faster than 600 px/s!

---

### 5. **Wheel Scrolling Never Uses Velocity** (SEVERITY: INFO)

**Location:** `usePickerPhysics.ts:735`

```typescript
// Wheel scrolling should NEVER use momentum/flicking - always velocity = 0
const velocity = 0;
```

This is actually **correct** behavior for mouse wheels, but worth documenting since it differs from touch.

---

## 📊 VELOCITY FLOW ANALYSIS

### Current Data Flow

```
┌─────────────────────┐
│  Touch Start        │
│  velocityTracker    │
│  .reset()           │
│  .addSample(y)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Touch Move         │  (every 16ms on 60fps device)
│  velocityTracker    │
│  .addSample(y)      │  ← Only last 100ms kept (6 samples)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Touch End          │
│  velocity =         │
│  tracker.getVel()   │  ← (last.y - first.y) / deltaTime
└──────────┬──────────┘
           │
           ▼
      ┌───────┴───────┐
      │               │
      ▼               ▼
┌──────────┐    ┌──────────┐
│ Single-  │    │ Multi-   │
│ Gesture  │    │ Gesture  │
│ Mode     │    │ Mode     │
└────┬─────┘    └────┬─────┘
     │               │
     ▼               ▼
velocity = 0    velocity = actual
     │               │
     └───────┬───────┘
             ▼
    projectReleaseTranslate()
    projected = current + velocity * projectionSeconds
    (max: velocity * 0.252s)
             │
             ▼
    clamp to bounds & settle to index
```

### Issues in Flow

1. ❌ **Checkpoint 1**: Single-gesture mode zeros velocity
2. ⚠️ **Checkpoint 2**: Only 100ms of samples used
3. ⚠️ **Checkpoint 3**: Projection time too conservative (120ms)
4. ⚠️ **Checkpoint 4**: Velocity boost caps too early (600 px/s)

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Enable Velocity in Single-Gesture Mode (CRITICAL)

**Current:**
```typescript
const velocityForSettle = wasOpenOnPointerDownRef.current ? velocity : 0;
```

**Proposed Option A: Always Use Velocity**
```typescript
const velocityForSettle = velocity;
```

**Proposed Option B: Dampen Velocity in Single-Gesture**
```typescript
// Reduce velocity by 50% in single-gesture to prevent overshoot
const velocityForSettle = wasOpenOnPointerDownRef.current
  ? velocity
  : velocity * 0.5;
```

**Proposed Option C: Make It Configurable**
```typescript
interface Props {
  enableSingleGestureMomentum?: boolean; // default: true
}

const velocityForSettle = (wasOpenOnPointerDownRef.current || enableSingleGestureMomentum)
  ? velocity
  : 0;
```

**Recommendation:** **Option B** - Enables momentum but dampened to avoid surprising behavior.

---

### Fix 2: Increase Projection Time

**Current:**
```typescript
rangeScaleIntensity: 0.12, // 120ms
rangeScaleVelocityBoost: 1.1, // max 2.1x
```

**Proposed:**
```typescript
rangeScaleIntensity: 0.25, // 250ms base (mobile-friendly)
rangeScaleVelocityBoost: 2.0, // max 3.0x (750ms for fast swipes)
```

**Rationale:**
- 250ms base matches Android/iOS feel
- 3.0x boost allows up to 750ms for very fast swipes
- Still conservative enough to avoid wild overshooting

---

### Fix 3: Improve Velocity Tracker

**Current:**
```typescript
maxSampleAge: 100 // 100ms window
```

**Proposed:**
```typescript
maxSampleAge: 150 // 150ms window (better for slower devices)
```

**Also Add Linear Regression:**
```typescript
const getVelocity = (): number => {
  if (recentSamples.length < 2) return 0;

  // Use linear regression for smoother velocity
  const n = recentSamples.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  recentSamples.forEach((sample, i) => {
    const x = sample.timestamp;
    const y = sample.position;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope / 1000; // Convert ms to seconds
};
```

---

### Fix 4: Extend Velocity Boost Range

**Current:**
```typescript
velocityThreshold: 300, // Boost starts here
rangeScaleVelocityBoost: 1.1, // Caps at 600 px/s (threshold * 2)
```

**Proposed:**
```typescript
velocityThreshold: 500, // Higher threshold
rangeScaleVelocityBoost: 2.0, // Boost up to 1500 px/s (threshold * 3)
velocityBoostCap: 3, // Cap normalized value at 3x threshold
```

**Formula Update:**
```typescript
const overspeed = Math.max(0, Math.abs(limitedVelocity) - config.velocityThreshold);
const normalized = Math.min(
  overspeed / config.velocityThreshold,
  config.velocityBoostCap ?? 1 // Default to current behavior
);
projectionSeconds *= 1 + normalized * config.velocityBoost;
```

---

## 📈 BEFORE/AFTER COMPARISON

### Current Behavior (Broken)

| Scenario | Velocity Measured | Velocity Used | Projection | Items Traveled |
|----------|------------------|---------------|------------|---------------|
| Single-gesture slow | 500 px/s | **0** ❌ | 0ms | 0 |
| Single-gesture fast | 3000 px/s | **0** ❌ | 0ms | 0 |
| Multi-gesture slow | 500 px/s | 500 px/s | 120ms | 1.5 |
| Multi-gesture fast | 3000 px/s | 3000 px/s | 252ms | 18 |

### Proposed Behavior (Fixed)

| Scenario | Velocity Measured | Velocity Used | Projection | Items Traveled |
|----------|------------------|---------------|------------|---------------|
| Single-gesture slow | 500 px/s | 250 px/s ✅ | 250ms | 1.6 |
| Single-gesture fast | 3000 px/s | 1500 px/s ✅ | 750ms | 28 |
| Multi-gesture slow | 500 px/s | 500 px/s | 250ms | 3.1 |
| Multi-gesture fast | 3000 px/s | 3000 px/s | 750ms | 56 |

(Assuming 40px item height)

---

## 🧪 TESTING RECOMMENDATIONS

### Add Velocity Debug Logging

```typescript
debugPickerLog('VELOCITY CAPTURED', {
  measured: velocity,
  used: velocityForSettle,
  projectionTime: config.projectionSeconds,
  projectedDistance: velocity * config.projectionSeconds,
  estimatedItems: (velocity * config.projectionSeconds) / itemHeight,
  mode: wasOpenOnPointerDownRef.current ? 'multi-gesture' : 'single-gesture'
});
```

### Add Visual Velocity Indicator

Show velocity magnitude in demo:
```tsx
<div className="velocity-debug">
  Velocity: {velocity.toFixed(0)} px/s
  Projection: {(velocity * projectionTime).toFixed(0)}px
</div>
```

---

## 🎯 IMPLEMENTATION PRIORITY

1. **🔴 CRITICAL** - Fix single-gesture velocity zeroing (30 min)
2. **🟡 HIGH** - Increase projection time constants (5 min)
3. **🟡 HIGH** - Add velocity debug logging (15 min)
4. **🟢 MEDIUM** - Improve velocity tracker with linear regression (1 hour)
5. **🟢 MEDIUM** - Extend velocity boost range (30 min)

**Total Estimated Time:** 2.5 hours

**Impact:** Transforms mobile UX from "broken" to "best-in-class"

---

## 📝 CONCLUSION

The velocity system is **fundamentally sound** in its architecture, but has **critical configuration issues**:

1. ❌ **Completely disabled** for single-gesture mode
2. ⚠️ **Too conservative** projection times
3. ⚠️ **Too aggressive** sample filtering
4. ⚠️ **Too limited** velocity boost range

All issues are **easily fixable** with configuration and logic changes. No architectural refactoring needed.

**Recommended Approach:**
1. Start with Fix #1 (single-gesture velocity) - immediate UX improvement
2. Add debug logging to validate fixes
3. Tune projection times based on real device testing
4. Optionally improve velocity tracker for smoothness

This will make the picker feel as responsive as native iOS/Android controls.
