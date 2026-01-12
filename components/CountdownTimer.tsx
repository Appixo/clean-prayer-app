import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import type { PrayerTimes } from '../types';
import { t } from '../lib/i18n';

interface CountdownTimerProps {
  prayerTimes: PrayerTimes;
  date?: Date; // Optional date to check for Friday
  overrideTimeRemaining?: number | null;
}

export function CountdownTimer({ prayerTimes, date = new Date(), overrideTimeRemaining }: CountdownTimerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const timeRemaining = overrideTimeRemaining !== undefined ? overrideTimeRemaining : prayerTimes.timeUntilNext;
  const isFriday = date.getDay() === 5;

  // Bug 2 Fix: Safely activate/deactivate keep awake in an effect
  React.useEffect(() => {
    let isActive = true;

    async function toggleKeepAwake() {
      try {
        const { activateKeepAwakeAsync, deactivateKeepAwake } = await import('expo-keep-awake');
        if (isActive) {
          await activateKeepAwakeAsync();
        } else {
          await deactivateKeepAwake();
        }
      } catch (e) {
        // Silence keep awake errors
      }
    }

    toggleKeepAwake();

    return () => {
      isActive = false;
      toggleKeepAwake();
    };
  }, []);

  if (!prayerTimes.nextPrayer || timeRemaining === null) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }
        ]}
        className="p-3 rounded-lg mb-3"
      >
        <Text className="text-gray-600 dark:text-gray-400 text-center text-xs">
          {t('calculatingNextPrayer')}
        </Text>
      </View>
    );
  }

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  // Use localized name and handle Jumuah
  let nextPrayerName = '';
  if (prayerTimes.nextPrayer === 'dhuhr' && isFriday) {
    nextPrayerName = t('jumuah');
  } else {
    nextPrayerName = t(prayerTimes.nextPrayer);
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#2563eb' : '#3b82f6' }
      ]}
      className="p-4 rounded-lg mb-3"
    >
      <Text className="text-white text-center text-xs mb-1">
        {t('timeUntil')} {nextPrayerName}
      </Text>
      <View className="flex-row justify-center items-center">
        <View className="items-center mx-2">
          <Text className="text-white text-2xl font-bold">
            {String(hours).padStart(2, '0')}
          </Text>
          <Text className="text-white text-[10px] opacity-80">{t('hours')}</Text>
        </View>
        <Text className="text-white text-xl font-bold mx-0.5">:</Text>
        <View className="items-center mx-2">
          <Text className="text-white text-2xl font-bold">
            {String(minutes).padStart(2, '0')}
          </Text>
          <Text className="text-white text-[10px] opacity-80">{t('minutes')}</Text>
        </View>
        <Text className="text-white text-xl font-bold mx-0.5">:</Text>
        <View className="items-center mx-2">
          <Text className="text-white text-2xl font-bold">
            {String(seconds).padStart(2, '0')}
          </Text>
          <Text className="text-white text-[10px] opacity-80">{t('seconds')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Basic structure handled by className
  }
});

