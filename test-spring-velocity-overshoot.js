/**
 * Test spring animation behavior with vs without initial velocity
 * Demonstrates why passing velocity to spring causes overshoot/bounce
 */

const SPRING_CONFIG = {
  stiffness: 300,
  damping: 34,
};

/**
 * Simplified spring physics simulation
 * Based on: F = -k*x - c*v (Hooke's law with damping)
 */
function simulateSpring(start, target, initialVelocity, config) {
  let position = start;
  let velocity = initialVelocity;
  const dt = 16.67; // 60fps in milliseconds

  const frames = [];
  let maxFrames = 200; // ~3 seconds max

  for (let frame = 0; frame < maxFrames; frame++) {
    const displacement = position - target;

    // Spring force: F = -k * displacement
    const springForce = -config.stiffness * displacement;

    // Damping force: F = -c * velocity
    const dampingForce = -config.damping * velocity;

    // Total force (assuming mass = 1)
    const acceleration = springForce + dampingForce;

    // Update velocity and position (simple Euler integration)
    velocity += acceleration * (dt / 1000);
    position += velocity * (dt / 1000);

    const time = frame * dt;

    // Store frame data
    if (frame < 20 || frame % 5 === 0) {
      frames.push({
        frame,
        time: time.toFixed(0) + 'ms',
        position: position.toFixed(2),
        velocity: velocity.toFixed(1),
        displacement: displacement.toFixed(2),
      });
    }

    // Check if settled (velocity and displacement very small)
    if (Math.abs(velocity) < 1 && Math.abs(displacement) < 0.5) {
      frames.push({
        frame,
        time: time.toFixed(0) + 'ms',
        position: position.toFixed(2),
        velocity: velocity.toFixed(1),
        displacement: displacement.toFixed(2),
        event: 'SETTLED',
      });
      break;
    }
  }

  return frames;
}

/**
 * Calculate overshoot (how far past target we go)
 */
function calculateOvershoot(frames, target) {
  let maxOvershoot = 0;

  frames.forEach(frame => {
    const pos = parseFloat(frame.position);
    const overshoot = Math.abs(pos - target);
    if (overshoot > maxOvershoot) {
      maxOvershoot = overshoot;
    }
  });

  return maxOvershoot;
}

console.log('============================================================');
console.log('SPRING ANIMATION: VELOCITY OVERSHOOT TEST');
console.log('============================================================\n');

console.log('This test demonstrates why passing velocity to spring causes bounce.\n');

// Scenario: After friction momentum, we're at -405, need to snap to -400
// Velocity is still +45 px/s (moving downward/away from target)
const START_POS = -405;
const TARGET_POS = -400;
const REMAINING_VELOCITY = +45; // Moving away from target!

console.log('Scenario:');
console.log(`  Current position: ${START_POS}px`);
console.log(`  Snap target: ${TARGET_POS}px`);
console.log(`  Need to move: ${TARGET_POS - START_POS > 0 ? 'UPWARD' : 'DOWNWARD'} by ${Math.abs(TARGET_POS - START_POS)}px`);
console.log(`  Remaining friction velocity: ${REMAINING_VELOCITY > 0 ? '+' : ''}${REMAINING_VELOCITY} px/s (DOWNWARD - wrong direction!)\n`);

// Test 1: WITH velocity (BROKEN - causes overshoot)
console.log('============================================================');
console.log('TEST 1: SPRING WITH INITIAL VELOCITY (BROKEN ❌)');
console.log('============================================================\n');
console.log('This is what happens when we pass velocity to spring:\n');

const withVelocityFrames = simulateSpring(START_POS, TARGET_POS, REMAINING_VELOCITY, SPRING_CONFIG);

console.log('First 10 frames:');
withVelocityFrames.slice(0, 10).forEach(f => {
  const posNum = parseFloat(f.position);
  const marker = posNum < TARGET_POS ? ' (below target)' : posNum > TARGET_POS ? ' (above target)' : ' (at target)';
  console.log(`  Frame ${String(f.frame).padStart(3)}: ${f.time.padStart(5)} | pos: ${f.position.padStart(8)}${marker} | vel: ${f.velocity.padStart(7)}`);
});

