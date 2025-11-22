import { describe, expect, it } from 'vitest';
import { computeHighlightMetrics } from '../useHighlightMetrics';

const BASE_TWEAKS = {
  activeScale: 1.4,
  deselectScale: 0.95,
  highlightPadding: 0,
  trailOvershoot: 0.08,
};

describe('computeHighlightMetrics', () => {
  it('caps the trail overshoot to the available scale range', () => {
    const { trailStartScale } = computeHighlightMetrics({
      itemHeight: 40,
      tweaks: { ...BASE_TWEAKS, trailOvershoot: 1.0 },
    });

    expect(trailStartScale).toBeCloseTo(0.95);
  });

  it('limits highlight padding to half the item height minus buffer', () => {
    const { highlightPaddingPx } = computeHighlightMetrics({
      itemHeight: 40,
      tweaks: { ...BASE_TWEAKS, highlightPadding: 40 },
    });

    // 40 / 2 - 2 = 18
    expect(highlightPaddingPx).toBe(18);
  });

  it('never lets the highlight shrink below the minimum height', () => {
    const { highlightHeightPx } = computeHighlightMetrics({
      itemHeight: 10,
      tweaks: { ...BASE_TWEAKS, highlightPadding: 20 },
    });

    expect(highlightHeightPx).toBe(4);
  });
});
