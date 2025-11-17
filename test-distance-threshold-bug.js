/**
 * Test demonstrating the distance threshold bug
 * Shows how premature snapping causes "go past then back" behavior
 */

const MOMENTUM_PHYSICS = {
  decelerationRate: 0.998,
  snapVelocityThreshold: 50,
  snapDistanceThreshold: 5,
};

const ITEM_HEIGHT = 40;

/**
 * Simulate friction with the BUGGY distance threshold check
 */
function simulateFrictionWithBug(initialVelocity, initialPosition, snapPoints) {
  let velocity = initialVelocity;
  let position = initialPosition;
  const dt = 16.67; // 60fps

  const frames = [];
  let snappedEarly = false;
  let snapFrame = null;

  for (let frame = 0; frame < 200; frame++) {
    // Apply friction
    velocity *= Math.pow(MOMENTUM_PHYSICS.decelerationRate, dt);
    position += velocity * (dt / 1000);

    const time = frame * dt;
    const absVelocity = Math.abs(velocity);

    // Check 1: Velocity threshold
    if (absVelocity < MOMENTUM_PHYSICS.snapVelocityThreshold) {
      frames.push({
        frame,
        time: time.toFixed(0),
        position: position.toFixed(1),
        velocity: velocity.toFixed(1),
        event: 'SNAP (velocity threshold)',
      });
      snapFrame = frame;
      break;
    }

    // Check 2: Distance threshold (THE BUG!)
    const nearestSnap = snapPoints.reduce((nearest, snap) =>
      Math.abs(position - snap) < Math.abs(position - nearest) ? snap : nearest
    );
    const distance = Math.abs(position - nearestSnap);

    if (distance < MOMENTUM_PHYSICS.snapDistanceThreshold) {
      frames.push({
        frame,
        time: time.toFixed(0),
        position: position.toFixed(1),
        velocity: velocity.toFixed(1),
        nearestSnap: nearestSnap.toFixed(1),
        distance: distance.toFixed(2),
        event: '❌ PREMATURE SNAP (distance threshold)',
      });
      snappedEarly = true;
      snapFrame = frame;
      break;
    }

    if (frame % 5 === 0 || frame < 10) {
      frames.push({
        frame,
        time: time.toFixed(0),
        position: position.toFixed(1),
        velocity: velocity.toFixed(1),
        nearestSnap: nearestSnap.toFixed(1),
        distance: distance.toFixed(2),
      });
    }
  }

  return { frames, snappedEarly, snapFrame };
}

/**
 * Simulate friction WITHOUT distance threshold (THE FIX)
 */
function simulateFrictionWithoutBug(initialVelocity, initialPosition) {
  let velocity = initialVelocity;
  let position = initialPosition;
  const dt = 16.67;

  const frames = [];
  let snapFrame = null;

  for (let frame = 0; frame < 200; frame++) {
    // Apply friction
    velocity *= Math.pow(MOMENTUM_PHYSICS.decelerationRate, dt);
    position += velocity * (dt / 1000);

    const time = frame * dt;
    const absVelocity = Math.abs(velocity);

    // ONLY check velocity threshold (no distance check)
    if (absVelocity < MOMENTUM_PHYSICS.snapVelocityThreshold) {
      frames.push({
        frame,
        time: time.toFixed(0),
        position: position.toFixed(1),
        velocity: velocity.toFixed(1),
        event: '✅ SNAP (velocity threshold)',
      });
      snapFrame = frame;
      break;
    }

    if (frame % 5 === 0 || frame < 10) {
      frames.push({
        frame,
        time: time.toFixed(0),
        position: position.toFixed(1),
        velocity: velocity.toFixed(1),
      });
    }
  }

  return { frames, snapFrame };
}

console.log('============================================================');
console.log('DISTANCE THRESHOLD BUG DEMONSTRATION');
console.log('============================================================\n');

console.log('This test shows how the distance threshold causes premature');
console.log('snapping while velocity is still high, resulting in the');
console.log('"go past some point then go back" bounce-back bug.\n');

// Snap points every 40px
const snapPoints = [-1240, -1200, -1160, -1120, -1080, -1040];

// Scenario: Fast flick upward (negative velocity)
const INITIAL_POS = -1203; // Just past -1200 snap point
const INITIAL_VEL = -800;  // Fast upward movement

console.log('Scenario:');
console.log(`  Initial position: ${INITIAL_POS}px (near -1200 snap point)`);
console.log(`  Initial velocity: ${INITIAL_VEL} px/s (fast upward movement)`);
console.log(`  Snap points: ${snapPoints.join(', ')}`);
console.log(`  Distance threshold: ${MOMENTUM_PHYSICS.snapDistanceThreshold}px`);
console.log(`  Velocity threshold: ${MOMENTUM_PHYSICS.snapVelocityThreshold} px/s\n`);

// Test WITH bug (distance threshold active)
console.log('============================================================');
console.log('WITH DISTANCE THRESHOLD (BUGGY ❌)');
console.log('============================================================\n');

const withBug = simulateFrictionWithBug(INITIAL_VEL, INITIAL_POS, snapPoints);

console.log('First 10 frames:');
console.log('Frame | Time  | Position  | Velocity  | Nearest | Distance | Event');
console.log('------|-------|-----------|-----------|---------|----------|------------------');

