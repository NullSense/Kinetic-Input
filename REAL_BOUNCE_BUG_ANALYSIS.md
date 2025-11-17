# ULTRATHINK: The REAL Bounce-Back Bug

## The Problem

User says: "we still when flicking go past some point then go back, it should smoothly just keep going and decelerate"

This means: The animation is NOT smoothly decelerating. It's going forward, then BACKWARDS. This is wrong.

## Root Cause: Premature Snap Transition

Found in `frictionMomentum.ts:175-191`:

```typescript
const shouldSnap = (currentPos, currentVelocity) => {
  const absVelocity = Math.abs(currentVelocity);

  // Check 1: Velocity threshold
  if (absVelocity < config.snapVelocityThreshold) {  // 50 px/s
    return { should: true, reason: 'velocity threshold' };
  }

  // Check 2: Distance threshold ← THE BUG!
  const snapTarget = snapFunction(currentPos);
  const distanceToSnap = Math.abs(currentPos - snapTarget);
  if (distanceToSnap < config.snapDistanceThreshold) {  // 5px
    return { should: true, reason: 'distance threshold' };
  }

  return { should: false };
};
```

## The Bug Scenario

### Frame-by-Frame Analysis

```
Frame 1:
  Position: -1203px
  Velocity: -800 px/s (FAST! moving upward)
  Nearest snap target: -1200px
  Distance to snap: |-1203 - (-1200)| = 3px

  Check: distance (3px) < threshold (5px) → TRUE
  Result: SNAP TRIGGERED! ❌

  Problem: We're moving FAST (-800 px/s) but we trigger snap
           because we happen to be near a snap point!

Frame 2 (Spring starts):
  Spring target: -1200px (upward from current)
  Momentum wants to continue to: -1400px (downward)
  Spring says: "Go to -1200"
  Momentum says: "Keep going to -1400"

  Result: CONFLICT → Goes past -1200, springs back → BOUNCE!
```

## Why This Happens

The distance threshold check (line 186) is checking distance to snap target **every frame**, even when velocity is HIGH.

**Intended purpose**: Prevent "slow crawl" when very close to snap point
**Actual behavior**: Triggers snap when passing near ANY snap point, regardless of velocity

## Visual Diagram

```
Snap points:    -1240    -1200    -1160    -1120
                  │        │        │        │
Position:              -1203 ← You are here
Velocity:         ←──────────────── -800 px/s (moving left/upward)

Distance threshold: 5px radius around each snap point
                           [5px]
                  │    ╱───┼───╲   │        │
                  │   -1205  -1195  │        │
                           ↑
                      YOU'RE IN THE DANGER ZONE!

Even though you're moving FAST, the distance check triggers:
  distance = 3px < 5px → SNAP!

Spring tries to pull you back to -1200
But momentum wants you to go to -1400
Result: "go past some point then go back" ← THE BUG
```

## Why iOS Doesn't Have This Problem

iOS scroll physics:
1. Runs friction until velocity ≈ 0
2. **Then** snaps to nearest content offset
3. No "distance threshold" during momentum

Our code:
1. Runs friction
2. **Checks distance threshold every frame** ← BUG
3. Triggers snap while still moving fast
4. Creates conflict

## The Solution

### Option 1: Remove Distance Threshold Entirely (RECOMMENDED)

```typescript
const shouldSnap = (currentPos, currentVelocity) => {
  const absVelocity = Math.abs(currentVelocity);

  // Only snap when velocity is low
  if (absVelocity < config.snapVelocityThreshold) {
    return { should: true, reason: 'velocity threshold' };
  }

  // REMOVE distance threshold check - it causes premature snapping
  return { should: false };
};
```

**Why this works:**
- Friction runs completely until velocity < 50 px/s
- Only then do we transition to snap
- No premature snapping while moving fast
- Smooth continuous deceleration

### Option 2: Only Check Distance When Velocity Is Already Low

```typescript
const shouldSnap = (currentPos, currentVelocity) => {
  const absVelocity = Math.abs(currentVelocity);

  // Snap when velocity is low
  if (absVelocity < config.snapVelocityThreshold) {
    return { should: true, reason: 'velocity threshold' };
  }

  // ONLY check distance if velocity is already moderate
  // This prevents "slow crawl" without causing premature snapping
  if (absVelocity < config.snapVelocityThreshold * 2) {  // < 100 px/s
    const snapTarget = snapFunction(currentPos);
    const distanceToSnap = Math.abs(currentPos - snapTarget);
    if (distanceToSnap < config.snapDistanceThreshold) {
      return { should: true, reason: 'distance threshold (low velocity)' };
    }
  }

  return { should: false };
};
```

## Do We Even Need Spring?

User asked: "do we even need spring here?"

**Analysis:**

### Current Approach (Two-Phase)
1. **Friction phase**: Decelerate with exponential decay
2. **Spring phase**: Animate to nearest snap point

### iOS Approach (One-Phase + Snap)
1. **Friction phase**: Decelerate completely to ~0 velocity
2. **Instant snap**: Set position to nearest content offset (no animation)

### Recommendation: Keep Spring BUT Simplify

The spring is useful for the final settle, BUT we should:
1. Let friction run almost completely (velocity < 10 px/s instead of 50)
2. Then spring to nearest item with very short duration
3. Result: Friction does 95% of the work, spring does final 5%

OR, even better:
1. Let friction run until velocity < 1 px/s
2. Instantly snap to nearest item (no spring)
3. Result: Pure friction feel, instant final snap

## Summary

**The bug:** Distance threshold (5px) triggers snap while velocity is still high (-800 px/s), causing spring to fight against momentum → bounce-back

**The fix:** Remove distance threshold OR only apply when velocity is already low

**The principle:** Let friction run its course. Don't interrupt momentum.

**User expectation:** "smoothly just keep going and decelerate" - they want pure friction, not premature snapping!
