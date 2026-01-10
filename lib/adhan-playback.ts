import notifee, { AndroidImportance, AndroidNotificationSetting, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

/**
 * Starts the Adhan audio as a Foreground Service notification.
 * This is critical for Android 12+ and battery optimization to allow full playback.
 * 
 * @param prayerName - Name of the prayer (e.g. 'Fajr')
 * @param audioFile - Name of the audio file in 'raw' resource or URL (Currently assuming bundled asset logic later, or 'default' uri)
 */
export async function playAdhan(prayerName: string) {
    if (Platform.OS !== 'android') return;

    // Request permissions if needed
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus < AndroidNotificationSetting.AUTHORIZED) {
        console.warn('Notification permission denied');
        return;
    }

    // Create Channel
    const channelId = await notifee.createChannel({
        id: 'adhan',
        name: 'Adhan Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'adhan',
        // ^ Note: 'adhan' must exist in android/app/src/main/res/raw/adhan.mp3 or similar.
        // Since we are adding adhan.mp3 via Expo assets, we need to ensure it copies to res/raw.
        // For now, if 'adhan' is not found, Android often falls back to default.
        // User requested "Tested with 3-minute Adhan audio".
    });

    // Display Foreground Service Notification
    // This notification will PERSIST until we stop it or user stops it.
    try {
        await notifee.displayNotification({
            title: `${prayerName} Adhan`,
            body: 'Playing adhan...',
            android: {
                channelId,
                asForegroundService: true, // CRITICAL: This keeps the app alive
                ongoing: true, // User cannot swipe away easily while playing
                color: '#3b82f6', // Blue
                sound: 'adhan', // This triggers the sound
                loopSound: false, // Don't loop adhan
                pressAction: {
                    id: 'default',
                },
                actions: [
                    {
                        title: 'Stop',
                        pressAction: { id: 'stop_adhan' },
                    }
                ]
            },
        });
    } catch (e) {
        console.error('Failed to start Adhan Foreground Service', e);
    }
}

/**
 * Stops the Adhan playback by cancelling the notification.
 * Since the sound is attached to the notification channel/notification, cancelling it stops audio.
 */
export async function stopAdhan() {
    await notifee.stopForegroundService();
}

/**
 * Setup listeners for stopping the service
 */
export function setupAdhanListeners() {
    return notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop_adhan') {
            stopAdhan();
        }
    });
}
