import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import type {
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
  TimeFormat,
  Theme,
  Coordinates,
} from '../types';

// Initialize MMKV
export const storage = new MMKV();

// Storage keys
export const KEYS = {
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

// Helper for Web compatibility (localStorage) vs Native (MMKV)
const getIt = (key: string): string | undefined => {
  if (Platform.OS === 'web') return localStorage.getItem(key) || undefined;
  return storage.getString(key);
};

const setIt = (key: string, value: string) => {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else storage.set(key, value);
};

const delIt = (key: string) => {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else storage.delete(key);
};

export const storageService = {
  /**
   * No-op for MMKV/LocalStorage as they are synchronous.
   * Kept for backward compatibility.
   */
  async initialize(): Promise<void> {
    return Promise.resolve();
  },

  getCalculationMethod(): CalculationMethod {
    const value = getIt(KEYS.CALCULATION_METHOD);
    return (value as CalculationMethod) || DEFAULTS.CALCULATION_METHOD;
  },

  setCalculationMethod(method: CalculationMethod): void {
    setIt(KEYS.CALCULATION_METHOD, method);
  },

  getAsrMethod(): AsrMethod {
    const value = getIt(KEYS.ASR_METHOD);
    return (value as AsrMethod) || DEFAULTS.ASR_METHOD;
  },

  setAsrMethod(method: AsrMethod): void {
    setIt(KEYS.ASR_METHOD, method);
  },

  getHighLatitudeRule(): HighLatitudeRule {
    const value = getIt(KEYS.HIGH_LATITUDE_RULE);
    return (value as HighLatitudeRule) || DEFAULTS.HIGH_LATITUDE_RULE;
  },

  setHighLatitudeRule(rule: HighLatitudeRule): void {
    setIt(KEYS.HIGH_LATITUDE_RULE, rule);
  },

  getManualLocation(): Coordinates | null {
    const latStr = getIt(KEYS.MANUAL_LOCATION_LAT);
    const longStr = getIt(KEYS.MANUAL_LOCATION_LONG);

    if (latStr && longStr) {
      const lat = parseFloat(latStr);
      const long = parseFloat(longStr);
      if (!isNaN(lat) && !isNaN(long)) {
        return { latitude: lat, longitude: long };
      }
    }
    return null;
  },

  setManualLocation(coordinates: Coordinates | null, name?: string): void {
    if (coordinates) {
      setIt(KEYS.MANUAL_LOCATION_LAT, String(coordinates.latitude));
      setIt(KEYS.MANUAL_LOCATION_LONG, String(coordinates.longitude));
      if (name) {
        setIt(KEYS.MANUAL_LOCATION_NAME, name);
      }
    } else {
      delIt(KEYS.MANUAL_LOCATION_LAT);
      delIt(KEYS.MANUAL_LOCATION_LONG);
      delIt(KEYS.MANUAL_LOCATION_NAME);
    }
  },

  getManualLocationName(): string | null {
    return getIt(KEYS.MANUAL_LOCATION_NAME) || null;
  },

  getTimeFormat(): TimeFormat {
    const value = getIt(KEYS.TIME_FORMAT);
    return (value as TimeFormat) || DEFAULTS.TIME_FORMAT;
  },

  setTimeFormat(format: TimeFormat): void {
    setIt(KEYS.TIME_FORMAT, format);
  },

  getTheme(): Theme {
    const value = getIt(KEYS.THEME);
    return (value as Theme) || DEFAULTS.THEME;
  },

  setTheme(theme: Theme): void {
    setIt(KEYS.THEME, theme);
  },

  getLanguage(): string | null {
    return getIt(KEYS.LANGUAGE) || null;
  },

  setLanguage(lang: string): void {
    setIt(KEYS.LANGUAGE, lang);
  },

  getNotificationPreference(prayerName: string): boolean {
    const prefs = getIt(KEYS.NOTIFICATIONS);
    if (!prefs) return false;
    try {
      const parsed = JSON.parse(prefs);
      return !!parsed[prayerName];
    } catch {
      return false;
    }
  },

  setNotificationPreference(prayerName: string, enabled: boolean): void {
    const prefs = getIt(KEYS.NOTIFICATIONS);
    let parsed: Record<string, boolean> = {};
    if (prefs) {
      try {
        parsed = JSON.parse(prefs);
      } catch { }
    }
    parsed[prayerName] = enabled;
    setIt(KEYS.NOTIFICATIONS, JSON.stringify(parsed));
  },

  getPlayAdhan(): boolean {
    const val = getIt(KEYS.PLAY_ADHAN);
    return val === 'true'; // Default to false
  },

  setPlayAdhan(enabled: boolean): void {
    setIt(KEYS.PLAY_ADHAN, String(enabled));
  },

  clearAll(): void {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      storage.clearAll();
    }
  },
};
