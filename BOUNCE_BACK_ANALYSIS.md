# ULTRATHINK: Bounce-Back Bug Root Cause Analysis

## Executive Summary

**ROOT CAUSE FOUND:** Friction momentum passes `velocity` to spring snap, causing overshoot and bounce. Non-flick path does NOT pass velocity to spring, which is why it feels smooth.

---

## The Bug

When flicking, the animation:
1. ✅ Starts traveling in correct direction (friction phase working)
2. ❌ Then "snaps back weirdly springy" (spring phase with velocity parameter)

User expectation: "Same animations as when we *don't* flick, just traveling longer and faster"

---

## Code Path Comparison

### NON-FLICK Path (Slow Drag-Release) - WORKS CORRECTLY ✅

```
handlePointerUp()
  → velocity ≈ 0 - 200 px/s (slow)
  → settleFromY(currentY, velocity, callback)
    → if (Math.abs(velocity) < 10)
      → settleToIndex(nearestIndex, callback)
        → animate(yRaw, target, {
            type: 'spring',
            stiffness: 300,
            damping: 34,
            // NO VELOCITY PARAMETER! ← Smooth animation
          })
```

**Result:** Smooth spring animation with no velocity, no overshoot, no bounce

---

### FLICK Path (Fast Swipe) - BROKEN ❌

```
handlePointerUp()
  → velocity = 500 - 3000 px/s (fast)
  → settleFromY(currentY, velocity, callback)
    → if (Math.abs(velocity) >= 10)
      → animateMomentumWithFriction({
          initialVelocity: velocity,
          onComplete: ...
        })

        ┌─ Friction Phase (WORKS ✅)
        │  velocity *= 0.998^dt per frame
        │  position updates naturally
        │  Decelerates smoothly (prize wheel feel)
        │
        └─ Snap Phase (BROKEN ❌)
           transitionToSnap()
             → snapTarget = snapFunction(currentPos)
             → animate(control, snapTarget, {
                 type: 'spring',
                 velocity: velocity, // ← BUG! Still has velocity!
                 stiffness: 300,
                 damping: 34,
               })
```

**Result:** Spring with initial velocity overshoots target, bounces back

---

## The Problem in Detail

### Scenario: Flick Downward

1. **Start:** User at item 20 (-800px), flicks down
2. **Input:** velocity = +2000 px/s (downward)
3. **Friction Phase:**
   - Position moves from -800 to -400 (traveling downward)
   - Velocity decays: +2000 → +500 → +100 → +50 px/s
4. **Transition to Snap:** When velocity < 50 px/s
   - Current position: -405px
   - Current velocity: +45 px/s (still downward!)
   - Snap target calculated: nearest item at -400px (upward from current)
5. **Spring Animation:**
   - Starts at -405px
   - Targets -400px (needs to move upward)
   - Initial velocity: +45 px/s (moving downward!)
6. **Result:**
   - Spring tries to move upward to -400
   - But initial velocity pushes downward
   - Overshoots to -410
   - Spring pulls back to -400
   - **BOUNCE!** ❌

### Additional Issue: Distance Threshold

The `shouldSnap()` function has two conditions:

```typescript
if (absVelocity < 50) return { should: true };
if (distanceToSnap < 5) return { should: true }; // ← Can trigger while velocity is HIGH!
```

If we're at position -400.3 and snap target is -400 (distance 0.3px < 5px), we transition to snap even if velocity is 500 px/s! Passing that to spring causes major overshoot.

---

## Why Non-Flick Works

`settleToIndex()` at line 327-332:

```typescript
const controls = animate(yRaw, target, {
  type: 'spring',
  stiffness: 300,
  damping: 34,
  restDelta: 0.5,
  restSpeed: 10,
  // NO velocity parameter - spring starts from 0 velocity
});
```

**The spring always starts with 0 velocity, so it smoothly animates to target without overshoot.**

---

## The Fix

### Solution 1: Don't Pass Velocity to Spring (RECOMMENDED) ✅

Match the non-flick behavior - let spring start with 0 velocity:

```typescript
// IN frictionMomentum.ts transitionToSnap():
springControls = animate(control, snapTarget, {
  type: 'spring',
  // velocity: velocity,  ← REMOVE THIS
  ...snapSpring,
});
```

**Why this works:**
- Friction phase provides the "travel longer and faster" for flicks
- Snap phase is just the final settle, should be smooth and consistent
- Matches iOS behavior and user expectation
- No overshoot, no bounce

### Solution 2: Only Pass Velocity If It Helps (COMPLEX)

Check if velocity is in the right direction:

```typescript
const directionToTarget = snapTarget - currentPos;
const velocityHelps = (directionToTarget > 0 && velocity > 0) ||
                      (directionToTarget < 0 && velocity < 0);

springControls = animate(control, snapTarget, {
  type: 'spring',
  velocity: velocityHelps ? velocity : 0,
  ...snapSpring,
});
```

**Problem:** Still complex, and even if velocity is in right direction, it can overshoot.

---

## Recommendation

**Implement Solution 1** - Remove `velocity` parameter from spring snap.

**Rationale:**
1. Simple, clean fix
2. Matches non-flick behavior exactly
3. User explicitly wants "same animations as when we don't flick"
4. Friction phase already provides the momentum feel
5. Snap phase should just be final settle

**Expected Behavior After Fix:**
- Fast flick: Friction phase travels far, smooth snap at end ✅
- Slow drag: Immediate smooth snap ✅
- Both feel consistent and smooth ✅

---

## Test Cases After Fix

1. **Fast flick downward** - Should travel far, settle smoothly (no bounce)
2. **Fast flick upward** - Should travel far, settle smoothly (no bounce)
3. **Medium flick** - Should travel medium distance, settle smoothly
4. **Slow drag** - Should settle immediately and smoothly (no change)
5. **Flick to boundary** - Should stop at boundary, snap to last item smoothly

All should have consistent, smooth snap animation at the end.
