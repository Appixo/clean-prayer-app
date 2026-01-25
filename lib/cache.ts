import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { calculatePrayerTimes } from './prayer';
import { updateWidgetData } from './widget-bridge';

export function updatePrayerTimesCache() {
    const state = useStore.getState();
    const { location, calculationMethod, asrMethod, highLatitudeRule } = state;

    if (!location) return;

    const cache: Record<string, Record<string, string>> = {};
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        const times = calculatePrayerTimes(
            location,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            date
        );

        // Convert to ISO strings
        cache[dateKey] = {
            fajr: times.fajr.toISOString(),
            sunrise: times.sunrise.toISOString(),
            dhuhr: times.dhuhr.toISOString(),
            asr: times.asr.toISOString(),
            maghrib: times.maghrib.toISOString(),
            isha: times.isha.toISOString(),
        };
    }

    state.updatePrayerTimesCache(cache);
    console.log('Prayer times cache updated for 30 days');
    
    // Update widget when cache is updated (especially important for midnight updates)
    if (Platform.OS === 'android') {
        updateWidgetData().catch(() => {}); // Fire and forget
    }
}
