import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell, CheckCircle } from 'lucide-react-native';
import type { PrayerTimeData } from '../types';
import { t } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { toggleNotification } from '../lib/notifications';

interface PrayerCardProps {
  prayer: PrayerTimeData;
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const isSunrise = prayer.name === 'sunrise';
  // Subscribe to specific notification preference
  const notificationsEnabled = useStore((state) => state.notifications[prayer.name]);

  // Prayed Status
  const dateKey = prayer.time.toISOString().split('T')[0];
  const prayerKey = `${dateKey}_${prayer.name}`;
  const isPrayed = useStore((state) => !!state.prayerLog[prayerKey]);
  const togglePrayerPerformed = useStore((state) => state.togglePrayerPerformed);

  const handleToggleNotification = () => {
    toggleNotification(prayer.name);
  };

  const handleTogglePrayed = () => {
    togglePrayerPerformed(dateKey, prayer.name);
  };

  return (
    <View
      className={`p-3 rounded-xl mb-2 ${prayer.isNext
        ? 'bg-blue-500 dark:bg-blue-600'
        : isSunrise
          ? 'bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800/50'
          : 'bg-gray-100 dark:bg-gray-800'
        }`}
    >
      <View className="flex-row justify-between items-center">
        {/* Left Side: Name and Status */}
        <View className="flex-1 mr-4">
          <View className="flex-row items-center">
            <Text
              className={`text-base font-semibold ${prayer.isNext
                ? 'text-white'
                : isSunrise
                  ? 'text-amber-900 dark:text-amber-200'
                  : 'text-gray-900 dark:text-gray-100'
                } ${isPrayed ? 'line-through opacity-60' : ''}`}
            >
              {prayer.displayName}
            </Text>
            {isPrayed && (
              <View className="ml-2 bg-green-500 rounded-full p-0.5">
                <CheckCircle size={12} color="white" />
              </View>
            )}
          </View>

          {prayer.isNext && (
            <Text className="text-white text-xs mt-0.5 opacity-90">
              {t('nextPrayer')}
            </Text>
          )}
        </View>

        {/* Right Side: Time and Actions */}
        <View className="flex-row items-center gap-3">
          {/* Mark as Prayed Checkbox */}
          {!isSunrise && (
            <TouchableOpacity onPress={handleTogglePrayed}>
              <View className={`w-6 h-6 rounded-full border items-center justify-center ${isPrayed
                  ? 'bg-green-500 border-green-500'
                  : (prayer.isNext ? 'border-white/50' : 'border-gray-400 dark:border-gray-500')
                }`}>
                {isPrayed && <CheckCircle size={16} color="white" />}
              </View>
            </TouchableOpacity>
          )}

          <Text
            className={`text-lg font-bold ${prayer.isNext
              ? 'text-white'
              : isSunrise
                ? 'text-amber-900 dark:text-amber-200'
                : 'text-gray-900 dark:text-gray-100'
              }`}
          >
            {prayer.formattedTime}
          </Text>

          <TouchableOpacity
            onPress={handleToggleNotification}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {notificationsEnabled ? (
              <Bell
                size={20}
                color={prayer.isNext ? '#ffffff' : (isSunrise ? '#78350f' : '#3b82f6')}
                fill={prayer.isNext ? '#ffffff' : (isSunrise ? '#78350f' : '#3b82f6')}
              />
            ) : (
              <Bell
                size={20}
                color={prayer.isNext ? '#ffffff' : (isSunrise ? '#78350f' : '#9ca3af')}
                style={{ opacity: 0.6 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
