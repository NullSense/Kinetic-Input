/**
 * Clamps a numeric value within the inclusive [min, max] range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Clamps an index to the valid bounds of the option array.
 * @param {number} index
 * @param {number} lastIndex
 * @returns {number}
 */
export const clampIndex = (index: number, lastIndex: number) =>
  clamp(index, 0, Math.max(0, lastIndex));

/**
 * Converts a translateY value into the nearest item index.
 * @param {number} translateY
 * @param {number} rowHeight
 * @param {number} maxTranslate
 * @returns {number}
 */
export const indexFromY = (translateY: number, rowHeight: number, maxTranslate: number) =>
  Math.round((maxTranslate - translateY) / rowHeight);

/**
 * Calculates the translateY offset for the provided index.
 * @param {number} index
 * @param {number} rowHeight
 * @param {number} maxTranslate
 * @param {number} lastIndex
 * @returns {number}
 */
export const yFromIndex = (
  index: number,
  rowHeight: number,
  maxTranslate: number,
  lastIndex: number
) => maxTranslate - clampIndex(index, lastIndex) * rowHeight;
