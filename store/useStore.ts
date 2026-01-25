import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import type { CalculationMethod, AsrMethod, HighLatitudeRule, TimeFormat, Theme, Coordinates, SavedLocation } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateWidgetData, persistWidgetConfigCache } from '../lib/widget-bridge';

// Middleware for persistence
interface AppState {
    // Location
    location: Coordinates | null;
    city: string | null;
    country: string | null;
    timezone: string | null;
    isManualLocation: boolean;
    savedLocations: SavedLocation[];
    selectedLocationId: string | null;

    // Settings
    calculationMethod: CalculationMethod;
    asrMethod: AsrMethod;
    highLatitudeRule: HighLatitudeRule;
    timeFormat: TimeFormat;
    theme: Theme;
    language: string;
    viewMode: 'basit' | 'standart' | 'gelismis';

    // Notifications
    notifications: Record<string, boolean>; // prayerName -> enabled
    playAdhan: boolean;
    isAdhanPlaying: boolean;
    preAlarms: Record<string, number>; // prayerName -> minutes before (0 = disabled)

    // Cache (YYYY-MM-DD -> { prayer: ISOString })
    prayerTimesCache: Record<string, Record<string, string>>;

    // Prayer Log (YYYY-MM-DD_prayerName -> boolean)
    prayerLog: Record<string, boolean>;

    // Zikirmatik History (YYYY-MM-DD -> count)
    zikirmatikHistory: Record<string, number>;

    // Actions
    setLocation: (loc: Coordinates, city?: string, country?: string, timezone?: string, isManual?: boolean) => void;
    addSavedLocation: (loc: SavedLocation) => void;
    removeSavedLocation: (id: string) => void;
    selectLocation: (id: string) => void;
    setCalculationMethod: (method: CalculationMethod) => void;
    setAsrMethod: (method: AsrMethod) => void;
    setHighLatitudeRule: (rule: HighLatitudeRule) => void;
    setTimeFormat: (format: TimeFormat) => void;
    setTheme: (theme: Theme) => void;
    setLanguage: (lang: string) => void;
    toggleNotification: (prayerName: string, enabled: boolean) => void;
    setPlayAdhan: (enabled: boolean) => void;
    setAdhanPlaying: (playing: boolean) => void;
    setPreAlarm: (prayerName: string, minutes: number) => void; // 0 = disabled
    updatePrayerTimesCache: (cache: Record<string, Record<string, string>>) => void;
    togglePrayerPerformed: (date: string, prayerName: string) => void;
    setViewMode: (mode: 'basit' | 'standart' | 'gelismis') => void;
    updateZikirmatikHistory: (date: string, count: number) => void;
    resetStore: () => void;
}

