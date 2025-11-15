import { describe, expect, it } from 'vitest';
import { createVelocityTracker } from '../velocityTracker';

describe('createVelocityTracker', () => {
  // Note: We don't use fake timers because tests pass explicit timestamps

  describe('Velocity calculation', () => {
    it('returns 0 velocity with insufficient samples', () => {
      const tracker = createVelocityTracker();

      // No samples
      expect(tracker.getVelocity()).toBe(0);

      // One sample
      tracker.addSample(100, 1000);
      expect(tracker.getVelocity()).toBe(0);
    });

    it('calculates velocity from two samples correctly', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // Move 100 pixels in 0.1 seconds = 1000 px/s
      tracker.addSample(0, now - 100);
      tracker.addSample(100, now);

      expect(tracker.getVelocity()).toBe(1000);
    });

    it('calculates negative velocity for upward movement', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // Move -50 pixels in 0.05 seconds = -1000 px/s
      tracker.addSample(100, now - 50);
      tracker.addSample(50, now);

      expect(tracker.getVelocity()).toBe(-1000);
    });

    it('calculates velocity over multiple samples', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // Gradual movement: 0 -> 10 -> 25 -> 45 in 30ms total
      tracker.addSample(0, now - 30);
      tracker.addSample(10, now - 20);
      tracker.addSample(25, now - 10);
      tracker.addSample(45, now);

      // Total delta: 45 pixels in 0.03 seconds = 1500 px/s
      expect(tracker.getVelocity()).toBe(1500);
    });

    it('handles zero time delta', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // Same timestamp
      tracker.addSample(0, now);
      tracker.addSample(100, now);

      expect(tracker.getVelocity()).toBe(0);
    });
  });

  describe('Sample management', () => {
    it('limits samples to configured count', () => {
      const tracker = createVelocityTracker({ sampleCount: 3 });
      const now = Date.now();

      tracker.addSample(0, now - 30);
      tracker.addSample(10, now - 20);
      tracker.addSample(20, now - 10);
      expect(tracker.getSampleCount()).toBe(3);

      tracker.addSample(30, now); // Should evict oldest
      expect(tracker.getSampleCount()).toBe(3);

      // Velocity should be based on samples 2-4, not 1-4
      // Samples: 10->20->30 over 20ms = 1000 px/s
      expect(tracker.getVelocity()).toBe(1000);
    });

    it('discards stale samples', () => {
      const tracker = createVelocityTracker({ maxSampleAge: 50 });

      const now = Date.now();

      // Old samples (more than 50ms ago)
      tracker.addSample(0, now - 100);
      tracker.addSample(10, now - 90);

      // Recent samples (within 50ms of "now")
      tracker.addSample(100, now - 20);
      tracker.addSample(150, now);

      // Should only use recent samples (100->150)
      // 50 pixels in 0.02 seconds = 2500 px/s
      expect(tracker.getVelocity()).toBe(2500);
    });

    it('resets tracker state', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      tracker.addSample(0, now - 100);
      tracker.addSample(100, now);
      expect(tracker.getSampleCount()).toBe(2);

      tracker.reset();
      expect(tracker.getSampleCount()).toBe(0);
      expect(tracker.getVelocity()).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles very fast movements', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // 1000 pixels in 0.01 seconds = 100,000 px/s
      tracker.addSample(0, now - 10);
      tracker.addSample(1000, now);

      expect(tracker.getVelocity()).toBe(100000);
    });

    it('handles very slow movements', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      // 1 pixel in 1 second = 1 px/s
      tracker.addSample(0, now - 1000);
      tracker.addSample(1, now);

      // Note: With default maxSampleAge of 100ms, the old sample will be filtered out
      // So we need to use a larger maxSampleAge for this test
      const slowTracker = createVelocityTracker({ maxSampleAge: 2000 });
      slowTracker.addSample(0, now - 1000);
      slowTracker.addSample(1, now);

      expect(slowTracker.getVelocity()).toBe(1);
    });

    it('handles stationary position', () => {
      const tracker = createVelocityTracker();
      const now = Date.now();

      tracker.addSample(100, now - 20);
      tracker.addSample(100, now - 10);
      tracker.addSample(100, now);

      expect(tracker.getVelocity()).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('respects custom sample count', () => {
      const tracker = createVelocityTracker({ sampleCount: 10 });

      for (let i = 0; i < 15; i++) {
        tracker.addSample(i * 10, 1000 + i * 10);
      }

      expect(tracker.getSampleCount()).toBe(10);
    });

    it('respects custom max sample age', () => {
      const tracker = createVelocityTracker({ maxSampleAge: 200 });

      const now = Date.now();
      tracker.addSample(0, now - 300); // Too old (> 200ms)
      tracker.addSample(50, now - 100); // Recent enough
      tracker.addSample(100, now);      // Recent

      // Should only use last 2 samples
      // 50 pixels in 0.1 seconds = 500 px/s
      expect(tracker.getVelocity()).toBe(500);
    });
  });
});
