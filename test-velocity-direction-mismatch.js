/**
 * Test the REAL bounce-back bug:
 * When velocity direction doesn't match the direction we need to move to snap target
 */

const SPRING_CONFIG = {
  stiffness: 300,
  damping: 34,
};

/**
 * Simplified spring simulation
 */
function simulateSpring(start, target, initialVelocity, config, maxTime = 1000) {
  let position = start;
  let velocity = initialVelocity;
  const dt = 16.67; // 60fps

  const frames = [];
  let maxFrames = Math.ceil(maxTime / dt);
  let crossedTarget = false;

  for (let frame = 0; frame < maxFrames; frame++) {
    const displacement = position - target;

    // Check if we crossed the target
    const wasAbove = frame === 0 ? start > target : parseFloat(frames[frame-1].position) > target;
    const isBelow = position < target;
    if (wasAbove && isBelow && !crossedTarget) {
      crossedTarget = true;
    }

    // Spring physics
    const springForce = -config.stiffness * displacement;
    const dampingForce = -config.damping * velocity;
    const acceleration = springForce + dampingForce;

    velocity += acceleration * (dt / 1000);
    position += velocity * (dt / 1000);

    const time = frame * dt;

    frames.push({
      frame,
      time: time.toFixed(0),
      position: position.toFixed(2),
      velocity: velocity.toFixed(1),
      targetDir: position < target ? '↑' : position > target ? '↓' : '●',
      velDir: velocity > 0 ? '↓' : velocity < 0 ? '↑' : '-',
    });

    // Settled?
    if (Math.abs(velocity) < 1 && Math.abs(displacement) < 0.5) {
      break;
    }
  }

  return { frames, crossedTarget };
}

console.log('============================================================');
console.log('VELOCITY DIRECTION MISMATCH BUG');
console.log('============================================================\n');

console.log('THE BUG: When friction decays but velocity is still moving AWAY');
console.log('from the snap target, passing that velocity to spring causes');
console.log('overshoot in the OPPOSITE direction, then bounce-back.\n');

// Scenario: Fast downward flick, friction decays, but we overshoot
// Now we're BELOW the snap target, velocity still DOWNWARD
const START_POS = -410;  // Below target
const TARGET_POS = -400; // Need to move UPWARD
const VELOCITY_DOWNWARD = +200; // Still moving DOWNWARD (wrong direction!)

console.log('Scenario:');
console.log(`  Position: ${START_POS} (below snap target)`);
console.log(`  Target: ${TARGET_POS} (need to move UPWARD by ${Math.abs(START_POS - TARGET_POS)}px)`);
console.log(`  Velocity: +${VELOCITY_DOWNWARD} px/s (moving DOWNWARD - WRONG DIRECTION!)`);
console.log(`  Spring says: "Move UP to -400"`);
console.log(`  Velocity says: "Keep moving DOWN"`);
console.log(`  Result: CONFLICT → Overshoot → Bounce\n`);

// Test 1: WITH velocity (BUG)
console.log('============================================================');
console.log('WITH VELOCITY (BROKEN ❌)');
console.log('============================================================\n');

const withVel = simulateSpring(START_POS, TARGET_POS, VELOCITY_DOWNWARD, SPRING_CONFIG);

console.log('Frame | Time  | Position  | Velocity  | Need | Vel Dir | Notes');
console.log('------|-------|-----------|-----------|------|---------|------------------');

withVel.frames.slice(0, 15).forEach(f => {
  const notes = parseFloat(f.position) < -420 ? 'MAJOR OVERSHOOT!' :
                parseFloat(f.position) < TARGET_POS ? 'overshooting...' :
                parseFloat(f.position) > TARGET_POS + 2 ? 'bouncing back' : '';
  console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${f.targetDir.padStart(4)} | ${f.velDir.padStart(7)} | ${notes}`);
});

if (withVel.frames.length > 15) {
  console.log('  ... more frames ...');
  withVel.frames.slice(-3).forEach(f => {
    console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${f.targetDir.padStart(4)} | ${f.velDir.padStart(7)} |`);
  });
}

const maxOvershootWith = Math.max(...withVel.frames.map(f => Math.abs(parseFloat(f.position) - TARGET_POS)));
const finalPosWithVel = parseFloat(withVel.frames[withVel.frames.length - 1].position);

console.log(`\n❌ Max overshoot: ${maxOvershootWith.toFixed(1)}px`);
console.log(`❌ Final position: ${finalPosWithVel.toFixed(2)} (target: ${TARGET_POS})`);
console.log(`❌ Crossed target: ${withVel.crossedTarget ? 'YES - bounced!' : 'NO'}\n`);

// Test 2: WITHOUT velocity (FIXED)
console.log('============================================================');
console.log('WITHOUT VELOCITY (FIXED ✅)');
console.log('============================================================\n');

const withoutVel = simulateSpring(START_POS, TARGET_POS, 0, SPRING_CONFIG);

console.log('Frame | Time  | Position  | Velocity  | Need | Vel Dir | Notes');
console.log('------|-------|-----------|-----------|------|---------|------------------');

withoutVel.frames.slice(0, 15).forEach(f => {
  const notes = parseFloat(f.position) > TARGET_POS ? 'moving to target' : 'at target';
  console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${f.targetDir.padStart(4)} | ${f.velDir.padStart(7)} | ${notes}`);
});

if (withoutVel.frames.length > 15) {
  console.log('  ... more frames ...');
  withoutVel.frames.slice(-3).forEach(f => {
    console.log(`${String(f.frame).padStart(5)} | ${f.time.padStart(5)} | ${f.position.padStart(9)} | ${f.velocity.padStart(9)} | ${f.targetDir.padStart(4)} | ${f.velDir.padStart(7)} |`);
  });
}

const maxOvershootWithout = Math.max(...withoutVel.frames.map(f => Math.abs(parseFloat(f.position) - TARGET_POS)));
const finalPosWithoutVel = parseFloat(withoutVel.frames[withoutVel.frames.length - 1].position);

console.log(`\n✅ Max overshoot: ${maxOvershootWithout.toFixed(1)}px`);
console.log(`✅ Final position: ${finalPosWithoutVel.toFixed(2)} (target: ${TARGET_POS})`);
console.log(`✅ Crossed target: ${withoutVel.crossedTarget ? 'YES' : 'NO - smooth!'}\n`);

// Summary
console.log('============================================================');
console.log('SUMMARY');
console.log('============================================================\n');

console.log(`WITH velocity:     ${maxOvershootWith.toFixed(1)}px overshoot, ${withVel.crossedTarget ? 'BOUNCED ❌' : 'OK'}`);
console.log(`WITHOUT velocity:  ${maxOvershootWithout.toFixed(1)}px overshoot, ${withoutVel.crossedTarget ? 'bounced' : 'SMOOTH ✅'}`);
console.log(`\nImprovement: ${((maxOvershootWith - maxOvershootWithout) / maxOvershootWith * 100).toFixed(0)}% less overshoot\n`);

if (maxOvershootWith > maxOvershootWithout * 1.5) {
  console.log('✅ FIX CONFIRMED: Removing velocity prevents bounce-back!');
  console.log('The friction phase provides momentum.');
  console.log('The snap phase provides smooth, consistent settle.');
  console.log('No more springy bounce-back!\n');
} else {
  console.log('Note: In this scenario both settle smoothly, but the key is');
  console.log('preventing the case where velocity fights against the spring.\n');
}
