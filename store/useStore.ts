import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import type { CalculationMethod, AsrMethod, HighLatitudeRule, TimeFormat, Theme, Coordinates, SavedLocation } from '../types';

// MMKV Adapter for Zustand - Lazy loaded to prevent crashes on Web
const getStorage = () => {
    if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage : {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
        };
    }

    try {
        const { MMKV } = require('react-native-mmkv');
        const storage = new MMKV();
        return {
            setItem: (name: string, value: string) => storage.set(name, value),
            getItem: (name: string) => storage.getString(name) ?? null,
            removeItem: (name: string) => storage.delete(name),
        };
    } catch (e) {
        // Suppress noisy error if native module is missing (e.g. on wrong client)
        // console.error('MMKV not available, falling back to basic storage', e); // Original line, if it existed
        // Assuming 'logger' is defined elsewhere or intended to be a simple console.warn
        console.warn('MMKV not available, falling back to basic storage', e);
        return {
            setItem: () => { },
            getItem: () => null,
            removeItem: () => { },
        };
    }
};

// Interface
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
    viewLevel: 1 | 2 | 3;

    // Notifications
    notifications: Record<string, boolean>; // prayerName -> enabled
    playAdhan: boolean;
    isAdhanPlaying: boolean;

    // Cache (YYYY-MM-DD -> { prayer: ISOString })
    prayerTimesCache: Record<string, Record<string, string>>;

    // Prayer Log (YYYY-MM-DD_prayerName -> boolean)
    prayerLog: Record<string, boolean>;

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
    updatePrayerTimesCache: (cache: Record<string, Record<string, string>>) => void;
    togglePrayerPerformed: (date: string, prayerName: string) => void;
    setViewLevel: (level: 1 | 2 | 3) => void;
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
            viewLevel: 2,

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

            // Actions
            setLocation: (loc, city, country, timezone, isManual) => set({
                location: loc,
                city: city || null,
                country: country || null,
                timezone: timezone || null,
                isManualLocation: isManual ?? false
            }),
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
            selectLocation: (id) => set((state) => {
                const found = state.savedLocations.find(l => l.id === id);
                if (found) {
                    return {
                        selectedLocationId: id,
                        location: { latitude: found.latitude, longitude: found.longitude },
                        city: found.city,
                        country: found.country,
                        isManualLocation: true
                    };
                }
                return state;
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
            setAdhanPlaying: (playing) => set({ isAdhanPlaying: playing }),
            updatePrayerTimesCache: (cache) => set((state) => ({
                prayerTimesCache: { ...state.prayerTimesCache, ...cache }
            })),
            togglePrayerPerformed: (date, prayerName) => set((state) => {
                const key = `${date}_${prayerName}`;
                return {
                    prayerLog: { ...state.prayerLog, [key]: !state.prayerLog[key] }
                };
            }),
            setViewLevel: (level) => set({ viewLevel: level }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => {
                const { isAdhanPlaying, ...rest } = state;
                return rest;
            },
        }
    )
);
