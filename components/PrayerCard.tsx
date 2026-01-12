import * as Haptics from 'expo-haptics';
import { Bell, Check } from 'lucide-react-native';
import { t } from '../lib/i18n';
import { toggleNotification } from '../lib/notifications';
import { useStore } from '../store/useStore';
import type { PrayerTimeData } from '../types';
import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, useColorScheme } from 'react-native';

interface PrayerCardProps {
  prayer: PrayerTimeData;
  isActive?: boolean;
}

export function PrayerCard({ prayer, isActive = false }: PrayerCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isSunrise = prayer.name.toLowerCase() === 'sunrise' || prayer.displayName === 'Güneş';

  // Subscribe to specific notification preference
  const notificationsEnabled = useStore((state) => state.notifications[prayer.name]);

  // Prayed Status
  const dateKey = prayer.time.toISOString().split('T')[0];
  const prayerKey = `${dateKey}_${prayer.name}`;
  const isPrayed = useStore((state) => !!state.prayerLog[prayerKey]);
  const togglePrayerPerformed = useStore((state) => state.togglePrayerPerformed);

  const handleToggleNotification = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleNotification(prayer.name);
  }, [prayer.name]);

  const handleTogglePrayed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePrayerPerformed(dateKey, prayer.name);
  }, [dateKey, prayer.name, togglePrayerPerformed]);

  // Define conditional styles manually to avoid NativeWind interop issues during rapid state flips
  const getContainerStyle = () => {
    if (isPrayed) {
      return {
        backgroundColor: isDark ? 'rgba(6, 78, 59, 0.1)' : '#ecfdf5',
        borderColor: isDark ? 'rgba(6, 95, 70, 0.3)' : '#a7f3d0',
      };
    }
    if (isActive) {
      return {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: '#3b82f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      };
    }
    if (isSunrise) {
      return {
        backgroundColor: isDark ? 'rgba(69, 26, 3, 0.1)' : '#fffbeb',
        borderColor: isDark ? 'rgba(120, 53, 15, 0.3)' : '#fef3c7',
      };
    }
    return {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.5)' : '#f9fafb',
      borderColor: isDark ? '#1f2937' : '#f3f4f6',
    };
  };

  const getTextStyle = () => {
    if (isPrayed) return { color: isDark ? '#34d399' : '#047857' };
    if (isActive) return { color: isDark ? '#60a5fa' : '#2563eb' };
    if (isSunrise) return { color: isDark ? '#fcd34d' : '#b45309' };
    return { color: isDark ? '#f3f4f6' : '#111827' };
  };

  const containerStyle = getContainerStyle();
  const textStyle = getTextStyle();

  return (
    <TouchableOpacity
      onPress={!isSunrise ? handleTogglePrayed : undefined}
      activeOpacity={isSunrise ? 1 : 0.7}
      style={[styles.card, containerStyle]}
      className="p-5 rounded-3xl mb-3 flex-row items-center border"
    >
      {/* Checkmark Area */}
      {isSunrise ? (
        <View style={{ width: 32 }} className="mr-4 items-center">
          <Text style={{ fontSize: 20 }}>☀️</Text>
        </View>
      ) : (
        <View
          style={[
            styles.checkCircle,
            isPrayed ? styles.checkCirclePrayed : (isActive ? styles.checkCircleActive : styles.checkCircleInactive),
            { borderColor: isPrayed ? '#10b981' : (isActive ? '#3b82f6' : (isDark ? '#374151' : '#e5e7eb')) }
          ]}
          className="w-8 h-8 rounded-full border-2 items-center justify-center mr-4"
        >
          {isPrayed && (
            <Check size={18} color="white" strokeWidth={4} />
          )}
        </View>
      )}

      {/* Prayer Info */}
      <View className="flex-1">
        <Text
          style={textStyle}
          className="font-bold text-lg"
        >
          {prayer.displayName}
          {isPrayed && ' ✓'}
        </Text>
        {isActive && !isPrayed && (
          <Text className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-0.5">
            {t('nextPrayer')}
          </Text>
        )}
      </View>

      {/* Right Section: Time and Notifications */}
      <View className="flex-row items-center gap-4">
        <Text
          style={textStyle}
          className="text-xl font-bold"
        >
          {prayer.formattedTime}
        </Text>

        {isSunrise ? (
          <View style={{ width: 24 }} />
        ) : (
          <TouchableOpacity
            onPress={handleToggleNotification}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            {notificationsEnabled ? (
              <Bell
                size={20}
                color={isPrayed ? '#10b981' : '#3b82f6'}
                fill={isPrayed ? '#10b981' : '#3b82f6'}
              />
            ) : (
              <Bell
                size={20}
                color="#9ca3af"
                style={{ opacity: 0.4 }}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    // Structural styles remain in className, colors moved here
  },
  checkCircle: {
    // Colors handled dynamically in the component
  },
  checkCirclePrayed: {
    backgroundColor: '#10b981',
  },
  checkCircleActive: {
    // Border handles color
  },
  checkCircleInactive: {
    // Border handles color
  }
});

