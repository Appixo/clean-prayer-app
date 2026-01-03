import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
  TimeFormat,
  Theme,
  Coordinates,
} from '../types';

// Web-compatible storage interface
interface SyncStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number) => void;
  getNumber: (key: string) => number | undefined;
  delete: (key: string) => void;
  clearAll: () => void;
}

// In-memory cache for synchronous access
const memoryCache: Record<string, string | number | undefined> = {};

// Helper to update cache
const updateCache = (key: string, value: string | number | undefined) => {
  if (value === undefined) {
    delete memoryCache[key];
  } else {
    memoryCache[key] = value;
  }
};

// Storage keys
const KEYS = {
  CALCULATION_METHOD: 'calculation_method',
  ASR_METHOD: 'asr_method',
  HIGH_LATITUDE_RULE: 'high_latitude_rule',
  MANUAL_LOCATION_LAT: 'manual_location_lat',
  MANUAL_LOCATION_LONG: 'manual_location_long',
  MANUAL_LOCATION_NAME: 'manual_location_name',
  TIME_FORMAT: 'time_format',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
  PLAY_ADHAN: 'play_adhan',
} as const;

// Default values
const DEFAULTS = {
  CALCULATION_METHOD: 'MWL' as CalculationMethod,
  ASR_METHOD: 'Standard' as AsrMethod,
  HIGH_LATITUDE_RULE: 'MiddleOfTheNight' as HighLatitudeRule,
  TIME_FORMAT: '24h' as TimeFormat,
  THEME: 'system' as Theme,
} as const;

// Internal implementation
const nativeAsyncStorage = {
  get: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    AsyncStorage.setItem(key, value).catch(console.error);
  },
  delete: (key: string) => {
    AsyncStorage.removeItem(key).catch(console.error);
  },
  clear: () => {
    AsyncStorage.clear().catch(console.error);
  }
};

