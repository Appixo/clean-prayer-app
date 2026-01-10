import notifee, {
    AndroidImportance,
    AndroidNotificationSetting,
    EventType,
    TimestampTrigger,
    TriggerType,
    Event
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { calculatePrayerTimes } from './prayer';
import { getCurrentLocation } from './location';
import { t } from './i18n';
import type { PrayerName } from '../types';

// Helper to get Notification IDs
const getNotificationId = (prayerName: string, dateStr: string) => `prayer_${prayerName}_${dateStr}`;

// Register Background Event (Must be outside component)
notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'MARK_PRAYED') {
        const { prayerName, date } = detail.notification?.data || {};
        // Access store directly carefully, or better, just import it. 
        // Note: AsyncStorage/MMKV works in background usually.
        if (prayerName && date) {
            useStore.getState().togglePrayerPerformed(date as string, prayerName as string);

            if (detail.notification?.id) {
                await notifee.cancelNotification(detail.notification.id);
            }
        }
    }
});

/**
 * Sets up foreground event listeners for Notifee
 */
export function setupNotificationListeners() {
    return notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'MARK_PRAYED') {
            const { prayerName, date } = detail.notification?.data || {};
            if (prayerName && date) {
                useStore.getState().togglePrayerPerformed(date as string, prayerName as string);

                if (detail.notification?.id) {
                    notifee.cancelNotification(detail.notification.id);
                }
            }
        }
    });
}

/**
 * Requests notification permissions and sets up Channels/Categories
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    // Check for Alarm Permission on Android 12+
    if (Platform.OS === 'android') {
        const settings = await notifee.getNotificationSettings();
        if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
            // We could prompt user to open settings, but for now just request notification perm
            // Real production app should have a UI flow for this.
            // await notifee.openAlarmPermissionSettings();
        }
    }

    const settings = await notifee.requestPermission();
    const isGranted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

    if (isGranted) {
        // Setup Categories (Actions)
        await notifee.setNotificationCategories([
            {
                id: 'prayer',
                actions: [
                    {
                        id: 'MARK_PRAYED',
                        title: t('success'),
                    },
                ],
            },
        ]);

        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: 'adhan',
                name: 'Adhan Notifications',
                importance: AndroidImportance.HIGH,
                sound: 'adhan',
                vibration: true,
                badge: true,
            });

            await notifee.createChannel({
                id: 'default',
                name: 'Default',
                importance: AndroidImportance.DEFAULT,
                sound: 'default',
            });
        }
    }

    return isGranted;
}

/**
 * Schedules notifications for a specific prayer for the next 7 days
 */
export async function schedulePrayerNotifications(prayerName: PrayerName) {
    if (Platform.OS === 'web') return;

    await cancelPrayerNotifications(prayerName);

    const isEnabled = useStore.getState().notifications[prayerName];
    if (!isEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const location = await getCurrentLocation();
    if (!location) return;

    const { calculationMethod, asrMethod, highLatitudeRule, playAdhan } = useStore.getState();
    const now = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const prayerTimes = calculatePrayerTimes(
            location.coordinates,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            date
        );

        const prayerTime = prayerTimes[prayerName];

        if (prayerTime && prayerTime.getTime() > now.getTime()) {
            const isFriday = date.getDay() === 5;
            const nextPrayerName = t(prayerName);
            const displayName = (prayerName === 'dhuhr' && isFriday) ? t('jumuah') : nextPrayerName;

            const notificationId = getNotificationId(prayerName, dateStr);
            const channelId = playAdhan ? 'adhan' : 'default';

            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: prayerTime.getTime(),
                alarmManager: {
                    allowWhileIdle: true,
                },
            };

            // Auto dismiss after 3 mins + buffer = 3.5 mins (210000ms)
            // or 5 mins (300000ms)
            const TIMEOUT_MS = 300000;

            try {
                await notifee.createTriggerNotification(
                    {
                        id: notificationId,
                        title: t('prayerTimes'),
                        body: `${t('itsTimeFor')} ${displayName}`,
                        data: { prayerName, date: dateStr },
                        android: {
                            channelId,
                            asForegroundService: playAdhan,
                            ongoing: playAdhan,
                            loopSound: false, // Explicitly no loop
                            timeoutAfter: playAdhan ? TIMEOUT_MS : undefined, // Native auto-dismiss
                            pressAction: {
                                id: 'default',
                            },
                            actions: [
                                {
                                    title: t('success'),
                                    pressAction: {
                                        id: 'MARK_PRAYED',
                                    },
                                }
                            ],
                            sound: playAdhan ? 'adhan' : 'default',
                        },
                        ios: {
                            categoryId: 'prayer',
                            sound: playAdhan ? 'adhan.wav' : 'default',
                        },
                    },
                    trigger,
                );
            } catch (e) {
                console.warn(`Failed to schedule ${prayerName} for ${dateStr}`, e);
            }
        }
    }
}

/**
 * Cancels all scheduled notifications for a specific prayer
 */
export async function cancelPrayerNotifications(prayerName: PrayerName) {
    if (Platform.OS === 'web') return;

    const now = new Date();
    const idsToCancel: string[] = [];

    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        idsToCancel.push(getNotificationId(prayerName, dateStr));
    }

    await notifee.cancelTriggerNotifications(idsToCancel);
    for (const id of idsToCancel) {
        await notifee.cancelNotification(id);
    }
}

/**
 * Refreshes all scheduled notifications
 */
export async function refreshAllNotifications() {
    if (Platform.OS === 'web') return;

    const prayers: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const prayer of prayers) {
        if (useStore.getState().notifications[prayer]) {
            await schedulePrayerNotifications(prayer);
        } else {
            await cancelPrayerNotifications(prayer);
        }
    }
}

/**
 * Toggles notification preference
 */
export async function toggleNotification(prayerName: PrayerName) {
    const current = useStore.getState().notifications[prayerName];
    const next = !current;

    useStore.getState().toggleNotification(prayerName, next);

    if (next) {
        await schedulePrayerNotifications(prayerName);
    } else {
        await cancelPrayerNotifications(prayerName);
    }

    return next;
}

/**
 * Simulates a prayer notification immediately
 */
export async function simulatePrayerNotification() {
    console.log('--- Prayer Simulation (Notifee) ---');

    if (Platform.OS === 'web') {
        alert('Simulation: Adhan (Not available on web)');
        return;
    }

    const playAdhan = useStore.getState().playAdhan;
    const channelId = playAdhan ? 'adhan' : 'default';

    await notifee.displayNotification({
        title: '🕌 ' + t('simulatePrayer'),
        body: t('itsTimeFor') + ' ' + t('fajr') + ' (SIMULATION)',
        data: { prayerName: 'fajr', date: new Date().toISOString().split('T')[0] },
        android: {
            channelId,
            asForegroundService: playAdhan,
            ongoing: playAdhan,
            loopSound: false,
            timeoutAfter: playAdhan ? 60000 : undefined, // 1 min for simulation
            pressAction: { id: 'default' },
            actions: [{ title: t('success'), pressAction: { id: 'MARK_PRAYED' } }],
        },
    });
}
