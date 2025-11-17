// Quick manual test to verify velocity projection math
// Run this with: node test-velocity.js

// Simulate the projectReleaseTranslate function
function projectReleaseTranslate(currentTranslate, velocity, config) {
  console.log('\n=== PROJECT RELEASE START ===');
  console.log('currentTranslate:', currentTranslate.toFixed(1));
  console.log('velocity:', velocity.toFixed(1), 'px/s');
  console.log('projectionSeconds:', config.projectionSeconds);
  console.log('velocityThreshold:', config.velocityThreshold);
  console.log('velocityBoost:', config.velocityBoost);

  if (!config.projectionSeconds || !velocity) {
    console.log('\n❌ PROJECT RELEASE SKIPPED');
    console.log('reason:', !config.projectionSeconds ? 'projectionSeconds is falsy' : 'velocity is zero');
    return currentTranslate;
  }

  const limitedVelocity = velocity; // Simplified (no cap for test)

  let projectionSeconds = config.projectionSeconds;
  if (config.velocityBoost && config.velocityBoost > 0 && config.velocityThreshold && config.velocityThreshold > 0) {
    const overspeed = Math.max(0, Math.abs(limitedVelocity) - config.velocityThreshold);
    const normalized = Math.min(overspeed / config.velocityThreshold, 1);
    projectionSeconds *= 1 + normalized * config.velocityBoost;

    console.log('\n=== VELOCITY BOOST ===');
    console.log('overspeed:', overspeed.toFixed(1));
    console.log('normalized:', normalized.toFixed(2));
    console.log('baseProjection:', config.projectionSeconds);
    console.log('boostedProjection:', projectionSeconds.toFixed(3));
    console.log('boostMultiplier:', (1 + normalized * config.velocityBoost).toFixed(2) + 'x');
  }

  const projected = currentTranslate + limitedVelocity * projectionSeconds;

  console.log('\n=== PROJECT RELEASE RESULT ===');
  console.log('input:', currentTranslate.toFixed(1));
  console.log('velocity:', limitedVelocity.toFixed(1), 'px/s');
  console.log('projection:', projectionSeconds.toFixed(3), 's');
  console.log('delta:', (limitedVelocity * projectionSeconds).toFixed(1), 'px');
  console.log('projected:', projected.toFixed(1));

  return projected;
}

// Test config (matches current DEFAULT_SNAP_PHYSICS)
const config = {
  projectionSeconds: 0.25,
  velocityThreshold: 500,
  velocityBoost: 2.0,
  velocityCap: 5000,
  minTranslate: -1000,
  maxTranslate: 1000,
};

console.log('='.repeat(60));
console.log('SCENARIO 1: SLOW SWIPE (200 px/s)');
console.log('='.repeat(60));
const slowResult = projectReleaseTranslate(0, 200, config);
const slowItems = slowResult / 40; // Assuming 40px per item
console.log('\n✅ Items scrolled:', slowItems.toFixed(1));

console.log('\n' + '='.repeat(60));
console.log('SCENARIO 2: FAST SWIPE (3000 px/s)');
console.log('='.repeat(60));
const fastResult = projectReleaseTranslate(0, 3000, config);
const fastItems = fastResult / 40; // Assuming 40px per item
console.log('\n✅ Items scrolled:', fastItems.toFixed(1));

console.log('\n' + '='.repeat(60));
console.log('COMPARISON');
console.log('='.repeat(60));
console.log('Slow swipe items:', slowItems.toFixed(1));
console.log('Fast swipe items:', fastItems.toFixed(1));
console.log('Difference:', (fastItems / slowItems).toFixed(1) + 'x');
console.log('\n' + (fastItems > slowItems * 5 ? '✅ VELOCITY IS WORKING!' : '❌ VELOCITY IS BROKEN!'));
