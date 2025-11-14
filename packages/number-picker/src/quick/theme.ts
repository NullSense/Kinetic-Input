import { CollapsibleNumberPickerTheme } from './types';

export const DEFAULT_THEME: CollapsibleNumberPickerTheme = {
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

export const buildTheme = (overrides?: Partial<CollapsibleNumberPickerTheme>): CollapsibleNumberPickerTheme => ({
    ...DEFAULT_THEME,
    ...overrides
});
