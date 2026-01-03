import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storageService } from './storage';
import { calculatePrayerTimes } from './prayer';
import { getCurrentLocation } from './location';
import { t } from './i18n';
import type { PrayerName } from '../types';
import { Audio } from 'expo-av';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});


/**
 * Requests notification permissions and sets up Android channels
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus === 'granted' && Platform.OS === 'android') {
        // Create notification channel for Adhan with custom sound
        await Notifications.setNotificationChannelAsync('adhan', {
            name: 'Adhan Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3b82f6',
            sound: 'adhan.mp3', // Needs to be in android/app/src/main/res/raw/ in proper build
        });

        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    return finalStatus === 'granted';
}

/**
 * Schedules notifications for a specific prayer for the next 7 days
 */
export async function schedulePrayerNotifications(prayerName: PrayerName) {
    if (Platform.OS === 'web') return;

    // First, cancel existing notifications for this prayer to avoid duplicates
    await cancelPrayerNotifications(prayerName);

    const isEnabled = storageService.getNotificationPreference(prayerName);
    if (!isEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const location = await getCurrentLocation();
    if (!location) return;

    const method = storageService.getCalculationMethod();
    const asrMethod = storageService.getAsrMethod();
    const highLatitudeRule = storageService.getHighLatitudeRule();
    const playAdhan = storageService.getPlayAdhan();

    const now = new Date();

    // Schedule for the next 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);

        const prayerTimes = calculatePrayerTimes(
            location.coordinates,
            method,
            asrMethod,
            highLatitudeRule,
            date
        );

        const prayerTime = prayerTimes[prayerName];
        if (prayerTime && prayerTime > now) {
            const isFriday = date.getDay() === 5;
            const nextPrayerName = t(prayerName);
            const displayName = (prayerName === 'dhuhr' && isFriday) ? t('jumuah') : nextPrayerName;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: t('prayerTimes'),
                    body: `${t('itsTimeFor')} ${displayName}`,
                    sound: playAdhan ? 'adhan.mp3' : true,
                    data: { prayerName },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: prayerTime,
                },
                identifier: `prayer_${prayerName}_${date.toISOString().split('T')[0]}`,
            });
        }
    }
}

/**
 * Cancels all scheduled notifications for a specific prayer
 */
export async function cancelPrayerNotifications(prayerName: PrayerName) {
    if (Platform.OS === 'web') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(notif =>
        notif.identifier.startsWith(`prayer_${prayerName}_`)
    );

    for (const notif of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
}

/**
 * Refreshes all scheduled notifications based on current preferences and location
 */
export async function refreshAllNotifications() {
    if (Platform.OS === 'web') return;

    const prayers: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const prayer of prayers) {
        const isEnabled = storageService.getNotificationPreference(prayer);
        if (isEnabled) {
            await schedulePrayerNotifications(prayer);
        }
    }
}

/**
 * Toggles notification preference and manages scheduling
 */
export async function toggleNotification(prayerName: PrayerName) {
    const current = storageService.getNotificationPreference(prayerName);
    const next = !current;

    storageService.setNotificationPreference(prayerName, next);

    if (next) {
        await schedulePrayerNotifications(prayerName);
    } else {
        await cancelPrayerNotifications(prayerName);
    }

    return next;
}

/**
 * Simulates a prayer notification immediately and plays audio
 */
export async function simulatePrayerNotification() {
    console.log('--- Prayer Simulation Triggered ---');

    // Play sound immediately using expo-av
    try {
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/adhan.mp3')
        );
        await sound.playAsync();
        console.log('Audio: Adhan sound started playing.');
    } catch (error) {
        console.error('Audio Error:', error);
    }

    // Trigger local notification
    if (Platform.OS !== 'web') {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
            const playAdhan = storageService.getPlayAdhan();
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🕌 ' + t('simulatePrayer'),
                    body: t('itsTimeFor') + ' ' + t('fajr') + ' (SIMULATION)',
                    sound: playAdhan ? 'adhan.mp3' : true,
                },
                trigger: null, // Trigger immediately
            });
            console.log('Notification: Immediate notification scheduled.');
        } else {
            console.warn('Notification: Permission denied.');
        }
    } else {
        console.log('Notification: Not available on web.');
    }
}


