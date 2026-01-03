import React from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { t } from '../lib/i18n';

export default function AboutScreen() {
  const version = '1.0.0';

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-4">
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-2xl font-bold mb-2">
            Clean Prayer
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-base mb-1">
            {t('version')} {version}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            A clean, ad-free, offline-first prayer times app
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3">
            {t('privacy')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('noTracking')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('noAnalytics')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('noAds')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            • {t('allCalculationsOffline')}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3">
            {t('credits')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            {t('prayerTimeCalculations')}
          </Text>
          <TouchableOpacity
            onPress={() => openLink('https://github.com/batoulapps/adhan-js')}
            className="flex-row items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg"
          >
            <Text className="text-blue-500 dark:text-blue-400 text-sm flex-1">
              adhan-js library
            </Text>
            <ExternalLink size={16} color="#3b82f6" />
          </TouchableOpacity>
          <Text className="text-gray-500 dark:text-gray-500 text-xs mt-2">
            Copyright © Batoul Apps
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3">
            {t('features')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('offlinePrayerTimeCalculations')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('multipleCalculationMethods')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('hijriDateDisplay')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('qiblaDirectionIndicator')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('manualLocationOverrideFeature')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            • {t('timeFormatFeature')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            • {t('darkLightThemeSupport')}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-3">
            {t('license')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            {t('providedAsIs')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