const detectSystemLanguage = (): string => {
    const locales = Localization.getLocales();
    const langCode = (locales && locales.length > 0 ? locales[0].languageCode : 'en') || 'en';

    // List of supported languages
    const supportedLanguages = ['tr', 'en', 'nl', 'ar'];

    // Return detected if supported, otherwise default to Turkish as requested for this app
    return supportedLanguages.includes(langCode) ? langCode : 'tr';
};

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Defaults
            location: null,
            city: null,
            country: null,
            timezone: null,
            isManualLocation: false,
            savedLocations: [],
            selectedLocationId: null,

            calculationMethod: 'Turkey',
            asrMethod: 'Standard',
            highLatitudeRule: 'MiddleOfTheNight',
            timeFormat: '24h',
            theme: 'system',
            language: 'tr',
            viewMode: 'standart',

            notifications: {
                fajr: false,
                sunrise: false,
                dhuhr: false,
                asr: false,
                maghrib: false,
                isha: false,
            },
            playAdhan: false,
            isAdhanPlaying: false,
            preAlarms: {
                fajr: 0,
                sunrise: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0,
            },
            prayerTimesCache: {},
            prayerLog: {},
            zikirmatikHistory: {},

            // Actions
            setLocation: (loc, city, country, timezone, isManual) => {
                set({
                    location: loc,
                    city: city || null,
                    country: country || null,
                    timezone: timezone || null,
                    isManualLocation: isManual ?? false
                });
                if (Platform.OS === 'android' && loc && city) {
                    persistWidgetConfigCache().catch(() => {});
                    updateWidgetData().catch(() => {});
                }
            },
            addSavedLocation: (loc) => set((state) => ({
                savedLocations: [...state.savedLocations, loc]
            })),
            removeSavedLocation: (id) => set((state) => {
                const filtered = state.savedLocations.filter(l => l.id !== id);

                // Prevent deleting last location
                if (filtered.length === 0) {
                    return state;
                }

                let nextSelectedId = state.selectedLocationId;
                let nextLoc = state.location;
                let nextCity = state.city;
                let nextCountry = state.country;

                // If deleted location was selected, switch to first available
                if (state.selectedLocationId === id && filtered.length > 0) {
                    const first = filtered[0];
                    nextSelectedId = first.id;
                    nextLoc = { latitude: first.latitude, longitude: first.longitude };
                    nextCity = first.city;
                    nextCountry = first.country;
                }

                return {
                    savedLocations: filtered,
                    selectedLocationId: nextSelectedId,
                    location: nextLoc,
                    city: nextCity,
                    country: nextCountry,
                    isManualLocation: true
                };
            }),
            selectLocation: (id) => {
                const state = useStore.getState();
                const found = state.savedLocations.find(l => l.id === id);
                if (found) {
                    set({
                        selectedLocationId: id,
                        location: { latitude: found.latitude, longitude: found.longitude },
                        city: found.city,
                        country: found.country,
                        isManualLocation: true
                    });
                    if (Platform.OS === 'android') {
                        persistWidgetConfigCache().catch(() => {});
                        updateWidgetData().catch(() => {});
                    }
                }
            },
            setCalculationMethod: (method) => {
                set({ calculationMethod: method });
                if (Platform.OS === 'android') updateWidgetData().catch(() => {});
            },
            setAsrMethod: (method) => {
                set({ asrMethod: method });
                if (Platform.OS === 'android') updateWidgetData().catch(() => {});
            },
            setHighLatitudeRule: (rule) => {
                set({ highLatitudeRule: rule });
                if (Platform.OS === 'android') updateWidgetData().catch(() => {});
            },
            setTimeFormat: (format) => set({ timeFormat: format }),
            setTheme: (theme) => {
                set({ theme });
                if (Platform.OS === 'android') updateWidgetData().catch(() => {});
            },
            setLanguage: (language) => set({ language }),
            toggleNotification: (prayerName, enabled) => set((state) => ({
                notifications: { ...state.notifications, [prayerName]: enabled }
            })),
            setPlayAdhan: (enabled) => set({ playAdhan: enabled }),
            setAdhanPlaying: (playing) => set({ isAdhanPlaying: playing }),
            setPreAlarm: (prayerName, minutes) => set((state) => ({
                preAlarms: { ...state.preAlarms, [prayerName]: minutes }
            })),
            updatePrayerTimesCache: (cache) => set((state) => ({
                prayerTimesCache: { ...state.prayerTimesCache, ...cache }
            })),
            togglePrayerPerformed: (date, prayerName) => set((state) => {
                const key = `${date}_${prayerName}`;
                return {
                    prayerLog: { ...state.prayerLog, [key]: !state.prayerLog[key] }
                };
            }),
            setViewMode: (mode) => set({ viewMode: mode }),
            updateZikirmatikHistory: (date, count) => set((state) => ({
                zikirmatikHistory: { ...state.zikirmatikHistory, [date]: count }
            })),
            resetStore: () => set({
                location: null,
                city: null,
                country: null,
                timezone: null,
                isManualLocation: false,
                savedLocations: [],
                selectedLocationId: null,
                calculationMethod: 'Turkey',
                asrMethod: 'Standard',
                highLatitudeRule: 'MiddleOfTheNight',
                timeFormat: '24h',
                theme: 'system',
                language: 'tr',
                viewMode: 'standart',
                notifications: {
                    fajr: false,
                    sunrise: false,
                    dhuhr: false,
                    asr: false,
                    maghrib: false,
                    isha: false,
                },
                playAdhan: false,
                isAdhanPlaying: false,
                prayerTimesCache: {},
                prayerLog: {},
                zikirmatikHistory: {},
            }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage instead of MMKV to prevent crashes
            partialize: (state) => {
                const { isAdhanPlaying, ...rest } = state;
                return rest;
            },
        }
    )
);
