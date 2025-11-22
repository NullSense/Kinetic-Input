import { useMemo } from 'react';
import type { ResolvedVisualTweaks } from './useResolvedVisualTweaks';

export interface HighlightMetrics {
  trailStartScale: number;
  highlightPaddingPx: number;
  highlightHeightPx: number;
}

interface HighlightMetricArgs {
  itemHeight: number;
  tweaks: Pick<
    ResolvedVisualTweaks,
    'activeScale' | 'deselectScale' | 'trailOvershoot' | 'highlightPadding'
  >;
}

/**
 * Calculates highlight padding/scale numbers from the resolved tweaks.
 * @param {Pick<ResolvedHighlightMetricsArgs, 'padding' | 'trailScale' | 'height'>} args
 * @returns {HighlightMetrics}
 */
export function computeHighlightMetrics({
  itemHeight,
  tweaks,
}: HighlightMetricArgs): HighlightMetrics {
  const { activeScale, deselectScale, highlightPadding, trailOvershoot } = tweaks;

  const maxDrop = Math.max(0, activeScale - deselectScale);
  const dropAmount = Math.min(Math.max(0, trailOvershoot), maxDrop);
  const trailStartScale = activeScale - dropAmount;

  const paddingLimit = Math.max(0, itemHeight / 2 - 2);
  const highlightPaddingPx = Math.min(Math.max(highlightPadding, -paddingLimit), paddingLimit);

  const highlightHeightPx = Math.max(4, itemHeight - highlightPaddingPx * 2);

  return { trailStartScale, highlightPaddingPx, highlightHeightPx };
}

/**
 * Memoizes the highlight metrics for the picker surface.
 * @param {ResolvedHighlightMetricsArgs} args
 * @returns {HighlightMetrics}
 */
export function useHighlightMetrics({ itemHeight, tweaks }: HighlightMetricArgs): HighlightMetrics {
  const { activeScale, deselectScale, highlightPadding, trailOvershoot } = tweaks;

  return useMemo(
    () =>
      computeHighlightMetrics({
        itemHeight,
        tweaks: { activeScale, deselectScale, highlightPadding, trailOvershoot },
      }),
    [itemHeight, activeScale, deselectScale, highlightPadding, trailOvershoot]
  );
}
