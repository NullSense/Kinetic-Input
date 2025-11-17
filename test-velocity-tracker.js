// Test velocity tracker linear regression
// Run this with: node test-velocity-tracker.js

function calculateVelocity(samples) {
  if (samples.length < 2) {
    return 0;
  }

  // Use relative timestamps to avoid precision issues
  const timeOffset = samples[0].timestamp;

  const n = samples.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  samples.forEach((sample) => {
    const x = sample.timestamp - timeOffset; // Relative time
    const y = sample.position;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) {
    return 0;
  }

  // Slope = velocity in px/ms
  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Convert to px/s
  return slope * 1000;
}

console.log('='.repeat(60));
console.log('VELOCITY TRACKER TEST');
console.log('='.repeat(60));

// Simulate a SLOW swipe (200 px/s = 0.2 px/ms)
// 8 samples over ~130ms, moving 26px total
const slowSamples = [
  { position: 0, timestamp: 1000 },
  { position: 3, timestamp: 1016 },
  { position: 6, timestamp: 1032 },
  { position: 9, timestamp: 1048 },
  { position: 13, timestamp: 1064 },
  { position: 16, timestamp: 1080 },
  { position: 20, timestamp: 1096 },
  { position: 26, timestamp: 1130 },
];

const slowVelocity = calculateVelocity(slowSamples);
console.log('\nSLOW SWIPE (26px in 130ms):');
console.log('Expected velocity: ~200 px/s');
console.log('Calculated velocity:', slowVelocity.toFixed(1), 'px/s');
console.log(Math.abs(slowVelocity - 200) < 50 ? '✅ CORRECT' : '❌ WRONG');

// Simulate a FAST swipe (3000 px/s = 3 px/ms)
// 8 samples over ~130ms, moving 390px total
const fastSamples = [
  { position: 0, timestamp: 1000 },
  { position: 45, timestamp: 1016 },
  { position: 90, timestamp: 1032 },
  { position: 135, timestamp: 1048 },
  { position: 195, timestamp: 1064 },
  { position: 240, timestamp: 1080 },
  { position: 300, timestamp: 1096 },
  { position: 390, timestamp: 1130 },
];

const fastVelocity = calculateVelocity(fastSamples);
console.log('\nFAST SWIPE (390px in 130ms):');
console.log('Expected velocity: ~3000 px/s');
console.log('Calculated velocity:', fastVelocity.toFixed(1), 'px/s');
console.log(Math.abs(fastVelocity - 3000) < 300 ? '✅ CORRECT' : '❌ WRONG');

console.log('\n' + '='.repeat(60));
console.log('COMPARISON');
console.log('='.repeat(60));
console.log('Slow velocity:', slowVelocity.toFixed(1), 'px/s');
console.log('Fast velocity:', fastVelocity.toFixed(1), 'px/s');
console.log('Ratio:', (fastVelocity / slowVelocity).toFixed(1) + 'x');
console.log('\n' + (fastVelocity > slowVelocity * 5 ? '✅ VELOCITY TRACKER WORKING!' : '❌ VELOCITY TRACKER BROKEN!'));
