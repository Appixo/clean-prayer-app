import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import type { PrayerTimeData } from '../types';
import { t } from '../lib/i18n';
import { storageService } from '../lib/storage';
import { toggleNotification } from '../lib/notifications';

interface PrayerCardProps {
  prayer: PrayerTimeData;
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const isSunrise = prayer.name === 'sunrise';
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(storageService.getNotificationPreference(prayer.name));
  }, [prayer.name]);

  const handleToggleNotification = async () => {
    const newValue = await toggleNotification(prayer.name);
    setNotificationsEnabled(newValue);
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
        <View className="flex-1 mr-4">
          <Text
            className={`text-base font-semibold ${prayer.isNext
              ? 'text-white'
              : isSunrise
                ? 'text-amber-900 dark:text-amber-200'
                : 'text-gray-900 dark:text-gray-100'
              }`}
          >
            {prayer.displayName}
          </Text>
          {prayer.isNext && (
            <Text className="text-white text-xs mt-0.5 opacity-90">
              {t('nextPrayer')}
            </Text>
          )}
        </View>

        <View className="flex-row items-center">
          <Text
            className={`text-lg font-bold mr-3 ${prayer.isNext
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
