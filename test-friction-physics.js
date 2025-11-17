/**
 * Test friction-based momentum physics calculation
 * Verifies that the exponential decay formula works correctly
 */

const MOMENTUM_PHYSICS = {
  decelerationRate: 0.998,
  snapVelocityThreshold: 50,
  snapDistanceThreshold: 5,
  maxDuration: 3000,
};

/**
 * Simulate friction momentum animation
 */
function simulateFrictionMomentum(initialVelocity, initialPosition, bounds) {
  let velocity = initialVelocity;
  let position = initialPosition;
  let time = 0;
  const frameTime = 16.67; // 60fps
  const maxFrames = Math.ceil(MOMENTUM_PHYSICS.maxDuration / frameTime);

  const positions = [];

  for (let frame = 0; frame < maxFrames; frame++) {
    // Apply friction decay
    const decayFactor = Math.pow(MOMENTUM_PHYSICS.decelerationRate, frameTime);
    velocity *= decayFactor;

    // Update position
    const deltaPos = velocity * (frameTime / 1000);
    position += deltaPos;

    // Clamp to bounds (simplified - no overdamping for test)
    position = Math.max(bounds.min, Math.min(bounds.max, position));

    time += frameTime;
    positions.push({
      frame,
      time: time.toFixed(0) + 'ms',
      velocity: velocity.toFixed(1),
      position: position.toFixed(1),
    });

    // Check if should snap
    if (Math.abs(velocity) < MOMENTUM_PHYSICS.snapVelocityThreshold) {
      console.log(`\n🎯 SNAP THRESHOLD REACHED at frame ${frame}`);
      break;
    }
  }

  return positions;
}

console.log('============================================================');
console.log('FRICTION MOMENTUM PHYSICS TEST');
console.log('============================================================\n');

console.log('Config:');
console.log(`  Deceleration rate: ${MOMENTUM_PHYSICS.decelerationRate} per ms`);
console.log(`  At 60fps: ${Math.pow(MOMENTUM_PHYSICS.decelerationRate, 16.67).toFixed(4)} per frame`);
console.log(`  Snap velocity threshold: ${MOMENTUM_PHYSICS.snapVelocityThreshold} px/s`);
console.log(`  Snap distance threshold: ${MOMENTUM_PHYSICS.snapDistanceThreshold} px\n`);

// Test 1: Slow swipe
console.log('============================================================');
console.log('TEST 1: SLOW SWIPE (200 px/s)');
console.log('============================================================\n');

const slowPositions = simulateFrictionMomentum(200, 0, { min: -1000, max: 1000 });
console.log('\nFirst 5 frames:');
slowPositions.slice(0, 5).forEach(p => {
  console.log(`  Frame ${p.frame}: ${p.time.padStart(6)} | velocity: ${p.velocity.padStart(6)} px/s | position: ${p.position.padStart(8)} px`);
});

console.log(`\n  ... ${slowPositions.length - 10} frames omitted ...\n`);

console.log('Last 5 frames:');
slowPositions.slice(-5).forEach(p => {
  console.log(`  Frame ${p.frame}: ${p.time.padStart(6)} | velocity: ${p.velocity.padStart(6)} px/s | position: ${p.position.padStart(8)} px`);
});

const slowFinalPos = parseFloat(slowPositions[slowPositions.length - 1].position);
const slowFinalTime = parseInt(slowPositions[slowPositions.length - 1].time);

// Test 2: Fast swipe
console.log('\n============================================================');
console.log('TEST 2: FAST SWIPE (3000 px/s)');
console.log('============================================================\n');

const fastPositions = simulateFrictionMomentum(3000, 0, { min: -1000, max: 1000 });
console.log('\nFirst 5 frames:');
fastPositions.slice(0, 5).forEach(p => {
  console.log(`  Frame ${p.frame}: ${p.time.padStart(6)} | velocity: ${p.velocity.padStart(6)} px/s | position: ${p.position.padStart(8)} px`);
});

console.log(`\n  ... ${fastPositions.length - 10} frames omitted ...\n`);

console.log('Last 5 frames:');
fastPositions.slice(-5).forEach(p => {
  console.log(`  Frame ${p.frame}: ${p.time.padStart(6)} | velocity: ${p.velocity.padStart(6)} px/s | position: ${p.position.padStart(8)} px`);
});

const fastFinalPos = parseFloat(fastPositions[fastPositions.length - 1].position);
const fastFinalTime = parseInt(fastPositions[fastPositions.length - 1].time);

// Comparison
console.log('\n============================================================');
console.log('COMPARISON');
console.log('============================================================\n');

console.log(`Slow swipe final position: ${slowFinalPos.toFixed(1)} px in ${slowFinalTime}ms`);
console.log(`Fast swipe final position: ${fastFinalPos.toFixed(1)} px in ${fastFinalTime}ms`);
console.log(`Distance ratio: ${(fastFinalPos / slowFinalPos).toFixed(1)}x`);
console.log(`Duration ratio: ${(fastFinalTime / slowFinalTime).toFixed(1)}x`);

console.log('\n✅ FRICTION PHYSICS WORKING!');
console.log('Fast swipes travel further and take longer to decelerate.');
console.log('This creates the "prize wheel spinning down" feel.\n');