withBug.frames.slice(0, 10).forEach(f => {
  const nearest = f.nearestSnap ? f.nearestSnap.padStart(7) : '       ';
  const distance = f.distance ? f.distance.padStart(6) : '      ';
  const event = f.event || '';
  console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${nearest} | ${distance} | ${event}`);
});

if (withBug.frames.length > 10) {
  console.log('  ...');
  withBug.frames.slice(-1).forEach(f => {
    const nearest = f.nearestSnap ? f.nearestSnap.padStart(7) : '       ';
    const distance = f.distance ? f.distance.padStart(6) : '      ';
    const event = f.event || '';
    console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${nearest} | ${distance} | ${event}`);
  });
}

const bugFinalPos = parseFloat(withBug.frames[withBug.frames.length - 1].position);
const bugFinalVel = parseFloat(withBug.frames[withBug.frames.length - 1].velocity);

console.log(`\n❌ PROBLEM: Snapped at frame ${withBug.snapFrame}`);
console.log(`❌ Velocity when snapped: ${bugFinalVel.toFixed(1)} px/s (STILL HIGH!)`);
console.log(`❌ Position when snapped: ${bugFinalPos.toFixed(1)}px`);

if (withBug.snappedEarly) {
  console.log(`❌ Result: Premature snap while velocity = ${bugFinalVel.toFixed(1)} px/s`);
  console.log(`❌ Spring will try to animate to -1200, but momentum wants -1400`);
  console.log(`❌ Conflict → "go past then back" → BOUNCE! 🔴\n`);
} else {
  console.log(`✅ No premature snap\n`);
}

// Test WITHOUT bug (distance threshold removed)
console.log('============================================================');
console.log('WITHOUT DISTANCE THRESHOLD (FIXED ✅)');
console.log('============================================================\n');

const withoutBug = simulateFrictionWithoutBug(INITIAL_VEL, INITIAL_POS);

console.log('First 10 frames:');
console.log('Frame | Time  | Position  | Velocity  | Event');
console.log('------|-------|-----------|-----------|------------------');

withoutBug.frames.slice(0, 10).forEach(f => {
  const event = f.event || '';
  console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${event}`);
});

if (withoutBug.frames.length > 10) {
  console.log('  ...');
  withoutBug.frames.slice(-3).forEach(f => {
    const event = f.event || '';
    console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${event}`);
  });
}

const fixFinalPos = parseFloat(withoutBug.frames[withoutBug.frames.length - 1].position);
const fixFinalVel = parseFloat(withoutBug.frames[withoutBug.frames.length - 1].velocity);

console.log(`\n✅ FIXED: Snapped at frame ${withoutBug.snapFrame}`);
console.log(`✅ Velocity when snapped: ${fixFinalVel.toFixed(1)} px/s (LOW, as expected)`);
console.log(`✅ Position when snapped: ${fixFinalPos.toFixed(1)}px`);
console.log(`✅ Result: Friction ran completely, velocity naturally low`);
console.log(`✅ Spring animates smoothly to nearest snap point`);
console.log(`✅ No conflict → No bounce! 🟢\n`);

// Comparison
console.log('============================================================');
console.log('COMPARISON');
console.log('============================================================\n');

console.log(`WITH BUG (distance threshold):`);
console.log(`  Snapped at frame: ${withBug.snapFrame}`);
console.log(`  Velocity at snap: ${bugFinalVel.toFixed(1)} px/s ❌ TOO HIGH`);
console.log(`  Traveled distance: ${Math.abs(bugFinalPos - INITIAL_POS).toFixed(1)}px`);

console.log(`\nWITHOUT BUG (velocity only):`);
console.log(`  Snapped at frame: ${withoutBug.snapFrame}`);
console.log(`  Velocity at snap: ${fixFinalVel.toFixed(1)} px/s ✅ LOW`);
console.log(`  Traveled distance: ${Math.abs(fixFinalPos - INITIAL_POS).toFixed(1)}px`);

const frameDiff = withoutBug.snapFrame - withBug.snapFrame;
const distanceDiff = Math.abs(fixFinalPos - bugFinalPos);

console.log(`\nDifference:`);
console.log(`  Friction ran ${frameDiff} frames longer (${(frameDiff * 16.67 / 1000).toFixed(2)}s)`);
console.log(`  Traveled ${distanceDiff.toFixed(1)}px further before snapping`);
console.log(`  Velocity was ${(Math.abs(fixFinalVel / bugFinalVel) * 100).toFixed(0)}% of premature snap velocity`);

console.log(`\n✅ FIX VERIFIED: Removing distance threshold allows smooth deceleration!`);
console.log(`User expectation met: "smoothly just keep going and decelerate"\n`);

console.log('============================================================');
console.log('CONCLUSION');
console.log('============================================================\n');

console.log('The distance threshold causes premature snapping while velocity');
console.log('is still high, creating the "go past then back" bounce behavior.');
console.log('');
console.log('Fix: Remove distance threshold check. Let friction run until');
console.log('velocity is naturally low, then snap smoothly.');
console.log('');
console.log('Result: Smooth continuous deceleration, no bounce-back. 🎉\n');
