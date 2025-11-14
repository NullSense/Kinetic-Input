import { describe, expect, it } from 'vitest';
import { isGestureEvent, type PickerGestureEvent } from '../types';

describe('PickerGestureEvent Types', () => {
  describe('isGestureEvent type guard', () => {
    it('correctly identifies drag:start events', () => {
      const event: PickerGestureEvent = {
        type: 'drag:start',
        timestamp: Date.now(),
        source: 'pointer',
      };

      expect(isGestureEvent(event, 'drag:start')).toBe(true);
      expect(isGestureEvent(event, 'drag:end')).toBe(false);
      expect(isGestureEvent(event, 'boundary:hit')).toBe(false);
    });

    it('correctly identifies drag:end events', () => {
      const event: PickerGestureEvent = {
        type: 'drag:end',
        timestamp: Date.now(),
        hasMoved: true,
        velocity: 1200,
      };

      expect(isGestureEvent(event, 'drag:end')).toBe(true);
      expect(isGestureEvent(event, 'drag:start')).toBe(false);
    });

    it('correctly identifies boundary:hit events', () => {
      const event: PickerGestureEvent = {
        type: 'boundary:hit',
        timestamp: Date.now(),
        boundary: 'max',
        value: 100,
      };

      expect(isGestureEvent(event, 'boundary:hit')).toBe(true);
      expect(isGestureEvent(event, 'value:visual')).toBe(false);
    });

    it('correctly identifies value:visual events', () => {
      const event: PickerGestureEvent = {
        type: 'value:visual',
        timestamp: Date.now(),
        value: 50,
        index: 5,
      };

      expect(isGestureEvent(event, 'value:visual')).toBe(true);
      expect(isGestureEvent(event, 'value:commit')).toBe(false);
    });

    it('correctly identifies value:commit events', () => {
      const event: PickerGestureEvent = {
        type: 'value:commit',
        timestamp: Date.now(),
        value: 75,
        index: 7,
      };

      expect(isGestureEvent(event, 'value:commit')).toBe(true);
      expect(isGestureEvent(event, 'drag:start')).toBe(false);
    });

    it('provides type narrowing in conditional blocks', () => {
      const event: PickerGestureEvent = {
        type: 'drag:start',
        timestamp: Date.now(),
        source: 'wheel',
      };

      if (isGestureEvent(event, 'drag:start')) {
        // TypeScript should know event.source exists
        expect(event.source).toBe('wheel');
      } else {
        throw new Error('Type guard failed');
      }
    });
  });

  describe('Event structure validation', () => {
    it('drag:start events have required fields', () => {
      const event: PickerGestureEvent = {
        type: 'drag:start',
        timestamp: 1234567890,
        source: 'pointer',
      };

      expect(event).toHaveProperty('type', 'drag:start');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('source');
    });

    it('drag:end events have required fields', () => {
      const event: PickerGestureEvent = {
        type: 'drag:end',
        timestamp: 1234567890,
        hasMoved: false,
        velocity: 0,
      };

      expect(event).toHaveProperty('type', 'drag:end');
      expect(event).toHaveProperty('hasMoved');
      expect(event).toHaveProperty('velocity');
    });

    it('boundary:hit events have required fields', () => {
      const event: PickerGestureEvent = {
        type: 'boundary:hit',
        timestamp: 1234567890,
        boundary: 'min',
        value: 0,
      };

      expect(event).toHaveProperty('boundary');
      expect(['min', 'max']).toContain(event.boundary);
    });
  });
});
