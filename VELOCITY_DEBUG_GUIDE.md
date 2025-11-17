# 🔍 Velocity Momentum Debugging Guide

## Problem Statement

**User Report:** "Even in multi mode, say I start with the row in the middle of the screen then swipe to the top of my screen slowly, then do the same fast, the amount of numbers I'll have scrubbed will be identical."

This indicates velocity momentum is NOT working even in multi-gesture mode (picker already open).

---

## 🛠️ Debugging Tools Added

I've added comprehensive debug logging throughout the ENTIRE velocity hot chain so we can see exactly where it's breaking.

### Enable Debug Logging

```javascript
// In browser console:
window.__QNI_PICKER_DEBUG__ = true;
location.reload();
```

Now when you swipe, you'll see detailed logs showing every step of the velocity calculation and momentum projection.

---

## 📊 What to Look For

When you swipe on the picker, you should see logs in this order:

### 1. VELOCITY CALCULATED
```
[PickerPhysics] VELOCITY CALCULATED {
  sampleCount: 8,           ← Should be 6-8 samples
  timeSpan: "147ms",        ← Time span of gesture
  positionDelta: "441.2px", ← Total finger movement
  slope: "3.001 px/ms",     ← Calculated slope
  velocity: "3001.0 px/s",  ← Final velocity (KEY!)
  samples: [...]            ← All samples used
}
```

**Check:**
- ✅ velocity should be 200-5000 px/s for typical swipes
- ❌ If velocity = 0, velocity tracker isn't working
- ❌ If sampleCount < 2, not enough samples captured

### 2. VELOCITY (from handlePointerUp)
```
[PickerPhysics] VELOCITY {
  measured: "3001 px/s",         ← Raw velocity from tracker
  used: "3001 px/s",             ← After damping (multi = 100%, single = 60%)
  mode: "multi-gesture",         ← Should be "multi-gesture" when already open
  damping: 1.0                   ← 1.0 = full velocity, 0.6 = damped
}
```

**Check:**
- ✅ measured should match velocity from VELOCITY CALCULATED
- ✅ used should equal measured in multi-gesture mode
- ❌ If used = 0, velocity is being zeroed somewhere
- ❌ If mode = "single-gesture" when picker was already open, state is wrong

### 3. PROJECT RELEASE START
```
[PickerPhysics] PROJECT RELEASE START {
  currentTranslate: "120.0",     ← Current scroll position
  velocity: "3001.0 px/s",       ← Velocity being used
  projectionSeconds: 0.25,       ← Time to project (should be 0.25)
  velocityCap: 5000,             ← Max velocity allowed
  velocityThreshold: 500,        ← Threshold for boost
  velocityBoost: 2.0             ← Boost multiplier
}
```

**Check:**
- ✅ projectionSeconds should be 0.25 (250ms)
- ❌ If projectionSeconds = 0 or undefined, **THIS IS THE BUG**
- ✅ velocity should match from previous step
- ❌ If this log is missing, projectReleaseTranslate isn't being called

### 4. PROJECT RELEASE SKIPPED (Should NOT appear!)
```
[PickerPhysics] PROJECT RELEASE SKIPPED {
  reason: "projectionSeconds is falsy"  ← OR "velocity is zero"
  projectionSeconds: 0,                  ← Actual value
  velocity: 3001
}
```

**If you see this:**
- ❌ **CRITICAL BUG** - Projection is being skipped!
- If reason = "projectionSeconds is falsy", the config is broken
- If reason = "velocity is zero", velocity isn't being passed correctly

### 5. VELOCITY BOOST APPLIED (For velocities > 500 px/s)
```
[PickerPhysics] VELOCITY BOOST APPLIED {
  overspeed: "2501.0",           ← Velocity above threshold
  normalized: "1.00",            ← Boost factor (0-1)
  baseProjection: 0.25,          ← Original projection time
  boostedProjection: "0.750",    ← Final projection time (up to 3x)
  boostMultiplier: "3.00x"       ← Applied multiplier
}
```

**Check:**
- ✅ Fast swipes (>500 px/s) should get 1.0-3.0x boost
- ✅ boostedProjection should be 0.25-0.75 seconds
- ❌ If this log is missing for fast swipes, boost logic isn't working

### 6. PROJECT RELEASE RESULT
```
[PickerPhysics] PROJECT RELEASE RESULT {
  input: "120.0",                ← Starting position
  velocity: "3001.0 px/s",       ← Velocity used
  projection: "0.750s",          ← Time to coast
  delta: "2250.8px",             ← Distance to project (KEY!)
  projected: "2370.8",           ← Final position
  clamped: "2370.8",             ← After boundary clamping
  wasClamped: false              ← true if hit min/max
}
```

**Check:**
- ✅ delta should be large for fast swipes (1000-3000px)
- ✅ delta should be small for slow swipes (50-300px)
- ❌ If delta is always similar regardless of velocity, **VELOCITY ISN'T SCALING**
- ❌ If wasClamped = true often, might be hitting boundaries (increase list size)

---

## 🧪 Test It

