import { useRef, useCallback } from 'react';
import type {
  SnapPhysicsConfig,
  DragContextFrame,
  SnapPhysicsState,
  SnapPhysicsResult,
} from '../types/snapPhysics';
import { debugSnapLog } from '../../utils/debug';
import {
  SNAP_AGGRESSIVE_ZONE_THRESHOLD,
  CENTER_LOCK_MAX_THRESHOLD,
  SNAP_ZONE_POWER_BASE,
  SNAP_ZONE_POWER_SCALE,
} from '../../config/physics';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function useSnapPhysics(config: SnapPhysicsConfig) {
  const stateRef = useRef<SnapPhysicsState>({ wasInSnapZone: false });

  const getVelocityScale = useCallback(
    (velocityY: number) => {
      if (!config.velocityScaling) return 1;
      const abs = Math.abs(velocityY);
      const ratio = clamp(abs / (config.velocityThreshold * 2), 0, 1);
      return 1 - ratio * config.velocityReducer;
    },
    [config.velocityScaling, config.velocityThreshold, config.velocityReducer]
  );

  const calculate = useCallback(
    (frame: DragContextFrame, snapTarget: number, itemHeight: number): SnapPhysicsResult => {
      if (!config.enabled) {
        return { mappedTranslate: frame.deltaY, inSnapZone: false };
      }

      const distanceToSnap = Math.abs(frame.deltaY - snapTarget);
      const snapZoneWidth = itemHeight * config.snapRange;
      const enterThresholdPx = itemHeight * config.enterThreshold;
      const exitThresholdPx = itemHeight * config.exitThreshold;
      const normalizedCenterLock = clamp(config.centerLock ?? 0, 0, 1);
      const wasInSnapZone = stateRef.current.wasInSnapZone;

      const entering = distanceToSnap < enterThresholdPx;
      const staying = wasInSnapZone && distanceToSnap < exitThresholdPx;
      const inSnapZone = entering || staying;

      // Only log state transitions (zone enter/exit), not every calculation
      if (inSnapZone !== wasInSnapZone) {
        debugSnapLog?.(inSnapZone ? 'snap zone entered' : 'snap zone exited', {
          distanceToSnap,
          snapTarget,
          delta: frame.deltaY,
        });
      }

      stateRef.current.wasInSnapZone = inSnapZone;

      if (!inSnapZone || snapZoneWidth === 0) {
        return { mappedTranslate: frame.deltaY, inSnapZone: false };
      }

      const proportionInZone = clamp(1 - distanceToSnap / snapZoneWidth, 0, 1);
      const basePull = config.pullStrength * getVelocityScale(frame.velocityY);
      const attraction = (snapTarget - frame.deltaY) * proportionInZone * basePull;
      const mappedTranslate = frame.deltaY + attraction;

      let stickTranslate = mappedTranslate;
      const baseStickRadius = exitThresholdPx * 0.5;
      let stickRadius = baseStickRadius * (1 - normalizedCenterLock);

      if (proportionInZone > SNAP_AGGRESSIVE_ZONE_THRESHOLD && stickRadius > 0) {
        stickTranslate = clamp(mappedTranslate, snapTarget - stickRadius, snapTarget + stickRadius);
      } else if (normalizedCenterLock >= CENTER_LOCK_MAX_THRESHOLD) {
        stickTranslate = snapTarget;
        stickRadius = 0;
      }

      let lockBlend = 0;
      if (normalizedCenterLock > 0 && stickTranslate !== snapTarget) {
        lockBlend = Math.min(
          1,
          normalizedCenterLock *
            Math.pow(
              proportionInZone,
              SNAP_ZONE_POWER_BASE + normalizedCenterLock * SNAP_ZONE_POWER_SCALE
            )
        );
        stickTranslate = stickTranslate + (snapTarget - stickTranslate) * lockBlend;
      }

      const result = {
        mappedTranslate: stickTranslate,
        inSnapZone: true,
        debug: {
          distanceToSnap,
          proportionInZone,
          appliedPullStrength: basePull,
          stickTranslate,
          stickRadius,
          lockBlend,
        },
      } as SnapPhysicsResult;

      return result;
    },
    [config, getVelocityScale]
  );

  const reset = useCallback(() => {
    stateRef.current.wasInSnapZone = false;
    debugSnapLog?.('snap reset');
  }, []);

  return { calculate, reset };
}
