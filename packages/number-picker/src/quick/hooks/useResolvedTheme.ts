import { useMemo } from 'react';
import { buildTheme } from '../theme';
import type { CollapsiblePickerTheme } from '../types';

/**
 * Returns the memoized theme object merged with any overrides.
 * @param {Partial<CollapsiblePickerTheme>|undefined} themeOverrides - Optional theme overrides.
 * @returns {CollapsiblePickerTheme}
 */
export function useResolvedTheme(
  themeOverrides: Partial<CollapsiblePickerTheme> | undefined
): CollapsiblePickerTheme {
  return useMemo(() => buildTheme(themeOverrides), [themeOverrides]);
}
