# WHEEL DIRECTION ULTRATHINK ANALYSIS

## Coordinate System

From `math.ts`:
```typescript
indexFromY(translateY, rowHeight, maxTranslate) = Math.round((maxTranslate - translateY) / rowHeight)
yFromIndex(index, rowHeight, maxTranslate) = maxTranslate - index * rowHeight
```

**Key relationships:**
- Index 0 (first item): `translateY = maxTranslate` (e.g., 200)
- Index 1: `translateY = maxTranslate - rowHeight` (e.g., 160)
- Index 2: `translateY = maxTranslate - 2*rowHeight` (e.g., 120)

**To change index:**
- **INCREASE index** (0→1): translateY must **DECREASE** (200→160)
- **DECREASE index** (1→0): translateY must **INCREASE** (160→200)

## Expected Behavior

### Mouse Wheel (Traditional/Inverted Scrolling)
- **Wheel UP** (away from you) → **DECREASE index** (1→0)
- **Wheel DOWN** (towards you) → **INCREASE index** (0→1)

### Touchpad (Natural Scrolling)
- **Fingers UP** → **INCREASE index** (0→1)
- **Fingers DOWN** → **DECREASE index** (1→0)

### Touch/Mouse Drag
- **Drag UP** → **INCREASE index** (0→1) - pulling current item up reveals next
- **Drag DOWN** → **DECREASE index** (1→0) - pulling current item down reveals previous

## Current Code Analysis

In `usePickerPhysics.ts:715-748`:

```typescript
const handleWheeling = (event: WheelEvent) => {
  let delta = event.deltaY;

  // Scale based on mode
  if (event.deltaMode === DOM_DELTA_MODE.LINE) {
    delta *= itemHeight;
  } else if (event.deltaMode === DOM_DELTA_MODE.PAGE) {
    delta *= height;
  }

  delta *= normalizedWheelSensitivity;

  // Line 730-734: Direction handling
  if (event.deltaMode === DOM_DELTA_MODE.PIXEL) {
    // Touchpad
    delta = -delta * 0.35;
  }
  // Mouse wheel (LINE mode) keeps delta as-is

  // Line 748: Apply delta
  const rawTranslate = currentTranslate + boundedDelta;
  //                                    ^ ADD delta
}
```

## Problem: Wrong Direction!

### Issue 1: Mouse Wheel (LINE mode)

**Test case:** User scrolls wheel DOWN (wants index 0→1)

```
1. event.deltaY = +100 (positive when wheel down)
2. delta = +100 * itemHeight (LINE mode)
3. delta = +100 * itemHeight (NOT inverted!)
4. rawTranslate = currentTranslate + 100
5. If currentTranslate = 200 (index 0):
   rawTranslate = 300
6. index = (maxTranslate - rawTranslate) / rowHeight
         = (200 - 300) / 40
         = -2.5
   → NEGATIVE INDEX! ❌

Expected: index should INCREASE to 1
Actual: index DECREASES (or goes negative)
```

**Root cause:** Delta is added but should be SUBTRACTED

### Issue 2: Touchpad (PIXEL mode)

**Test case:** User swipes fingers UP (wants index 0→1)

```
1. event.deltaY = -100 (negative with natural scrolling)
2. delta = -100 (PIXEL mode)
3. delta = -(-100) * 0.35 = +35 (negated!)
4. rawTranslate = currentTranslate + 35
5. If currentTranslate = 200 (index 0):
   rawTranslate = 235
6. index = (200 - 235) / 40 = -0.875
   → Rounds to index 0 or -1! ❌

Expected: index should INCREASE to 1
Actual: index stays same or goes negative
```

**Root cause:** Double negation! Natural scrolling already makes deltaY negative, then we negate again

## The Fix

The formula `rawTranslate = currentTranslate + delta` is BACKWARDS!

Should be: `rawTranslate = currentTranslate - delta`

Why? Because:
- Positive delta (wheel down, touchpad fingers up) should INCREASE index
- To increase index, translateY must DECREASE
- Therefore: `translateY = translateY - delta`

