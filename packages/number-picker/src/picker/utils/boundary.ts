import {
  MAX_OVERSCROLL_PIXELS,
  MAX_OVERSCROLL_RATIO,
  OVERSCROLL_DAMPING_EXPONENT,
} from '../../config/physics';
import { clampIndex, indexFromY } from './math';

export interface BoundaryConstraints {
  minTranslate: number;
  maxTranslate: number;
  itemHeight: number;
  lastIndex: number;
}

export const MOMENTUM_OVERSHOOT_CAP = 20;

const getMaxOverscrollDistance = (itemHeight: number) =>
  Math.min(MAX_OVERSCROLL_PIXELS, itemHeight * MAX_OVERSCROLL_RATIO);

export function applyOverscrollDamping(position: number, constraints: BoundaryConstraints): number {
  const { minTranslate, maxTranslate, itemHeight } = constraints;
  const maxOverscroll = getMaxOverscrollDistance(itemHeight);

  if (position < minTranslate) {
    const distance = minTranslate - position;
    const limitedDistance = Math.min(distance, maxOverscroll);
    const overscroll = Math.pow(limitedDistance, OVERSCROLL_DAMPING_EXPONENT);
    return minTranslate - overscroll;
  }

  if (position > maxTranslate) {
    const distance = position - maxTranslate;
    const limitedDistance = Math.min(distance, maxOverscroll);
    const overscroll = Math.pow(limitedDistance, OVERSCROLL_DAMPING_EXPONENT);
    return maxTranslate + overscroll;
  }

  return position;
}

export function resolveBoundaryIndex(position: number, constraints: BoundaryConstraints): number {
  const { minTranslate, maxTranslate, itemHeight, lastIndex } = constraints;

  if (position < minTranslate) return lastIndex;
  if (position > maxTranslate) return 0;

  const index = indexFromY(position, itemHeight, maxTranslate);
  return clampIndex(index, lastIndex);
}

export function constrainMomentumToBoundary(
  boundaryType: 'min' | 'max',
  rawPosition: number,
  constraints: BoundaryConstraints,
  overshootCap: number = MOMENTUM_OVERSHOOT_CAP
) {
  const { minTranslate, maxTranslate, itemHeight } = constraints;
  const boundary = boundaryType === 'min' ? minTranslate : maxTranslate;

  const overshootLimit = Math.min(overshootCap, getMaxOverscrollDistance(itemHeight));

  const overshoot = Math.abs(rawPosition - boundary);
  const cappedOvershoot = Math.min(overshoot, overshootLimit);
  const cappedPosition = boundaryType === 'min' ? boundary - cappedOvershoot : boundary + cappedOvershoot;
  const dampedPosition = applyOverscrollDamping(cappedPosition, constraints);
  const boundaryIndex = resolveBoundaryIndex(boundary, constraints);

  return {
    boundary,
    boundaryIndex,
    overshoot,
    cappedOvershoot,
    cappedPosition,
    dampedPosition,
  } as const;
}
