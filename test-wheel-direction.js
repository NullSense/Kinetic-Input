/**
 * Test wheel direction logic
 * Simulates what happens with current code
 */

const DOM_DELTA_MODE = {
  PIXEL: 0x00,
  LINE: 0x01,
  PAGE: 0x02,
};

const itemHeight = 40;
const maxTranslate = 200;

function indexFromY(translateY, rowHeight, maxTranslate) {
  return Math.round((maxTranslate - translateY) / rowHeight);
}

function yFromIndex(index, rowHeight, maxTranslate) {
  return maxTranslate - index * rowHeight;
}

function simulateWheel(currentIndex, eventDeltaY, deltaMode, description) {
  const currentTranslate = yFromIndex(currentIndex, itemHeight, maxTranslate);

  console.log(`\n${'='.repeat(70)}`);
  console.log(description);
  console.log(`${'='.repeat(70)}`);
  console.log(`Starting state:`);
  console.log(`  Current index: ${currentIndex}`);
  console.log(`  Current translateY: ${currentTranslate}`);
  console.log(`  event.deltaY: ${eventDeltaY}`);
  console.log(`  event.deltaMode: ${deltaMode === DOM_DELTA_MODE.PIXEL ? 'PIXEL (touchpad)' : 'LINE (mouse wheel)'}`);

  // Simulate current code
  let delta = eventDeltaY;

  if (deltaMode === DOM_DELTA_MODE.LINE) {
    delta *= itemHeight;
    console.log(`\nAfter LINE scaling (* ${itemHeight}): delta = ${delta}`);
  }

  // Sensitivity (assume 1.0 for simplicity)
  // delta *= 1.0;

  if (deltaMode === DOM_DELTA_MODE.PIXEL) {
    const beforeScaling = delta;
    delta = delta * 0.35;
    console.log(`\nAfter PIXEL transform (delta * 0.35):`);
    console.log(`  Before: ${beforeScaling}`);
    console.log(`  After: ${delta}`);
  } else {
    console.log(`\nLINE mode: delta kept as-is = ${delta}`);
  }

  // FIXED: SUBTRACTION (coordinate system: higher index = lower translateY)
  const rawTranslate = currentTranslate - delta;
  const newIndex = indexFromY(rawTranslate, itemHeight, maxTranslate);

  console.log(`\nCalculation:`);
  console.log(`  rawTranslate = currentTranslate - delta`);
  console.log(`  rawTranslate = ${currentTranslate} - ${delta} = ${rawTranslate}`);
  console.log(`  newIndex = (maxTranslate - rawTranslate) / itemHeight`);
  console.log(`  newIndex = (${maxTranslate} - ${rawTranslate}) / ${itemHeight}`);
  console.log(`  newIndex = ${(maxTranslate - rawTranslate) / itemHeight} → rounds to ${newIndex}`);

  console.log(`\nResult:`);
  console.log(`  Index changed: ${currentIndex} → ${newIndex}`);
  console.log(`  Index delta: ${newIndex - currentIndex > 0 ? '+' : ''}${newIndex - currentIndex}`);

  return { newIndex, delta: newIndex - currentIndex };
}

console.log('WHEEL DIRECTION TEST - CURRENT CODE BEHAVIOR');
console.log('='.repeat(70));
console.log('Coordinate system:');
console.log('  index 0: translateY = 200');
console.log('  index 1: translateY = 160');
console.log('  index 2: translateY = 120');
console.log('  index 3: translateY = 80');
console.log('  ...');
console.log('  (translateY DECREASES as index INCREASES)');

// Test 1: Mouse wheel DOWN (want to increase index)
const test1 = simulateWheel(
  1,           // Starting at index 1
  3,           // event.deltaY = 3 (positive, wheel down)
  DOM_DELTA_MODE.LINE,
  'TEST 1: Mouse Wheel DOWN (scroll down, want index 1→2)'
);

console.log(`\n${'*'.repeat(70)}`);
console.log(`Expected: Index should INCREASE (1 → 2)`);
console.log(`Actual: Index ${test1.delta > 0 ? 'INCREASED' : test1.delta < 0 ? 'DECREASED' : 'UNCHANGED'} (1 → ${test1.newIndex})`);
console.log(test1.delta > 0 ? '✅ CORRECT' : '❌ WRONG');

