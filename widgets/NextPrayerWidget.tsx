/**
 * NextPrayerWidget - Small 2x2: countdown, next prayer name, time.
 * Light: white bg, slate-900 text. Dark: slate-900 bg, white text.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from '../lib/widget-bridge';

function msToHMS(ms: number | null): string {
  if (ms == null || ms < 0) return '--:--:--';
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

interface NextPrayerWidgetProps {
  nextPrayerName: string;
  nextPrayerTime: string;
  timeUntilNextMs: number | null;
  theme: WidgetTheme;
}

export function NextPrayerWidget({
  nextPrayerName,
  nextPrayerTime,
  timeUntilNextMs,
  theme,
}: NextPrayerWidgetProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#ffffff' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  return React.createElement(
    FlexWidget,
    {
      style: {
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: bg,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
      },
      clickAction: 'OPEN_APP',
      clickActionData: { screen: 'home' },
    },
    React.createElement(TextWidget, {
      key: 'countdown',
      text: msToHMS(timeUntilNextMs),
      style: { fontSize: 28, fontWeight: '900', color: isDark ? '#60a5fa' : '#2563eb', marginBottom: 4 },
      maxLines: 1,
      truncate: 'END',
    }),
    React.createElement(TextWidget, {
      key: 'name',
      text: nextPrayerName || '—',
      style: { fontSize: 16, fontWeight: 'bold', color: text, marginBottom: 2 },
      maxLines: 1,
      truncate: 'END',
    }),
    React.createElement(TextWidget, {
      key: 'time',
      text: nextPrayerTime || '--:--',
      style: { fontSize: 14, color: muted },
      maxLines: 1,
      truncate: 'END',
    })
  );
}
