import { Platform } from 'react-native';
import { logger } from './logger';
import { useStore } from '../store/useStore';
import { calculatePrayerTimes, formatPrayerTime } from './prayer';
import { getCurrentLocation } from './location';
import { t } from './i18n';
import type { PrayerName } from '../types';

// Conditional import for Notifee (Native only)
let notifee: any;
let AndroidImportance: any;
let AndroidNotificationSetting: any;
let AuthorizationStatus: any;
let EventType: any;
let TriggerType: any;
let AndroidCategory: any;
let AndroidLaunchActivityFlag: any;

if (Platform.OS !== 'web') {
    try {
        const NotifeeModule = require('@notifee/react-native');
        notifee = NotifeeModule.default;
        AndroidImportance = NotifeeModule.AndroidImportance;
        AndroidNotificationSetting = NotifeeModule.AndroidNotificationSetting;
        AuthorizationStatus = NotifeeModule.AuthorizationStatus;
        EventType = NotifeeModule.EventType;
        TriggerType = NotifeeModule.TriggerType;
        AndroidCategory = NotifeeModule.AndroidCategory;
        AndroidLaunchActivityFlag = NotifeeModule.AndroidLaunchActivityFlag;
    } catch (e) {
        logger.error('Failed to load @notifee/react-native', e);
    }
}

// Helper to get Notification IDs
const getNotificationId = (prayerName: string, dateStr: string) => `prayer_${prayerName}_${dateStr}`;

// Register Background Event
if (Platform.OS !== 'web' && notifee) {
    try {
        notifee.onBackgroundEvent(async ({ type, detail }: any) => {
            logger.info('Background Event Received', { type, detail: detail.pressAction?.id });

            // When notification is delivered, mark adhan as playing if needed
            if (type === EventType.DELIVERED && detail.notification?.id !== 'persistent_service') {
                const { playAdhan } = detail.notification?.data || {};
                if (playAdhan === 'true') {
                    useStore.getState().setAdhanPlaying(true);
                }
            }

            if (type === EventType.PRESS || (type === EventType.ACTION_PRESS && (detail.pressAction?.id === 'MARK_PRAYED' || detail.pressAction?.id === 'STOP_ADHAN'))) {
                const { prayerName, date } = detail.notification?.data || {};

                if (detail.pressAction?.id === 'MARK_PRAYED' && prayerName && date) {
                    useStore.getState().togglePrayerPerformed(date as string, prayerName as string);
                }

                // Stop foreground service if it was started
                const serviceId = detail.notification?.id + '_service';
                try {
                    await notifee.cancelNotification(serviceId);
                    await notifee.stopForegroundService();
                    useStore.getState().setAdhanPlaying(false);
                } catch (e) {
                    // Ignore errors if service wasn't running
                }

                if (detail.notification?.id && detail.pressAction?.id === 'MARK_PRAYED') {
                    await notifee.cancelNotification(detail.notification.id);
                }
            }
        });
    } catch (e) {
        logger.error('Failed to register Background Event', e);
    }
}

const handleMarkPrayed = async (notification: any) => {
    const { prayerName, date } = notification?.data || {};
    if (prayerName && date) {
        useStore.getState().togglePrayerPerformed(date as string, prayerName as string);

        if (notification?.id) {
            await notifee.cancelNotification(notification.id);
            logger.info('Notification cancelled after MARK_PRAYED', { id: notification.id });
        }
    }
};

