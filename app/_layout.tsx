import '../global.css';
import { Stack } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { refreshAllNotifications, setupNotificationListeners } from '../lib/notifications';
import { updatePrayerTimesCache } from '../lib/cache';
import { Settings as LuxonSettings } from 'luxon';
import { logger } from '../lib/logger';
import notifee from '@notifee/react-native';

// Register Notifee Foreground Service
// This MUST be registered at the root level to handle Adhan audio sessions
if (Platform.OS !== 'web') {
  notifee.registerForegroundService((notification) => {
    return new Promise(() => {
      logger.info('Foreground service started for notification', { id: notification.id });
      // The service will be stopped when stopForegroundService() is called from listeners
    });
  });
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { colorScheme: nwColorScheme, setColorScheme: setNwColorScheme } = useNativeWindColorScheme();

  // Access store directly
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);

  // Sync Language with Luxon
  useEffect(() => {
    LuxonSettings.defaultLocale = language;
  }, [language]);

  useEffect(() => {
    let notificationSubscription: { remove: () => void } | undefined;

    async function init() {
      try {
        logger.info('App initializing...');

        // ✅ CRITICAL: Only refresh notifications/cache if location already exists
        const state = useStore.getState();
        const hasLocation = state.location || state.savedLocations.length > 0;

        if (hasLocation) {
          // Only run these if user has configured location
          refreshAllNotifications();
          updatePrayerTimesCache();
        } else {
          logger.info('No location configured, skipping notification refresh');
        }

        // Setup listeners (this is fine to always run)
        notificationSubscription = setupNotificationListeners();
        logger.info('App initialization complete');
      } catch (e) {
        logger.error('Error during App initialization', e);
      }
    }
    init();

    return () => {
      if (notificationSubscription?.remove) {
        notificationSubscription.remove();
      }
    };
  }, []); // ✅ Empty dependency array - run ONCE only

  // Sync Theme
  useEffect(() => {
    if (theme === 'system') {
      setNwColorScheme(systemColorScheme || 'light');
    } else {
      setNwColorScheme(theme);
    }
  }, [theme, systemColorScheme, setNwColorScheme]);

  return (
    <>
      <StatusBar style={nwColorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: nwColorScheme === 'dark' ? '#1f2937' : '#ffffff',
          },
          headerTintColor: nwColorScheme === 'dark' ? '#ffffff' : '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Kurulum',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: 'Hakkında',
          }}
        />
        {/* <Stack.Screen
          name="qibla"
          options={{
            title: 'Qibla Direction',
          }}
        /> */}
      </Stack>
    </>
  );
}