### Corrected Code

```typescript
const handleWheeling = (event: WheelEvent) => {
  let delta = event.deltaY;

  // Scale based on mode
  if (event.deltaMode === DOM_DELTA_MODE.LINE) {
    delta *= itemHeight;
  } else if (event.deltaMode === DOM_DELTA_MODE.PAGE) {
    delta *= height;
  }

  delta *= normalizedWheelSensitivity;

  // Touchpad: reduce sensitivity for fine control
  if (event.deltaMode === DOM_DELTA_MODE.PIXEL) {
    delta *= 0.35;
    // NO NEGATION! Natural scrolling already gives us correct sign
  }
  // Mouse wheel: LINE mode keeps delta as-is
  // Both work with subtraction below

  // CRITICAL FIX: SUBTRACT delta instead of ADD
  const rawTranslate = currentTranslate - boundedDelta;
  //                                    ^ SUBTRACT!
}
```

## Verification

### Mouse Wheel DOWN (want index 0→1):
```
1. event.deltaY = +100
2. delta = +100 * itemHeight = +100
3. rawTranslate = 200 - 100 = 100 ✅
4. index = (200 - 100) / 40 = 2.5 → rounds to index 3

Wait, that's too far! Let me recalculate...
If itemHeight = 40:
- index 0: translateY = 200
- index 1: translateY = 160
- index 2: translateY = 120
- index 3: translateY = 80

So rawTranslate = 100 gives index = (200-100)/40 = 2.5 → 3 or 2

Hmm, this is still not right. Let me check the actual itemHeight value...
```

Actually, I think the issue is that event.deltaY for LINE mode is not in pixels but in "lines" (usually 3 lines per notch). So when we multiply by itemHeight, we might be moving too far.

Let me re-read the code to understand the flow better...

## Touch/Pointer Drag Direction

In `usePickerPhysics.ts` around line 450-470, pointer handling:

```typescript
const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
  const deltaPointerY = event.clientY - startPointerYRef.current;
  const nextTranslate = startTranslateRef.current + deltaPointerY;
  //                                                ^ ADD!
}
```

**Test case:** User drags UP (finger moves up on screen, wants index 0→1)

```
1. startPointerY = 500 (initial touch point)
2. event.clientY = 400 (moved up 100px)
3. deltaPointerY = 400 - 500 = -100
4. nextTranslate = 200 + (-100) = 100
5. index = (200 - 100) / 40 = 2.5 → 2 or 3 ✅

So index INCREASES! ✅ This is correct!
```

**Why it works:** clientY decreases when moving up, so deltaPointerY is negative, which when added to translateY, DECREASES translateY, which INCREASES index. Perfect!

## Conclusion

**Drag is CORRECT** - uses addition with negative delta when dragging up.

**Wheel is WRONG** - needs to match drag behavior!

The fix: Don't change the subtraction/addition logic. Instead, fix the SIGN of delta:

### For Mouse Wheel (LINE mode):
```typescript
// Wheel DOWN gives positive deltaY, but we want negative delta (like dragging down)
// So DON'T negate (keep deltaY sign, which is opposite of desired motion)
delta = event.deltaY * itemHeight;  // Keep as-is
```

Wait, I'm getting confused. Let me think about this more carefully...

When you scroll wheel DOWN:
- event.deltaY = positive
- Content should move UP (to reveal content below)
- In drag terms: dragging DOWN moves content DOWN
- But wheel is opposite: wheel DOWN moves content UP

So wheel DOWN = drag UP (in terms of content motion)

When you drag UP:
- clientY decreases
- deltaPointerY = negative
- translateY decreases (via addition of negative)
- Index increases

So for wheel DOWN (to match drag UP behavior):
- deltaY = positive
- We need delta = negative (to match drag UP)
- So: delta = -event.deltaY

I think the current code for PIXEL mode is actually trying to do this with the negation, but it's confusing.

Let me just write the correct logic from scratch...