export function setupNotificationListeners() {
    if (Platform.OS === 'web' || !notifee) return { remove: () => { } };

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }: any) => {
        logger.info('Foreground Event Received', { type });

        // ✅ Handle DELIVERED events to mark adhan as playing
        switch (type) {
            case EventType.DELIVERED:
                if (detail.notification?.id !== 'persistent_service') {
                    const { playAdhan } = detail.notification?.data || {};
                    if (playAdhan === 'true') {
                        useStore.getState().setAdhanPlaying(true);
                    }
                }
                break;
            case EventType.DISMISSED:
                useStore.getState().setAdhanPlaying(false);
                break;
            case EventType.PRESS:
                useStore.getState().setAdhanPlaying(false);
                break;
            case EventType.ACTION_PRESS:
                useStore.getState().setAdhanPlaying(false);
                if (detail.pressAction?.id === 'MARK_PRAYED') {
                    handleMarkPrayed(detail.notification);
                }
                break;
            default:
                break;
        }
    });

    return { remove: unsubscribe };
}

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web' || !notifee) return false;

    if (Platform.OS === 'android') {
        const settings = await notifee.getNotificationSettings();
        // With USE_EXACT_ALARM we don't need to manually redirect to settings
        // But we still check it for logging/diagnostic purposes
        if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
            logger.info('Exact alarms disabled by system policy or user');
        }

        // Optional: Check for battery optimizations on Samsung/Android
        const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
        if (batteryOptimizationEnabled) {
            logger.warn('Battery optimization enabled - notifications might be delayed by OS');
        }
    }

    const settings = await notifee.requestPermission();
    const isGranted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

    logger.info('Notification permission status', { isGranted, details: settings.authorizationStatus });

    if (isGranted) {
        await notifee.setNotificationCategories([
            {
                id: 'prayer',
                actions: [
                    {
                        id: 'MARK_PRAYED',
                        title: t('success'),
                    },
                    {
                        id: 'STOP_ADHAN',
                        title: t('silence'),
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

export async function checkBatteryOptimization() {
    if (Platform.OS !== 'android' || !notifee) return false;
    return await notifee.isBatteryOptimizationEnabled();
}

export async function checkExactAlarmStatus() {
    if (Platform.OS !== 'android' || !notifee) return true;
    const settings = await notifee.getNotificationSettings();
    return settings.android.alarm === AndroidNotificationSetting.ENABLED;
}

export async function requestBatteryOptimizationExemption() {
    if (Platform.OS !== 'android' || !notifee) return;
    await notifee.openBatteryOptimizationSettings();
}

/**
 * Consolidate and schedule all future prayer notifications.
 * This is the primary background scheduling logic.
 */
export async function scheduleDailyNotifications() {
    if (Platform.OS === 'web' || !notifee) return;

    try {
        // ✅ CRITICAL: Check/Request permissions before scheduling
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            logger.warn('Cannot schedule notifications: Permission denied');
            return;
        }

        // 1. Clear all existing triggers to avoid duplicates
        await notifee.cancelAllNotifications();
        logger.info('Cancelled all existing notifications for rescheduling');

        // 2. Ensure channels exist before scheduling
        if (Platform.OS === 'android') {
            try {
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
            } catch (channelError: any) {
                logger.error('Failed to create notification channels', {
                    error: channelError?.message || String(channelError),
                });
            }
        }

        const state = useStore.getState();
        const { location, calculationMethod, asrMethod, highLatitudeRule, playAdhan, notifications, preAlarms } = state;

        if (!location) {
            logger.warn('Cannot schedule notifications: No location');
            return;
        }

        const now = new Date();
        const scheduledCount = { triggers: 0 };

        // Schedule for next 7 days for robustness when app is killed
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const prayerTimesDaily = calculatePrayerTimes(
                location,
                calculationMethod,
                asrMethod,
                highLatitudeRule,
                date
            );

            const prayerNames: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

            for (const name of prayerNames) {
                // Check if notification is enabled for this specific prayer
                if (!notifications[name]) continue;

                const prayerTime = (prayerTimesDaily as any)[name];
                if (!prayerTime || prayerTime.getTime() <= now.getTime()) continue;

                const isFriday = date.getDay() === 5;
                const localizedName = (name === 'dhuhr' && isFriday) ? t('jumuah') : t(name);

                const notificationId = getNotificationId(name, dateStr);
                const channelId = playAdhan ? 'adhan' : 'default';

                const trigger = {
                    type: TriggerType.TIMESTAMP,
                    timestamp: prayerTime.getTime(),
                    alarmManager: {
                        allowWhileIdle: true,
                    },
                };

                const TIMEOUT_MS = 300000; // 5 minutes adhan timeout

                try {
                    await notifee.createTriggerNotification(
                        {
                            id: notificationId,
                            title: t('prayerTimes'),
                            body: `${t('itsTimeFor')} ${localizedName}`,
                            data: { prayerName: name, date: dateStr, playAdhan: playAdhan ? 'true' : 'false' },
                            android: {
                                channelId,
                                // CRITICAL FIX: Don't use asForegroundService for trigger notifications
                                // The foreground service will be started when notification is delivered
                                // Using it here causes "ForegroundServiceDidNotStartInTimeException"
                                asForegroundService: false,
                                asAlarm: true, // Specific requirement for high-priority triggers
                                ongoing: playAdhan,
                                loopSound: false,
                                timeoutAfter: playAdhan ? TIMEOUT_MS : undefined,
                                category: AndroidCategory.ALARM,
                                pressAction: {
                                    id: 'default',
                                    launchActivity: 'default',
                                },
                                actions: [
                                    {
                                        title: t('success'),
                                        pressAction: { id: 'MARK_PRAYED' },
                                    },
                                    {
                                        title: t('silence'),
                                        pressAction: { id: 'STOP_ADHAN' },
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
                    scheduledCount.triggers++;
                } catch (notificationError: any) {
                    logger.error(`Failed to schedule notification for ${name} on ${dateStr}`, {
                        error: notificationError?.message || String(notificationError),
                        notificationId,
                        prayerTime: prayerTime.toISOString(),
                    });
                    // Continue with other notifications even if one fails
                }

                // Schedule pre-alarm if configured
                const preAlarmMinutes = preAlarms[name] || 0;
                if (preAlarmMinutes > 0) {
                    const preAlarmTime = new Date(prayerTime.getTime() - (preAlarmMinutes * 60 * 1000));
                    if (preAlarmTime.getTime() > now.getTime()) {
                        const preAlarmId = `prealarm_${name}_${dateStr}`;
                        const preAlarmMessage = name === 'fajr' 
                            ? `${preAlarmMinutes} dakika sonra İmsak (Sahur için hazırlanın)`
                            : name === 'maghrib'
                            ? `${preAlarmMinutes} dakika sonra Akşam (İftar için hazırlanın)`
                            : `${preAlarmMinutes} dakika sonra ${localizedName}`;

                        try {
                            await notifee.createTriggerNotification(
                                {
                                    id: preAlarmId,
                                    title: t('prayerTimes'),
                                    body: preAlarmMessage,
                                    data: { prayerName: name, date: dateStr, isPreAlarm: true },
                                    android: {
                                        channelId: 'default',
                                        importance: AndroidImportance.HIGH,
                                        category: AndroidCategory.ALARM, // Changed from REMINDER to ALARM for more alarm-like behavior
                                        asAlarm: true, // Mark as alarm for better system integration
                                        pressAction: {
                                            id: 'default',
                                            launchActivity: 'default',
                                        },
                                        sound: 'default',
                                        vibration: true, // Add vibration for better alarm feel
                                        alarmManager: {
                                            allowWhileIdle: true,
                                        },
                                    },
                                    ios: {
                                        categoryId: 'prayer', // Use prayer category for consistency
                                        sound: 'default',
                                        interruptionLevel: 'timeSensitive', // iOS 15+ for more prominent alerts
                                    },
                                },
                                {
                                    type: TriggerType.TIMESTAMP,
                                    timestamp: preAlarmTime.getTime(),
                                    alarmManager: {
                                        allowWhileIdle: true,
                                    },
                                },
                            );
                            scheduledCount.triggers++;
                        } catch (preAlarmError: any) {
                            logger.error(`Failed to schedule pre-alarm for ${name} on ${dateStr}`, {
                                error: preAlarmError?.message || String(preAlarmError),
                                preAlarmId,
                            });
                            // Continue with other notifications even if pre-alarm fails
                        }
                    }
                }
            }
        }
        logger.info(`Successfully scheduled ${scheduledCount.triggers} notifications for the next 7 days`);
    } catch (e: any) {
        logger.error('Failed to schedule daily notifications', {
            error: e?.message || String(e),
            stack: e?.stack,
            name: e?.name,
        });
    }
}

export async function schedulePrayerNotifications(prayerName: PrayerName) {
    // Redirected to the consolidate scheduler to avoid logic duplication
    await scheduleDailyNotifications();
}

export async function cancelPrayerNotifications(prayerName: PrayerName) {
    if (Platform.OS === 'web' || !notifee) return;

    const now = new Date();
    const idsToCancel: string[] = [];

    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        idsToCancel.push(getNotificationId(prayerName, dateStr));
    }

    try {
        await notifee.cancelTriggerNotifications(idsToCancel);
        for (const id of idsToCancel) {
            await notifee.cancelNotification(id);
        }
    } catch (e) { }
}

export async function refreshAllNotifications() {
    await scheduleDailyNotifications();
    await updatePersistentNotification();
}

/**
 * Creates a persistent notification that keeps the app alive in memory.
 * Required for reliable background performance on restricted devices.
 */
export async function updatePersistentNotification() {
    if (Platform.OS !== 'android' || !notifee) return;

    try {
        const state = useStore.getState();
        const { location, calculationMethod, asrMethod, highLatitudeRule } = state;

        if (!location) return;

        const prayerTimes = calculatePrayerTimes(
            location,
            calculationMethod,
            asrMethod,
            highLatitudeRule,
            new Date()
        );

        if (!prayerTimes.nextPrayer) return;

        const isFriday = new Date().getDay() === 5;
        const nextPrayerName = prayerTimes.nextPrayer === 'dhuhr' && isFriday ? t('jumuah') : t(prayerTimes.nextPrayer);
        const nextPrayerTime = prayerTimes[prayerTimes.nextPrayer] as Date;

        const timeFormat = state.timeFormat === '12h';
        const formattedTime = formatPrayerTime(nextPrayerTime, timeFormat);

        // Ensure channel exists
        await notifee.createChannel({
            id: 'default',
            name: 'Default',
            importance: AndroidImportance.DEFAULT,
        });

        await notifee.displayNotification({
            id: 'persistent_service',
            title: t('prayerTimes'),
            body: `${t('nextPrayer')}: ${nextPrayerName} (${formattedTime})`,
            android: {
                channelId: 'default',
                asForegroundService: true, // Elevates process priority 24/7
                ongoing: true,
                autoCancel: false,
                category: AndroidCategory.SERVICE,
                pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                },
                color: '#3b82f6',
            },
        });
    } catch (e) {
        logger.error('Failed to update persistent notification', e);
    }
}

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

export async function stopAdhan() {
    if (Platform.OS === 'web' || !notifee) return;
    try {
        await notifee.stopForegroundService();
        useStore.getState().setAdhanPlaying(false);
    } catch (e) {
        logger.error('Error stopping adhan', e);
    }
}

export async function simulatePrayerNotification() {
    logger.info('--- Prayer Simulation (Notifee) ---');

    if (Platform.OS === 'web' || !notifee) {
        logger.info('--- WEB SIMULATION: Playing Adhan ---');
        console.log('Playing Adhan (Web Mock)');
        return;
    }

    const SIM_ID = 'simulation_prayer';
    await notifee.cancelNotification(SIM_ID);
    await notifee.stopForegroundService();

    const playAdhan = useStore.getState().playAdhan;
    const channelId = playAdhan ? 'adhan' : 'default';

    // Ensure channel exists before starting foreground service
    if (Platform.OS === 'android' && playAdhan) {
        await notifee.createChannel({
            id: 'adhan',
            name: 'Adhan Notifications',
            importance: AndroidImportance.HIGH,
            sound: 'adhan',
            vibration: true,
            badge: true,
        });
    }

    await notifee.displayNotification({
        id: SIM_ID,
        title: '🕌 ' + t('simulatePrayer'),
        body: t('itsTimeFor') + ' ' + t('fajr') + ' (SIMULATION)',
        data: { prayerName: 'fajr', date: new Date().toISOString().split('T')[0] },
        android: {
            channelId,
            asForegroundService: playAdhan,
            ongoing: playAdhan,
            loopSound: false,
            timeoutAfter: playAdhan ? 60000 : undefined,
            pressAction: { id: 'default' },
            actions: [
                { title: t('success'), pressAction: { id: 'MARK_PRAYED' } },
                { title: t('silence'), pressAction: { id: 'STOP_ADHAN' } }
            ],
            sound: playAdhan ? 'adhan' : 'default',
        },
    });
}
