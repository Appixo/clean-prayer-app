import '../global.css';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { refreshAllNotifications, setupNotificationListeners } from '../lib/notifications';
import { updatePrayerTimesCache } from '../lib/cache';
import { Settings as LuxonSettings } from 'luxon';

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
      // Refresh notifications in background on app start
      refreshAllNotifications();
      // Update cache
      updatePrayerTimesCache();
      // Setup listeners
      notificationSubscription = setupNotificationListeners();
    }
    init();

    return () => {
      notificationSubscription && notificationSubscription.remove();
    };
  }, []);

  // Sync Theme
  useEffect(() => {
    if (theme === 'system') {
      setNwColorScheme(systemColorScheme || 'light');
    } else {
      setNwColorScheme(theme);
    }
  }, [theme, systemColorScheme, setNwColorScheme]);

  // MMKV is synchronous, so we don't strictly need a loading state for storage.
  // Unless we want to show a splash screen for other reasons.
  // For now, render immediately.

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
          name="index"
          options={{
            title: 'Prayer Times',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: 'About',
          }}
        />
      </Stack>
    </>
  );
}
