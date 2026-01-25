import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { DateTime, Settings } from 'luxon';
import { getHijriDate } from '../lib/hijri';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { t, getLanguage } from '../lib/i18n';

interface HijriDateProps {
  date: Date;
  onDateChange: (newDate: Date) => void;
  onReset?: () => void;
}

export function HijriDate({ date, onDateChange, onReset }: HijriDateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // We use 0 adjustment for the display since the parent manages the actual date
  const hijri = getHijriDate(date, 0);

  const adjustDate = (delta: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + delta);
    onDateChange(newDate);
  };

  // Format Gregorian date using luxon for locale support
  const currentLang = getLanguage();
  Settings.defaultLocale = currentLang;
  const locale = currentLang === 'tr' ? 'tr' : 'en';
  const dt = DateTime.fromJSDate(date).setLocale(locale);

  const gregorianDate = currentLang === 'tr'
    ? dt.toFormat('d MMMM yyyy, cccc')
    : dt.toFormat('cccc, MMMM d, yyyy');

  // Calculate day difference
  const today = DateTime.now().startOf('day');
  const targetDate = dt.startOf('day');
  const diffDays = Math.round(targetDate.diff(today, 'days').days);

  let dateLabel = '';
  if (diffDays === 0) dateLabel = t('today');
  else if (diffDays === 1) dateLabel = t('tomorrow');
  else if (diffDays === -1) dateLabel = t('yesterday');
  else if (diffDays > 0) dateLabel = `+${diffDays} ${diffDays === 1 ? t('day') : t('days')}`;
  else dateLabel = `${diffDays} ${diffDays === -1 ? t('day') : t('days')}`;

  return (
    <View
      style={{ 
        backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
        padding: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <TouchableOpacity
        onPress={() => adjustDate(-1)}
        className="p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeft size={20} color="#2563EB" />
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center px-1"
        onPress={onReset}
        activeOpacity={0.7}
      >
        <Text className="text-gray-900 dark:text-gray-100 text-center text-base font-bold">
          {gregorianDate}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <Text className="text-slate-500 dark:text-gray-400 text-center text-[10px] font-medium mr-2">
            {hijri.formatted}
          </Text>
          {dateLabel && (
            <Text className="text-blue-600 dark:text-blue-400 text-center text-[10px] font-black uppercase tracking-widest">
              {dateLabel}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => adjustDate(1)}
        className="p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronRight size={20} color="#2563EB" />
      </TouchableOpacity>
    </View>
  );
}
