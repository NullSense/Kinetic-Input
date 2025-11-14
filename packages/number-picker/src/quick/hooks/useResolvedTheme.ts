import { useMemo } from 'react';
import { buildTheme } from '../theme';
import type { CollapsibleNumberPickerTheme } from '../types';

/**
 * Returns the memoized theme object merged with any overrides.
 * @param {Partial<CollapsibleNumberPickerTheme>|undefined} themeOverrides - Optional theme overrides.
 * @returns {CollapsibleNumberPickerTheme}
 */
export function useResolvedTheme(themeOverrides: Partial<CollapsibleNumberPickerTheme> | undefined): CollapsibleNumberPickerTheme {
    return useMemo(() => buildTheme(themeOverrides), [themeOverrides]);
}
