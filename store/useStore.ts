import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import type { CalculationMethod, AsrMethod, HighLatitudeRule, TimeFormat, Theme, Coordinates } from '../types';

// Initialize MMKV
const storage = new MMKV();

// MMKV Adapter for Zustand
const mmkvStorage = {
    setItem: (name: string, value: string) => {
        return storage.set(name, value);
    },
    getItem: (name: string) => {
        return storage.getString(name) ?? null;
    },
    removeItem: (name: string) => {
        return storage.delete(name);
    },
};

// Interface
interface AppState {
    // Location
    location: Coordinates | null;
    city: string | null;
    country: string | null;
    timezone: string | null;
    isManualLocation: boolean;

    // Settings
    calculationMethod: CalculationMethod;
    asrMethod: AsrMethod;
    highLatitudeRule: HighLatitudeRule;
    timeFormat: TimeFormat;
    theme: Theme;
    language: string;

    // Notifications
    notifications: Record<string, boolean>; // prayerName -> enabled
    playAdhan: boolean;

    // Cache (YYYY-MM-DD -> { prayer: ISOString })
    prayerTimesCache: Record<string, Record<string, string>>;

    // Prayer Log (YYYY-MM-DD_prayerName -> boolean)
    prayerLog: Record<string, boolean>;

    // Actions
    setLocation: (loc: Coordinates, city?: string, country?: string, timezone?: string, isManual?: boolean) => void;
    setCalculationMethod: (method: CalculationMethod) => void;
    setAsrMethod: (method: AsrMethod) => void;
    setHighLatitudeRule: (rule: HighLatitudeRule) => void;
    setTimeFormat: (format: TimeFormat) => void;
    setTheme: (theme: Theme) => void;
    setLanguage: (lang: string) => void;
    toggleNotification: (prayerName: string, enabled: boolean) => void;
    setPlayAdhan: (enabled: boolean) => void;
    updatePrayerTimesCache: (cache: Record<string, Record<string, string>>) => void;
    togglePrayerPerformed: (date: string, prayerName: string) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Defaults
            location: null,
            city: null,
            country: null,
            timezone: null,
            isManualLocation: false,

            calculationMethod: 'MWL',
            asrMethod: 'Standard',
            highLatitudeRule: 'MiddleOfTheNight',
            timeFormat: '24h',
            theme: 'system',
            language: 'en',

            notifications: {
                fajr: true,
                sunrise: false,
                dhuhr: true,
                asr: true,
                maghrib: true,
                isha: true,
            },
            playAdhan: false,
            prayerTimesCache: {},
            prayerLog: {},

            // Actions
            setLocation: (loc, city, country, timezone, isManual) => set({
                location: loc,
                city: city || null,
                country: country || null,
                timezone: timezone || null,
                isManualLocation: isManual ?? false
            }),
            setCalculationMethod: (method) => set({ calculationMethod: method }),
            setAsrMethod: (method) => set({ asrMethod: method }),
            setHighLatitudeRule: (rule) => set({ highLatitudeRule: rule }),
            setTimeFormat: (format) => set({ timeFormat: format }),
            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            toggleNotification: (prayerName, enabled) => set((state) => ({
                notifications: { ...state.notifications, [prayerName]: enabled }
            })),
            setPlayAdhan: (enabled) => set({ playAdhan: enabled }),
            updatePrayerTimesCache: (cache) => set((state) => ({
                prayerTimesCache: { ...state.prayerTimesCache, ...cache }
            })),
            togglePrayerPerformed: (date, prayerName) => set((state) => {
                const key = `${date}_${prayerName}`;
                return {
                    prayerLog: { ...state.prayerLog, [key]: !state.prayerLog[key] }
                };
            }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() =>
                Platform.OS === 'web' ? localStorage : mmkvStorage
            ),
        }
    )
);