// Test 2: Mouse wheel UP (want to decrease index)
const test2 = simulateWheel(
  1,           // Starting at index 1
  -3,          // event.deltaY = -3 (negative, wheel up)
  DOM_DELTA_MODE.LINE,
  'TEST 2: Mouse Wheel UP (scroll up, want index 1→0)'
);

console.log(`\n${'*'.repeat(70)}`);
console.log(`Expected: Index should DECREASE (1 → 0)`);
console.log(`Actual: Index ${test2.delta < 0 ? 'DECREASED' : test2.delta > 0 ? 'INCREASED' : 'UNCHANGED'} (1 → ${test2.newIndex})`);
console.log(test2.delta < 0 ? '✅ CORRECT' : '❌ WRONG');

// Test 3: Touchpad swipe UP (fingers move up, want index to increase with natural scrolling)
const test3 = simulateWheel(
  1,           // Starting at index 1
  100,         // event.deltaY = 100 (positive with natural scrolling, fingers up)
  DOM_DELTA_MODE.PIXEL,
  'TEST 3: Touchpad Fingers UP (natural scrolling, want index 1→2)'
);

console.log(`\n${'*'.repeat(70)}`);
console.log(`Expected: Index should INCREASE (1 → 2) with natural scrolling`);
console.log(`Actual: Index ${test3.delta > 0 ? 'INCREASED' : test3.delta < 0 ? 'DECREASED' : 'UNCHANGED'} (1 → ${test3.newIndex})`);
console.log(test3.delta > 0 ? '✅ CORRECT' : '❌ WRONG');

// Test 4: Touchpad swipe DOWN (fingers move down, want index to decrease)
const test4 = simulateWheel(
  1,           // Starting at index 1
  -100,        // event.deltaY = -100 (negative, fingers down)
  DOM_DELTA_MODE.PIXEL,
  'TEST 4: Touchpad Fingers DOWN (natural scrolling, want index 1→0)'
);

console.log(`\n${'*'.repeat(70)}`);
console.log(`Expected: Index should DECREASE (1 → 0)`);
console.log(`Actual: Index ${test4.delta < 0 ? 'DECREASED' : test4.delta > 0 ? 'INCREASED' : 'UNCHANGED'} (1 → ${test4.newIndex})`);
console.log(test4.delta < 0 ? '✅ CORRECT' : '❌ WRONG');

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const results = [
  { name: 'Mouse wheel DOWN', expected: 'increase', actual: test1.delta > 0 ? 'increase' : test1.delta < 0 ? 'decrease' : 'unchanged', pass: test1.delta > 0 },
  { name: 'Mouse wheel UP', expected: 'decrease', actual: test2.delta < 0 ? 'decrease' : test2.delta > 0 ? 'increase' : 'unchanged', pass: test2.delta < 0 },
  { name: 'Touchpad fingers UP', expected: 'increase', actual: test3.delta > 0 ? 'increase' : test3.delta < 0 ? 'decrease' : 'unchanged', pass: test3.delta > 0 },
  { name: 'Touchpad fingers DOWN', expected: 'decrease', actual: test4.delta < 0 ? 'decrease' : test4.delta > 0 ? 'increase' : 'unchanged', pass: test4.delta < 0 },
];

results.forEach(r => {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name.padEnd(25)} | Expected: ${r.expected.padEnd(8)} | Actual: ${r.actual.padEnd(8)}`);
});

const allPass = results.every(r => r.pass);
console.log(`\n${allPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAIL'}`);

if (!allPass) {
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  TESTS STILL FAILING - PLEASE INVESTIGATE');
  console.log('='.repeat(70));
  console.log('Expected fix has been applied, but tests still fail.');
  console.log('Check usePickerPhysics.ts for any other direction logic.');
} else {
  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL TESTS PASS - FIX VERIFIED');
  console.log('='.repeat(70));
  console.log('Wheel and touchpad directions are working correctly!');
}
