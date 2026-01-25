/**
 * PrayerTimesWidget - Android Home Screen Widget
 * Root uses width/height match_parent. Next-prayer block highlighted. Supports theme.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from '../lib/widget-bridge';

interface PrayerTimesWidgetData {
  city: string;
  date: string;
  hijriDate: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  theme?: WidgetTheme;
}

export const PrayerTimesWidget = ({
  city,
  date,
  hijriDate,
  nextPrayerName,
  nextPrayerTime,
  theme = 'light',
}: PrayerTimesWidgetData) => {
  const safeCity = (city || 'Konum Seçin').toUpperCase();
  const safeDate = date || '';
  const safeHijriDate = hijriDate || '';
  const safePrayerName = nextPrayerName || 'Yükleniyor...';
  const safePrayerTime = nextPrayerTime || '--:--';
  const isDark = theme === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const primary = isDark ? '#93c5fd' : '#1e3a8a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const highlightBg = isDark ? '#1e3a5f' : '#eff6ff';
  const highlightText = isDark ? '#93c5fd' : '#1e3a8a';

  const leftTexts: React.ReactNode[] = [
    React.createElement(TextWidget, {
      key: 'city',
      text: safeCity,
      style: {
        fontSize: 13,
        fontWeight: 'bold',
        color: primary,
        marginBottom: 2,
      },
      maxLines: 1,
      truncate: 'END',
    }),
  ];
  if (safeDate) {
    leftTexts.push(
      React.createElement(TextWidget, {
        key: 'date',
        text: safeDate,
        style: {
          fontSize: 11,
          color: muted,
          marginBottom: 1,
        },
        maxLines: 1,
        truncate: 'END',
      })
    );
  }
  if (safeHijriDate) {
    leftTexts.push(
      React.createElement(TextWidget, {
        key: 'hijri',
        text: safeHijriDate,
        style: {
          fontSize: 10,
          color: muted,
        },
        maxLines: 1,
        truncate: 'END',
      })
    );
  }

  // Root: fill entire widget area (match_parent); background to edges
  return React.createElement(
    FlexWidget,
    {
      style: {
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: bg,
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      clickAction: 'OPEN_APP',
      clickActionData: { screen: 'home' },
    },
    React.createElement(
      FlexWidget,
      {
        key: 'left',
        style: {
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: 10,
        },
      },
      ...leftTexts
    ),
    React.createElement(
      FlexWidget,
      {
        key: 'right',
        style: {
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          backgroundColor: highlightBg,
          padding: 8,
        },
      },
      React.createElement(TextWidget, {
        key: 'prayerName',
        text: safePrayerName,
        style: {
          fontSize: 16,
          fontWeight: 'bold',
          color: highlightText,
          marginBottom: 2,
          textAlign: 'right',
        },
        maxLines: 1,
        truncate: 'END',
      }),
      React.createElement(TextWidget, {
        key: 'prayerTime',
        text: safePrayerTime,
        style: {
          fontSize: 26,
          fontWeight: '900',
          color: isDark ? '#60a5fa' : '#2563eb',
          textAlign: 'right',
        },
        maxLines: 1,
        truncate: 'END',
      })
    )
  );
};
