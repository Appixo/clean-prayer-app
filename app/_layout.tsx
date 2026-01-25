// Register widget tasks BEFORE anything else
import '../widget-task-handler';

import '../global.css';
import { Stack } from 'expo-router';
import { useColorScheme, Platform, LogBox, Alert } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { refreshAllNotifications, setupNotificationListeners, checkBatteryOptimization, requestBatteryOptimizationExemption } from '../lib/notifications';
import { updatePrayerTimesCache } from '../lib/cache';
import { updateWidgetData } from '../lib/widget-bridge';
import { registerBackgroundFetch } from '../lib/background-fetch';
import { Settings as LuxonSettings } from 'luxon';
import { logger } from '../lib/logger';
import notifee from '@notifee/react-native';

// Suppress known warnings that are out of our control
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'Expo AV has been deprecated',
  'Battery optimization enabled', // We handle this manually
  "Couldn't find a navigation context", // react-native-css-interop issue
  'No task registered for key', // Widget background task warning (partial match)
]);

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
  console.log("RootLayout mounting...");
  const systemColorScheme = useColorScheme();
  const { colorScheme: nwColorScheme, setColorScheme: setNwColorScheme } = useNativeWindColorScheme();

  // Access store directly
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const playAdhan = useStore((state) => state.playAdhan);

  // Sync Language with Luxon
  useEffect(() => {
    LuxonSettings.defaultLocale = language;
  }, [language]);

  useEffect(() => {
    let notificationSubscription: { remove: () => void } | undefined;

    async function init() {
      try {
        logger.info('App initializing...');

        // ✅ CRITICAL: Always try to update widget on launch (uses config cache if no location in store)
        if (Platform.OS === 'android') {
          await updateWidgetData();
        }

        const state = useStore.getState();
        const hasLocation = state.location || state.savedLocations.length > 0;
        if (hasLocation) {
          refreshAllNotifications();
          updatePrayerTimesCache();
        } else {
          logger.info('No location configured, skipping notification refresh');
        }

        // Register background fetch for midnight updates
        if (Platform.OS === 'android') {
          await registerBackgroundFetch();
        }

        // Setup listeners (this is fine to always run)
        notificationSubscription = setupNotificationListeners();

        // Optional: Check battery optimization if Adhan is enabled
        if (state.playAdhan && Platform.OS === 'android') {
          const isOptimized = await checkBatteryOptimization();
          if (isOptimized) {
            logger.warn("Battery optimization is enabled, Adhan might be delayed.");
            // Optionally prompt user:
            // Alert.alert("Pil Optimizasyonu", "Ezan vakti bildirimlerinin zamanında gelmesi için pil optimizasyonunu kapatmanız önerilir.", [
            //    { text: "Kapat", onPress: () => requestBatteryOptimizationExemption() },
            //    { text: "Daha Sonra", style: "cancel" }
            // ]);
          }
        }

        logger.info('App initialization complete');
      } catch (e: any) {
        logger.error('Error during App initialization', e);
        // Log explicitly if it's an object to see properties
        if (typeof e === 'object' && e !== null) {
          logger.error('Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
        }
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
