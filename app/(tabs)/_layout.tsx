import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, Navigation2, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: '#2563EB', // Blue 600
                tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
                tabBarStyle: {
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderTopColor: isDark ? '#374151' : '#e5e7eb',
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10), // Use actual inset or fallback
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                },
                headerStyle: {
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                },
                headerTintColor: isDark ? '#ffffff' : '#111827',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Vakitler',
                    tabBarLabel: 'Vakitler',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Dini Günler',
                    tabBarLabel: 'Dini Günler',
                    tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="qibla"
                options={{
                    title: 'Kıble',
                    tabBarLabel: 'Kıble',
                    tabBarIcon: ({ color, size }) => <Navigation2 size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarLabel: 'Ayarlar',
                    tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
