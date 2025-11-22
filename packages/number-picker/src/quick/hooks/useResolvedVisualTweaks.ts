import { useMemo } from 'react';
import type { CollapsiblePickerVisualTweaks } from '../types';

export interface ResolvedVisualTweaks {
  activeScale: number;
  deselectScale: number;
  colorTransitionMs: number;
  scaleTransitionMs: number;
  colorEasing: string;
  scaleEasing: string;
  deselectFadeMs: number;
  deselectOpacity: number;
  trailOvershoot: number;
  highlightPadding: number;
}

const DEFAULT_TWEAKS: ResolvedVisualTweaks = {
  activeScale: 1.4,
  deselectScale: 0.95,
  colorTransitionMs: 100,
  scaleTransitionMs: 100,
  colorEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  scaleEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  deselectFadeMs: 150,
  deselectOpacity: 0.44,
  trailOvershoot: 0.08,
  highlightPadding: 0,
};

/**
 * Merges provided visual tweak overrides with defaults for highlight spacing.
 * @param {CollapsiblePickerVisualTweaks|undefined} overrides
 * @returns {ResolvedVisualTweaks}
 */
export function useResolvedVisualTweaks(
  overrides: CollapsiblePickerVisualTweaks | undefined
): ResolvedVisualTweaks {
  return useMemo(() => {
    if (!overrides) {
      return DEFAULT_TWEAKS;
    }

    const transitionMs = overrides.transitionMs;
    return {
      activeScale: overrides.activeScale ?? DEFAULT_TWEAKS.activeScale,
      deselectScale: overrides.deselectScale ?? DEFAULT_TWEAKS.deselectScale,
      colorTransitionMs:
        overrides.colorTransitionMs ?? transitionMs ?? DEFAULT_TWEAKS.colorTransitionMs,
      scaleTransitionMs:
        overrides.scaleTransitionMs ?? transitionMs ?? DEFAULT_TWEAKS.scaleTransitionMs,
      colorEasing: overrides.colorEasing ?? DEFAULT_TWEAKS.colorEasing,
      scaleEasing: overrides.scaleEasing ?? DEFAULT_TWEAKS.scaleEasing,
      deselectFadeMs: overrides.deselectFadeMs ?? DEFAULT_TWEAKS.deselectFadeMs,
      deselectOpacity: overrides.deselectOpacity ?? DEFAULT_TWEAKS.deselectOpacity,
      trailOvershoot: overrides.trailOvershoot ?? DEFAULT_TWEAKS.trailOvershoot,
      highlightPadding: overrides.highlightPadding ?? DEFAULT_TWEAKS.highlightPadding,
    };
  }, [overrides]);
}
