/**
 * Zustand store unit tests
 * Ensures state updates and reset work correctly. Store is reset between tests.
 */

import { useStore } from '../store/useStore';

beforeEach(() => {
  useStore.getState().resetStore();
});

describe('useStore', () => {
  describe('setLocation and location state', () => {
    it('updates location, city, and country', () => {
      const coords = { latitude: 52.09, longitude: 5.12 };
      useStore.getState().setLocation(coords, 'Utrecht', 'Netherlands', 'Europe/Amsterdam', true);

      expect(useStore.getState().location).toEqual(coords);
      expect(useStore.getState().city).toBe('Utrecht');
      expect(useStore.getState().country).toBe('Netherlands');
      expect(useStore.getState().timezone).toBe('Europe/Amsterdam');
      expect(useStore.getState().isManualLocation).toBe(true);
    });
  });

  describe('updatePrayerTimesCache', () => {
    it('merges cache entries by date and prayer name', () => {
      const cache = {
        '2025-06-15': {
          fajr: '2025-06-15T00:24:00.000Z',
          dhuhr: '2025-06-15T10:10:00.000Z',
        },
      };
      useStore.getState().updatePrayerTimesCache(cache);

      expect(useStore.getState().prayerTimesCache['2025-06-15'].fajr).toBe(
        '2025-06-15T00:24:00.000Z'
      );
      expect(useStore.getState().prayerTimesCache['2025-06-15'].dhuhr).toBe(
        '2025-06-15T10:10:00.000Z'
      );
    });

    it('merges new dates without removing existing cache', () => {
      useStore.getState().updatePrayerTimesCache({
        '2025-06-15': { fajr: '2025-06-15T00:24:00.000Z' },
      });
      useStore.getState().updatePrayerTimesCache({
        '2025-06-16': { fajr: '2025-06-16T00:24:00.000Z' },
      });

      expect(Object.keys(useStore.getState().prayerTimesCache)).toContain('2025-06-15');
      expect(Object.keys(useStore.getState().prayerTimesCache)).toContain('2025-06-16');
    });
  });

  describe('resetStore', () => {
    it('clears location and restores defaults', () => {
      useStore.getState().setLocation(
        { latitude: 41, longitude: 29 },
        'Istanbul',
        'Turkey',
        undefined,
        true
      );
      useStore.getState().updatePrayerTimesCache({ '2025-01-01': { fajr: 'x' } });

      useStore.getState().resetStore();

      expect(useStore.getState().location).toBeNull();
      expect(useStore.getState().city).toBeNull();
      expect(useStore.getState().country).toBeNull();
      expect(useStore.getState().prayerTimesCache).toEqual({});
      expect(useStore.getState().calculationMethod).toBe('Turkey');
      expect(useStore.getState().viewMode).toBe('standart');
    });
  });
});
