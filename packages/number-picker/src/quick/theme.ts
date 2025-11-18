import type { CollapsiblePickerTheme } from './types';

export const DEFAULT_THEME: CollapsiblePickerTheme = {
    textColor: '#9DB1BE',
    activeTextColor: '#3EDCFF',
    unitColor: '#8E77B5',
    selectedColor: '#3EDCFF',
    pendingColor: '#74b9ff',
    hoverColor: 'rgba(62, 220, 255, 0.4)',
    flashColor: '#31E889',
    deselectColorA: '#FF3333',
    deselectColorB: '#AA0000',
    deselectColorOff: 'transparent',
    highlightBorderColor: 'rgba(62, 220, 255, 0.5)',
    highlightFillColor: 'rgba(62, 220, 255, 0.05)',
    backdropColor: 'rgba(0, 0, 0, 0.3)',
    fadeColor: '#0A0B0D',
    fontSize: 'clamp(24px, 6vw, 32px)',
    fontFamily: "'Geist Mono', monospace",
    // Closed state styling
    closedBorderColor: 'rgba(62, 220, 255, 0.5)', // Same as highlightBorderColor
    closedBorderColorEmpty: 'rgba(62, 220, 255, 0.2)', // Subtle cyan for empty state
    closedBackgroundColor: 'rgba(0, 0, 0, 0.5)',
    closedBackgroundColorEmpty: 'rgba(0, 0, 0, 0.3)',
    labelColor: '#8E77B5',
    lastValueButtonColor: '#3EDCFF',
    focusRingColor: 'rgba(62, 220, 255, 0.7)',
};

/**
 * Creates a theme by merging custom overrides with the default theme.
 *
 * Use this helper to customize specific theme properties while keeping defaults for others.
 *
 * @param {Partial<CollapsiblePickerTheme>} [overrides] - Theme properties to override
 * @returns {CollapsiblePickerTheme} Complete theme object with all required properties
 *
 * @example
 * ```tsx
 * const customTheme = buildTheme({
 *   activeTextColor: '#FF6B6B',
 *   highlightBorderColor: 'rgba(255, 107, 107, 0.5)',
 *   fadeColor: '#1A1A1A',
 * });
 *
 * <CollapsiblePicker theme={customTheme} ... />
 * ```
 */
export const buildTheme = (overrides?: Partial<CollapsiblePickerTheme>): CollapsiblePickerTheme => ({
    ...DEFAULT_THEME,
    ...overrides
});
