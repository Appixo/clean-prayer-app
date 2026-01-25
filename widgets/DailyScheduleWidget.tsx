/**
 * DailyScheduleWidget - Large 4x4: vertical list of all 6 prayers.
 * Highlight the next prayer row. Light/dark theme.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from '../lib/widget-bridge';

const ROW_ORDER: Array<{ key: string; label: string }> = [
  { key: 'fajr', label: 'Fecir' },
  { key: 'sunrise', label: 'Güneş' },
  { key: 'dhuhr', label: 'Öğle' },
  { key: 'asr', label: 'İkindi' },
  { key: 'maghrib', label: 'Akşam' },
  { key: 'isha', label: 'Yatsı' },
];

interface DailyScheduleWidgetProps {
  prayerTimes: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  nextPrayer: string | null;
  theme: WidgetTheme;
}

export function DailyScheduleWidget({ prayerTimes, nextPrayer, theme }: DailyScheduleWidgetProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#ffffff' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const highlightBg = isDark ? '#1e3a5f' : '#eff6ff';
  const highlightText = isDark ? '#93c5fd' : '#1e3a8a';

  const rows = ROW_ORDER.map(({ key, label }) => {
    const time = (prayerTimes as Record<string, string>)[key] ?? '--:--';
    const isNext = nextPrayer === key;
    return React.createElement(
      FlexWidget,
      {
        key,
        style: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 6,
          paddingHorizontal: 10,
          marginBottom: 2,
          backgroundColor: isNext ? highlightBg : undefined,
        },
      },
      React.createElement(TextWidget, {
        key: 'l',
        text: label,
        style: {
          fontSize: 14,
          fontWeight: isNext ? 'bold' : 'normal',
          color: isNext ? highlightText : text,
        },
        maxLines: 1,
        truncate: 'END',
      }),
      React.createElement(TextWidget, {
        key: 'r',
        text: time,
        style: {
          fontSize: 14,
          fontWeight: isNext ? 'bold' : 'normal',
          color: isNext ? highlightText : muted,
          textAlign: 'right',
        },
        maxLines: 1,
        truncate: 'END',
      })
    );
  });

  return React.createElement(
    FlexWidget,
    {
      style: {
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: bg,
        flexDirection: 'column',
        padding: 10,
      },
      clickAction: 'OPEN_APP',
      clickActionData: { screen: 'home' },
    },
    ...rows
  );
}
