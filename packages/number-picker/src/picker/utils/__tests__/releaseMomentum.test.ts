import { describe, it, expect } from 'vitest';
import { projectReleaseTranslate } from '../releaseMomentum';

const baseConfig = {
  projectionSeconds: 0.15,
  velocityCap: 2000,
  minTranslate: -400,
  maxTranslate: 400,
};

describe('projectReleaseTranslate', () => {
  it('returns clamped translate when projection disabled or velocity zero', () => {
    expect(projectReleaseTranslate(50, 0, baseConfig)).toBe(50);
    expect(projectReleaseTranslate(500, 1200, { ...baseConfig, projectionSeconds: 0 })).toBe(400);
  });

  it('projects distance based on remaining velocity and clamps inside bounds', () => {
    const projected = projectReleaseTranslate(0, 800, baseConfig);
    // velocity (800 px/s) * 0.15s = 120px additional travel
    expect(projected).toBe(120);
  });

  it('caps velocity contribution using velocityCap', () => {
    const projected = projectReleaseTranslate(0, 5000, baseConfig);
    // 5000 capped to 2000 → 300px projection
    expect(projected).toBe(300);
  });

  it('respects negative velocities', () => {
    const projected = projectReleaseTranslate(100, -1200, baseConfig);
    expect(projected).toBe(-80);
  });

  it('extends projection window once the release velocity crosses the threshold', () => {
    const config = {
      ...baseConfig,
      velocityThreshold: 400,
      velocityBoost: 1,
    } as const;

    const slow = projectReleaseTranslate(0, 200, config);
    const fast = projectReleaseTranslate(0, 900, config);

    expect(slow).toBe(30); // 0.15s * 200px/s
    expect(fast).toBeGreaterThan(200); // boost doubles projection window → > 200px
  });
});