### Scenario 1: Slow Swipe (Multi-Gesture)
1. **Open the picker** (tap it so it's already expanded)
2. **Drag slowly** from middle to top (1 second duration)
3. **Release**
4. **Check console logs:**
   - velocity should be ~200-600 px/s
   - delta should be ~50-150px
   - Should scroll ~1-4 extra items after release

### Scenario 2: Fast Swipe (Multi-Gesture)
1. **Picker already open** (from previous step)
2. **Flick fast** from middle to top (0.1 second duration)
3. **Release**
4. **Check console logs:**
   - velocity should be ~2000-4000 px/s
   - delta should be ~1500-3000px
   - Should scroll ~40-75 extra items after release

### Expected Difference
- Fast swipe should travel **10-20x further** than slow swipe
- If they travel the same distance, **velocity isn't working**

---

## 🐛 Common Issues to Look For

### Issue 1: "PROJECT RELEASE SKIPPED - projectionSeconds is falsy"
**Cause:** `mergedSnapConfig.rangeScaleIntensity` is 0 or undefined

**Fix:** Check if component is passing `snapConfig` prop that overrides defaults:
```typescript
// BAD - user override zeroing it out
<CollapsibleNumberPicker snapConfig={{ rangeScaleIntensity: 0 }} />

// GOOD - use defaults
<CollapsibleNumberPicker />
```

### Issue 2: "PROJECT RELEASE SKIPPED - velocity is zero"
**Cause:** Velocity tracker isn't capturing samples or calculating correctly

**Debug:**
- Look for "VELOCITY CALCULATED" log - is it present?
- Check sampleCount - should be 6-8
- Check timeSpan - should be ~100-150ms
- If missing, velocity tracker isn't being called

### Issue 3: Velocity calculated but delta is always small
**Cause:** projectionSeconds is too small, or velocity boost isn't working

**Debug:**
- Check boostedProjection value - should be 0.25-0.75
- Check if VELOCITY BOOST APPLIED appears for fast swipes
- If boost isn't applying, check velocityThreshold and velocityBoost in config

### Issue 4: Delta is correct but items don't scroll
**Cause:** Issue in settleToIndex or animation system

**Debug:**
- Check if projected position is being converted to correct index
- Check if animate() is being called
- Check if animation is being interrupted

---

## 🧪 Run the Test

I added a test specifically for this issue:

```bash
cd packages/number-picker
npm test -- usePickerPhysics.velocity.test.tsx
```

Look for: `multi-gesture mode: fast swipe projects further than slow swipe`

**If test PASSES:** Code is correct, might be a config override issue
**If test FAILS:** There's a bug in the velocity chain logic

---

## 📝 Report Your Findings

After testing, report what you see:

1. **Do the logs appear?**
   - Yes/No

2. **Slow swipe velocity:**
   - Value: ___ px/s
   - Delta: ___ px
   - Items scrolled: ___

3. **Fast swipe velocity:**
   - Value: ___ px/s
   - Delta: ___ px
   - Items scrolled: ___

4. **Are they different?**
   - Yes/No

5. **Any "SKIPPED" logs?**
   - Yes/No - reason: ___

6. **Test result:**
   - Pass/Fail

This will help me pinpoint the EXACT issue in the hot chain!

---

## 🔧 Quick Fixes to Try

### If projectionSeconds is 0:
```typescript
// Add to component:
<CollapsibleNumberPicker
  snapConfig={{
    rangeScaleIntensity: 0.25,  // Force 250ms projection
    rangeScaleVelocityBoost: 2.0, // Force boost
    velocityThreshold: 500,
  }}
/>
```

### If velocity is always 0:
Check if there's code disabling velocity somewhere in the component tree.

### If delta is too small:
Increase projection time:
```typescript
snapConfig={{
  rangeScaleIntensity: 0.5,  // 500ms instead of 250ms
}}
```

---

## Expected Full Log Sequence (Fast Swipe)

```
[PickerPhysics] VELOCITY CALCULATED {
  sampleCount: 8,
  velocity: "2847.0 px/s"  ← Good!
}

[PickerPhysics] VELOCITY {
  measured: "2847 px/s",
  used: "2847 px/s",       ← Full velocity (multi-gesture)
  mode: "multi-gesture"
}

[PickerPhysics] PROJECT RELEASE START {
  velocity: "2847.0 px/s",
  projectionSeconds: 0.25  ← Good!
}

[PickerPhysics] VELOCITY BOOST APPLIED {
  boostedProjection: "0.683",  ← 2.73x boost
  boostMultiplier: "2.73x"
}

[PickerPhysics] PROJECT RELEASE RESULT {
  delta: "1944.3px",       ← Large delta!
  projected: "2064.3"
}
```

**Result:** Should scroll ~48 items (1944px / 40px per item)

---

## Next Steps After Testing

Once you report the logs, I'll:
1. Identify the exact breaking point in the chain
2. Fix the specific issue
3. Verify with the test
4. Push the fix

The comprehensive logging will show us EXACTLY where velocity is being lost! 🎯
