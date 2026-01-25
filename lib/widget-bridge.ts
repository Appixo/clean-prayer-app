import { Platform, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { calculatePrayerTimes, formatPrayerTime, getNextPrayer } from './prayer';
import { formatHijriDate } from './hijri';
import { useStore } from '../store/useStore';
import { t } from './i18n';
import type { WidgetConfigCache } from './widget-prayer-calc';
import { computeFullWidgetPayloadFromConfig } from './widget-prayer-calc';

/** Single source of truth for all widgets; written as soon as we have data. */
export const WIDGET_DATA_KEY = '@widget_data';
/** Legacy key for backward compatibility when reading in the widget task handler. */
export const LEGACY_WIDGET_DATA_KEY = '@prayer_times_widget_data';
const WIDGET_CONFIG_CACHE_KEY = '@widget_config_cache';

/** All registered widget names – must call updateWidget for each so they refresh. */
export const WIDGET_NAMES = ['PrayerTimesWidget', 'NextPrayerWidget', 'DailyScheduleWidget'] as const;

export type WidgetTheme = 'light' | 'dark';

export interface UnifiedWidgetPayload {
    city: string;
    date: string;
    hijriDate: string;
    nextPrayerName: string;
    nextPrayerTime: string;
    theme: WidgetTheme;
    prayerTimes: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };
    timeUntilNextMs: number | null;
    nextPrayer: string | null;
}

// Conditional import for widget library
let WidgetTask: any;
if (Platform.OS === 'android') {
    try {
        const WidgetModule = require('react-native-android-widget');
        WidgetTask = WidgetModule.WidgetTask;
    } catch (e) {
        logger.error('Failed to load react-native-android-widget', e);
    }
}

function resolveTheme(storeTheme: 'light' | 'dark' | 'system'): WidgetTheme {
    if (storeTheme !== 'system') return storeTheme;
    return (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
}

/**
 * Persists current location + calculation config for widget fail-safe hydration.
 * Call whenever location or calculation settings change.
 */
export async function persistWidgetConfigCache(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
        const state = useStore.getState();
        const { location, city, calculationMethod, asrMethod, highLatitudeRule, timeFormat } = state;
        if (!location || !city) return;

        const cache: WidgetConfigCache = {
            latitude: location.latitude,
            longitude: location.longitude,
            city,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            timeFormat,
        };
        await AsyncStorage.setItem(WIDGET_CONFIG_CACHE_KEY, JSON.stringify(cache));
    } catch (e: any) {
        logger.warn('Failed to persist widget config cache', { message: e?.message });
    }
}

/**
 * Pushes prayer times data to the widget storage.
 * Uses store when available; if store has no location, tries @widget_config_cache and recalculates.
 */
export async function updateWidgetData() {
    if (Platform.OS !== 'android' || !WidgetTask) {
        return;
    }

    try {
        const state = useStore.getState();
        const { location, city, calculationMethod, asrMethod, highLatitudeRule, timeFormat } = state;

        if (!location || !city) {
            const raw = await AsyncStorage.getItem(WIDGET_CONFIG_CACHE_KEY);
            if (raw) {
                try {
                    const config = JSON.parse(raw) as WidgetConfigCache;
                    const full = computeFullWidgetPayloadFromConfig(config);
                    const theme = resolveTheme(state.theme);
                    const payload: UnifiedWidgetPayload = { ...full, theme };
                    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(payload));
                    if (__DEV__) {
                        logger.info('Widget payload written (config cache)', {
                            key: WIDGET_DATA_KEY,
                            city: payload.city,
                            nextPrayerName: payload.nextPrayerName,
                            nextPrayerTime: payload.nextPrayerTime,
                        });
                    }
                    for (const name of WIDGET_NAMES) {
                        try { await WidgetTask.updateWidget(name, payload); } catch (_) {}
                    }
                    logger.info('Widget updated from config cache');
                } catch (e: any) {
                    logger.warn('Widget update from cache failed', { message: e?.message });
                }
            } else {
                logger.warn('Cannot update widget: Missing location and no config cache');
            }
            return;
        }

        const now = new Date();
        const prayerTimes = calculatePrayerTimes(
            location,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            now
        );

        const { nextPrayer, nextPrayerTime } = getNextPrayer(prayerTimes, now);

        if (!nextPrayer || !nextPrayerTime) {
            logger.warn('Cannot update widget: No next prayer found');
            return;
        }

        // Format date
        const dateStr = now.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long',
        });

        // Get Hijri date
        const hijriDate = formatHijriDate(now);

        // Format prayer name (handle Friday/Jumuah)
        const isFriday = now.getDay() === 5;
        const prayerName = nextPrayer === 'dhuhr' && isFriday ? t('jumuah') : t(nextPrayer);

        const formattedTime = formatPrayerTime(nextPrayerTime, timeFormat === '12h');
        const timeUntilNextMs = prayerTimes.timeUntilNext;
        const theme = resolveTheme(state.theme);

        const formatTime = (d: Date) => formatPrayerTime(d, timeFormat === '12h');
        const payload: UnifiedWidgetPayload = {
            city,
            date: dateStr,
            hijriDate,
            nextPrayerName: prayerName,
            nextPrayerTime: formattedTime,
            theme,
            prayerTimes: {
                fajr: formatTime(prayerTimes.fajr),
                sunrise: formatTime(prayerTimes.sunrise),
                dhuhr: formatTime(prayerTimes.dhuhr),
                asr: formatTime(prayerTimes.asr),
                maghrib: formatTime(prayerTimes.maghrib),
                isha: formatTime(prayerTimes.isha),
            },
            timeUntilNextMs: timeUntilNextMs ?? null,
            nextPrayer: nextPrayer,
        };

        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(payload));
        await AsyncStorage.setItem(LEGACY_WIDGET_DATA_KEY, JSON.stringify({
            city: payload.city,
            date: payload.date,
            hijriDate: payload.hijriDate,
            nextPrayerName: payload.nextPrayerName,
            nextPrayerTime: payload.nextPrayerTime,
        }));
        if (__DEV__) {
            logger.info('Widget payload written', {
                key: WIDGET_DATA_KEY,
                city: payload.city,
                nextPrayerName: payload.nextPrayerName,
                nextPrayerTime: payload.nextPrayerTime,
            });
        }

        const configCache: WidgetConfigCache = {
            latitude: location.latitude,
            longitude: location.longitude,
            city,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            timeFormat,
        };
        await AsyncStorage.setItem(WIDGET_CONFIG_CACHE_KEY, JSON.stringify(configCache));

        if (WidgetTask) {
            for (const name of WIDGET_NAMES) {
                try {
                    await WidgetTask.updateWidget(name, payload);
                } catch (error: any) {
                    logger.warn('Widget update failed for ' + name, { message: error?.message });
                }
            }
        }

        logger.info('Widget data updated successfully', { city, nextPrayer: prayerName });
    } catch (error: any) {
        logger.error('Failed to update widget data', {
            error: error?.message || String(error),
            stack: error?.stack,
        });
    }
}

/**
 * Updates widget when location changes
 */
export async function updateWidgetOnLocationChange() {
    await updateWidgetData();
}

/**
 * Updates widget when prayer times are recalculated
 */
export async function updateWidgetOnPrayerTimesUpdate() {
    await updateWidgetData();
}
