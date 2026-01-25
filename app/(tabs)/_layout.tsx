import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, Navigation2, Settings, CircleDot, BarChart3 } from 'lucide-react-native';
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
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 16), // Increased fallback for better Android spacing
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
                    paddingTop: 8,
                },
                headerStyle: {
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    height: Platform.OS === 'ios' ? 44 : 56, // Reduced from default ~96px
                },
                headerTintColor: isDark ? '#ffffff' : '#111827',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 16, // Smaller font size
                },
                headerTitleContainerStyle: {
                    paddingHorizontal: 0,
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
            {/* Hidden tabs - accessible from Settings */}
            <Tabs.Screen
                name="zikirmatik"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="kaza"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