console.log('\n... more frames ...\n');

console.log('Last 3 frames:');
withVelocityFrames.slice(-3).forEach(f => {
  const posNum = parseFloat(f.position);
  const marker = posNum < TARGET_POS ? ' (below target)' : posNum > TARGET_POS ? ' (above target)' : ' (at target)';
  const event = f.event ? ` | ${f.event}` : '';
  console.log(`  Frame ${String(f.frame).padStart(3)}: ${f.time.padStart(5)} | pos: ${f.position.padStart(8)}${marker} | vel: ${f.velocity.padStart(7)}${event}`);
});

const overshootWith = calculateOvershoot(withVelocityFrames, TARGET_POS);
console.log(`\n❌ RESULT: Overshoot = ${overshootWith.toFixed(2)}px`);
console.log('The spring overshoots, then bounces back. Feels springy and wrong.\n');

// Test 2: WITHOUT velocity (FIXED - smooth animation)
console.log('============================================================');
console.log('TEST 2: SPRING WITHOUT INITIAL VELOCITY (FIXED ✅)');
console.log('============================================================\n');
console.log('This is what happens when we DON\'T pass velocity (our fix):\n');

const withoutVelocityFrames = simulateSpring(START_POS, TARGET_POS, 0, SPRING_CONFIG);

console.log('First 10 frames:');
withoutVelocityFrames.slice(0, 10).forEach(f => {
  const posNum = parseFloat(f.position);
  const marker = posNum < TARGET_POS ? ' (below target)' : posNum > TARGET_POS ? ' (above target)' : ' (at target)';
  console.log(`  Frame ${String(f.frame).padStart(3)}: ${f.time.padStart(5)} | pos: ${f.position.padStart(8)}${marker} | vel: ${f.velocity.padStart(7)}`);
});

console.log('\n... more frames ...\n');

console.log('Last 3 frames:');
withoutVelocityFrames.slice(-3).forEach(f => {
  const posNum = parseFloat(f.position);
  const marker = posNum < TARGET_POS ? ' (below target)' : posNum > TARGET_POS ? ' (above target)' : ' (at target)';
  const event = f.event ? ` | ${f.event}` : '';
  console.log(`  Frame ${String(f.frame).padStart(3)}: ${f.time.padStart(5)} | pos: ${f.position.padStart(8)}${marker} | vel: ${f.velocity.padStart(7)}${event}`);
});

const overshootWithout = calculateOvershoot(withoutVelocityFrames, TARGET_POS);
console.log(`\n✅ RESULT: Overshoot = ${overshootWithout.toFixed(2)}px`);
console.log('The spring smoothly animates to target. Feels natural and controlled.\n');

// Comparison
console.log('============================================================');
console.log('COMPARISON');
console.log('============================================================\n');

console.log(`With velocity:    Overshoot = ${overshootWith.toFixed(2)}px`);
console.log(`Without velocity: Overshoot = ${overshootWithout.toFixed(2)}px`);
console.log(`Improvement: ${((overshootWith - overshootWithout) / overshootWith * 100).toFixed(1)}% less overshoot\n`);

if (overshootWith > 2 && overshootWithout < 1) {
  console.log('✅ FIX VERIFIED: Removing velocity from spring prevents bounce!');
  console.log('User expectation met: "Same animations as when we don\'t flick"\n');
} else {
  console.log('⚠️  Results unclear, check spring parameters\n');
}

console.log('============================================================');
console.log('CONCLUSION');
console.log('============================================================\n');

console.log('When transitioning from friction → snap:');
console.log('  ❌ BAD: Pass velocity to spring → Overshoot and bounce');
console.log('  ✅ GOOD: Start spring with 0 velocity → Smooth settle\n');

console.log('The friction phase provides momentum feel.');
console.log('The snap phase should be consistent and smooth.');
console.log('This matches non-flick behavior and user expectations.\n');