export const storageService = {
  /**
   * Initialize storage by loading all keys into memory.
   * Call this at app launch.
   */
  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      // Web is synchronous (localStorage), so we just read on demand or pre-fill cache
      // To keep logic consistent, we can pre-fill
      Object.values(KEYS).forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) memoryCache[key] = val;
      });
      return;
    }

    // Native: Load all keys
    try {
      const keys = Object.values(KEYS);
      const stores = await AsyncStorage.multiGet(keys);
      stores.forEach(([key, value]) => {
        if (value !== null) {
          memoryCache[key] = value;
        }
      });
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  },

  // GETTERS (Synchronous from Cache)

  // Method helpers to parse values
  _getString(key: string): string | undefined {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key) || undefined;
    }
    const val = memoryCache[key];
    return typeof val === 'string' ? val : undefined;
  },

  _getNumber(key: string): number | undefined {
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      return val ? parseFloat(val) : undefined;
    }
    const val = memoryCache[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val);
    return undefined;
  },

  // ... (Other specific getters below)

  getCalculationMethod(): CalculationMethod {
    const value = this._getString(KEYS.CALCULATION_METHOD);
    return (value as CalculationMethod) || DEFAULTS.CALCULATION_METHOD;
  },

  setCalculationMethod(method: CalculationMethod): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.CALCULATION_METHOD, method);
    } else {
      updateCache(KEYS.CALCULATION_METHOD, method);
      nativeAsyncStorage.set(KEYS.CALCULATION_METHOD, method);
    }
  },

  getAsrMethod(): AsrMethod {
    const value = this._getString(KEYS.ASR_METHOD);
    return (value as AsrMethod) || DEFAULTS.ASR_METHOD;
  },

  setAsrMethod(method: AsrMethod): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.ASR_METHOD, method);
    } else {
      updateCache(KEYS.ASR_METHOD, method);
      nativeAsyncStorage.set(KEYS.ASR_METHOD, method);
    }
  },

  getHighLatitudeRule(): HighLatitudeRule {
    const value = this._getString(KEYS.HIGH_LATITUDE_RULE);
    return (value as HighLatitudeRule) || DEFAULTS.HIGH_LATITUDE_RULE;
  },

  setHighLatitudeRule(rule: HighLatitudeRule): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.HIGH_LATITUDE_RULE, rule);
    } else {
      updateCache(KEYS.HIGH_LATITUDE_RULE, rule);
      nativeAsyncStorage.set(KEYS.HIGH_LATITUDE_RULE, rule);
    }
  },

  getManualLocation(): Coordinates | null {
    const lat = this._getNumber(KEYS.MANUAL_LOCATION_LAT);
    const long = this._getNumber(KEYS.MANUAL_LOCATION_LONG);

    if (lat !== undefined && long !== undefined && !isNaN(lat) && !isNaN(long)) {
      return { latitude: lat, longitude: long };
    }
    return null;
  },

  setManualLocation(coordinates: Coordinates | null, name?: string): void {
    if (Platform.OS === 'web') {
      if (coordinates) {
        localStorage.setItem(KEYS.MANUAL_LOCATION_LAT, String(coordinates.latitude));
        localStorage.setItem(KEYS.MANUAL_LOCATION_LONG, String(coordinates.longitude));
        if (name) {
          localStorage.setItem(KEYS.MANUAL_LOCATION_NAME, name);
        }
      } else {
        localStorage.removeItem(KEYS.MANUAL_LOCATION_LAT);
        localStorage.removeItem(KEYS.MANUAL_LOCATION_LONG);
        localStorage.removeItem(KEYS.MANUAL_LOCATION_NAME);
      }
    } else {
      if (coordinates) {
        updateCache(KEYS.MANUAL_LOCATION_LAT, coordinates.latitude);
        updateCache(KEYS.MANUAL_LOCATION_LONG, coordinates.longitude);
        nativeAsyncStorage.set(KEYS.MANUAL_LOCATION_LAT, String(coordinates.latitude));
        nativeAsyncStorage.set(KEYS.MANUAL_LOCATION_LONG, String(coordinates.longitude));
        if (name) {
          updateCache(KEYS.MANUAL_LOCATION_NAME, name);
          nativeAsyncStorage.set(KEYS.MANUAL_LOCATION_NAME, name);
        }
      } else {
        updateCache(KEYS.MANUAL_LOCATION_LAT, undefined);
        updateCache(KEYS.MANUAL_LOCATION_LONG, undefined);
        updateCache(KEYS.MANUAL_LOCATION_NAME, undefined);
        nativeAsyncStorage.delete(KEYS.MANUAL_LOCATION_LAT);
        nativeAsyncStorage.delete(KEYS.MANUAL_LOCATION_LONG);
        nativeAsyncStorage.delete(KEYS.MANUAL_LOCATION_NAME);
      }
    }
  },

  getManualLocationName(): string | null {
    const name = this._getString(KEYS.MANUAL_LOCATION_NAME);
    return name || null;
  },

  getTimeFormat(): TimeFormat {
    const value = this._getString(KEYS.TIME_FORMAT);
    return (value as TimeFormat) || DEFAULTS.TIME_FORMAT;
  },

  setTimeFormat(format: TimeFormat): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.TIME_FORMAT, format);
    } else {
      updateCache(KEYS.TIME_FORMAT, format);
      nativeAsyncStorage.set(KEYS.TIME_FORMAT, format);
    }
  },

  getTheme(): Theme {
    const value = this._getString(KEYS.THEME);
    return (value as Theme) || DEFAULTS.THEME;
  },

  setTheme(theme: Theme): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.THEME, theme);
    } else {
      updateCache(KEYS.THEME, theme);
      nativeAsyncStorage.set(KEYS.THEME, theme);
    }
  },

  // Language (Added here to centralize storage keys)
  getLanguage(): string | null {
    if (Platform.OS === 'web') {
      return localStorage.getItem(KEYS.LANGUAGE);
    }
    return this._getString(KEYS.LANGUAGE) || null;
  },

  setLanguage(lang: string): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.LANGUAGE, lang);
    } else {
      updateCache(KEYS.LANGUAGE, lang);
      nativeAsyncStorage.set(KEYS.LANGUAGE, lang);
    }
  },

  getNotificationPreference(prayerName: string): boolean {
    const prefs = this._getString(KEYS.NOTIFICATIONS);
    if (!prefs) return false;
    try {
      const parsed = JSON.parse(prefs);
      return !!parsed[prayerName];
    } catch {
      return false;
    }
  },

  setNotificationPreference(prayerName: string, enabled: boolean): void {
    const prefs = this._getString(KEYS.NOTIFICATIONS);
    let parsed: Record<string, boolean> = {};
    if (prefs) {
      try {
        parsed = JSON.parse(prefs);
      } catch { }
    }
    parsed[prayerName] = enabled;
    const stringified = JSON.stringify(parsed);

    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.NOTIFICATIONS, stringified);
    } else {
      updateCache(KEYS.NOTIFICATIONS, stringified);
      nativeAsyncStorage.set(KEYS.NOTIFICATIONS, stringified);
    }
  },

  getPlayAdhan(): boolean {
    const val = this._getString(KEYS.PLAY_ADHAN);
    return val === 'true'; // Default to false
  },

  setPlayAdhan(enabled: boolean): void {
    const val = String(enabled);
    if (Platform.OS === 'web') {
      localStorage.setItem(KEYS.PLAY_ADHAN, val);
    } else {
      updateCache(KEYS.PLAY_ADHAN, val);
      nativeAsyncStorage.set(KEYS.PLAY_ADHAN, val);
    }
  },


  clearAll(): void {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
      nativeAsyncStorage.clear();
    }
  },
};
