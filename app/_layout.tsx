import '../global.css';
import { Stack } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { storageService } from '../lib/storage';
import { initLanguage } from '../lib/i18n';
import { refreshAllNotifications } from '../lib/notifications';

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { colorScheme: nwColorScheme, setColorScheme: setNwColorScheme } = useNativeWindColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      await storageService.initialize();
      initLanguage(); // Sync language from storage
      refreshAllNotifications(); // Refresh notifications in background

      // Get user's theme preference and sync with NativeWind
      const savedTheme = storageService.getTheme();
      if (savedTheme === 'system') {
        setNwColorScheme(systemColorScheme || 'light');
      } else {
        setNwColorScheme(savedTheme as 'light' | 'dark');
      }

      setIsReady(true);
    }
    init();
  }, [systemColorScheme, setNwColorScheme]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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

