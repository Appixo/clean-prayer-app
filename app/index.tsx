import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  AppState,
  type AppStateStatus,
} from 'react-native';

import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { PrayerCard } from '../components/PrayerCard';
import { CountdownTimer } from '../components/CountdownTimer';
import { HijriDate } from '../components/HijriDate';
// import { QiblaIndicator } from '../components/QiblaIndicator';
import { calculatePrayerTimes, formatPrayerTime } from '../lib/prayer';
import { getCurrentLocation } from '../lib/location';
import { t } from '../lib/i18n';
import { useStore } from '../store/useStore';

import type { PrayerTimes, PrayerTimeData } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  // Zustand Store
  const {
    location, setLocation, isManualLocation,
    calculationMethod, asrMethod, highLatitudeRule,
    timeFormat,
    language
  } = useStore();

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lastCalculatedDate, setLastCalculatedDate] = useState<Date | null>(null);

  // Update header title based on language
  useEffect(() => {
    navigation.setOptions({ title: t('prayerTimes') });
  }, [language, navigation]);

  // Handle AppState changes to refresh timer when coming from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadPrayerTimes(selectedDate);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [selectedDate, location]);

  const { colorScheme, setColorScheme } = useNativeWindColorScheme();

  // Re-check logic when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Typically theme and language are synced in RootLayout now, so we don't need manual sync here.
      // However, we DO want to reload prayer times if parameters changed.
      loadPrayerTimes(selectedDate);
    }, [language, colorScheme, selectedDate, location, calculationMethod, asrMethod, highLatitudeRule])
  );

  const loadPrayerTimes = async (targetDate: Date = selectedDate) => {
    try {
      if (!prayerTimes) {
        setLoading(true);
      }

      let loc = location;

      // If no location in store, or not manual, try to fetch GPS
      // (If isManualLocation is true, we assume 'location' in store is valid from settings)
      if (!loc || !isManualLocation) {
        const gpsLocation = await getCurrentLocation();
        if (gpsLocation) {
          // Update store with GPS location if strictly needed or just use it transiently?
          // Better to update store so it persists as cache?
          // Yes, let's update store if we got new GPS
          setLocation(gpsLocation.coordinates, undefined, undefined, undefined, false);
          loc = gpsLocation.coordinates;
          // We only have coordinates, but let's assume valid
        } else {
          // GPS failed, do we have a cached location?
          if (!loc) {
            setLoading(false);
            return;
          }
        }
      }

      if (!loc) {
        setLoading(false);
        return;
      }

      // Calculate prayer times
      const calculatedTimes = calculatePrayerTimes(
        loc,
        calculationMethod,
        asrMethod,
        highLatitudeRule,
        targetDate
      );

      setPrayerTimes(calculatedTimes);
      setSelectedDate(targetDate);
      setLastCalculatedDate(targetDate);
    } catch (error) {
      console.error('Error loading prayer times:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPrayerTimes();
  }, []);

  // Check for midnight transition and recalculate if showing today
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();

      // Only auto-update if we are currently looking at "today"
      const today = new Date();
      const isShowingToday = selectedDate.getDate() === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();

      if (isShowingToday) {
        const lastDate = lastCalculatedDate || new Date(0);

        // Check if date has changed
        if (
          now.getDate() !== lastDate.getDate() ||
          now.getMonth() !== lastDate.getMonth() ||
          now.getFullYear() !== lastDate.getFullYear()
        ) {
          // Date changed, recalculate prayer times for the new current date
          loadPrayerTimes(now);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMidnight);
  }, [lastCalculatedDate, selectedDate]);

  // Update countdown every second
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      if (prayerTimes.nextPrayer) {
        const now = new Date();
        const nextPrayerTime = prayerTimes.nextPrayerTime || (prayerTimes.nextPrayer ? (prayerTimes[prayerTimes.nextPrayer] as Date) : null);

        if (!nextPrayerTime) return;

        let timeUntilNext = 0;
        if (nextPrayerTime instanceof Date) {
          timeUntilNext = nextPrayerTime.getTime() - now.getTime();
        }

        if (timeUntilNext > 0) {
          setPrayerTimes((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              timeUntilNext,
            };
          });
        } else {
          const today = new Date();
          const isShowingToday = selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();

          if (isShowingToday) {
            loadPrayerTimes(today);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes?.nextPrayer, selectedDate]);


  if (loading && !prayerTimes) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-400">
          {t('loadingPrayerTimes')}
        </Text>
      </View>
    );
  }

  // Determine display location name
  const displayCity = useStore.getState().city;
  const displayLocationName = displayCity || (isManualLocation ? t('manualLocation') : t('currentLocation'));

  if (!location) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 px-6 items-center justify-center">
        <View className="bg-blue-500 p-6 rounded-3xl mb-8">
          <Text className="text-white text-4xl">🕌</Text>
        </View>
        <Text className="text-gray-900 dark:text-gray-100 text-3xl font-bold text-center mb-3">
          {t('welcomeTitle')}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center text-lg mb-10">
          {t('welcomeSubtitle')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          className="bg-blue-500 w-full p-4 rounded-2xl shadow-lg active:bg-blue-600"
        >
          <Text className="text-white text-center font-bold text-lg">
            {t('setupLocation')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prayerTimes) return null;

  const format12h = timeFormat === '12h';

  // Prepare prayer data for display
  const isFriday = selectedDate.getDay() === 5; // 0 = Sunday, 5 = Friday

  const prayers: PrayerTimeData[] = [
    {
      name: 'fajr',
      displayName: t('fajr'),
      time: prayerTimes.fajr,
      formattedTime: formatPrayerTime(prayerTimes.fajr, format12h),
      isNext: prayerTimes.nextPrayer === 'fajr',
    },
    {
      name: 'sunrise',
      displayName: t('sunrise'),
      time: prayerTimes.sunrise,
      formattedTime: formatPrayerTime(prayerTimes.sunrise, format12h),
      isNext: prayerTimes.nextPrayer === 'sunrise',
    },
    {
      name: 'dhuhr',
      displayName: isFriday ? t('jumuah') : t('dhuhr'),
      time: prayerTimes.dhuhr,
      formattedTime: formatPrayerTime(prayerTimes.dhuhr, format12h),
      isNext: prayerTimes.nextPrayer === 'dhuhr',
    },
    {
      name: 'asr',
      displayName: t('asr'),
      time: prayerTimes.asr,
      formattedTime: formatPrayerTime(prayerTimes.asr, format12h),
      isNext: prayerTimes.nextPrayer === 'asr',
    },
    {
      name: 'maghrib',
      displayName: t('maghrib'),
      time: prayerTimes.maghrib,
      formattedTime: formatPrayerTime(prayerTimes.maghrib, format12h),
      isNext: prayerTimes.nextPrayer === 'maghrib',
    },
    {
      name: 'isha',
      displayName: t('isha'),
      time: prayerTimes.isha,
      formattedTime: formatPrayerTime(prayerTimes.isha, format12h),
      isNext: prayerTimes.nextPrayer === 'isha',
    },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-3"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadPrayerTimes(new Date())} />
        }
      >
        {/* Header with location and settings button */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-gray-600 dark:text-gray-400 text-xs">
              {t('location')}
            </Text>
            <Text className="text-gray-900 dark:text-gray-100 text-base font-semibold">
              {displayLocationName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="p-1.5"
          >
            <Settings size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Countdown Timer */}
        <CountdownTimer prayerTimes={prayerTimes} date={selectedDate} />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => router.push('/qibla')}
            className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl flex-row items-center justify-center border border-gray-200 dark:border-gray-700 active:bg-gray-200 dark:active:bg-gray-700"
          >
            <Text className="text-2xl mr-2">🧭</Text>
            <Text className="text-gray-900 dark:text-gray-100 font-bold">{t('qiblaDirection')}</Text>
          </TouchableOpacity>
        </View>

        {/* Hijri Date */}
        <HijriDate
          date={selectedDate}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
            loadPrayerTimes(newDate);
          }}
          onReset={() => {
            const today = new Date();
            setSelectedDate(today);
            loadPrayerTimes(today);
          }}
        />

        {/* Prayer Times Grid */}
        <View className="flex-1 mt-1">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-2">
            {t('prayerTimes')}
          </Text>
          <View className="flex-1">
            {prayers.map((prayer) => (
              <PrayerCard key={prayer.name} prayer={prayer} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
