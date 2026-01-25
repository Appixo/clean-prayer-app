import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimesWidget } from './PrayerTimesWidget';
import { NextPrayerWidget } from './NextPrayerWidget';
import { DailyScheduleWidget } from './DailyScheduleWidget';
import {
  WIDGET_DATA_KEY,
  LEGACY_WIDGET_DATA_KEY,
  type UnifiedWidgetPayload,
} from '../lib/widget-bridge';
import { computeFullWidgetPayloadFromConfig, type WidgetConfigCache } from '../lib/widget-prayer-calc';

const WIDGET_CONFIG_CACHE_KEY = '@widget_config_cache';

const defaultDate = () =>
  new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

const defaultPayload = (): UnifiedWidgetPayload => ({
  city: 'Konum Seçin',
  date: defaultDate(),
  hijriDate: '',
  nextPrayerName: 'Uygulamayı Aç',
  nextPrayerTime: '--:--',
  theme: 'light',
  prayerTimes: { fajr: '', sunrise: '', dhuhr: '', asr: '', maghrib: '', isha: '' },
  timeUntilNextMs: null,
  nextPrayer: null,
});

async function loadPayload(): Promise<UnifiedWidgetPayload> {
  let payload = defaultPayload();
  try {
    let raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UnifiedWidgetPayload>;
      payload = {
        city: String(parsed.city ?? payload.city),
        date: String(parsed.date ?? payload.date),
        hijriDate: String(parsed.hijriDate ?? payload.hijriDate),
        nextPrayerName: String(parsed.nextPrayerName ?? payload.nextPrayerName),
        nextPrayerTime: String(parsed.nextPrayerTime ?? payload.nextPrayerTime),
        theme: (parsed.theme as UnifiedWidgetPayload['theme']) ?? 'light',
        prayerTimes: (parsed.prayerTimes as UnifiedWidgetPayload['prayerTimes']) ?? payload.prayerTimes,
        timeUntilNextMs: parsed.timeUntilNextMs ?? null,
        nextPrayer: parsed.nextPrayer ?? null,
      };
      return payload;
    }
    raw = await AsyncStorage.getItem(LEGACY_WIDGET_DATA_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) as Record<string, unknown>;
      payload.city = String(legacy.city ?? payload.city);
      payload.date = String(legacy.date ?? payload.date);
      payload.hijriDate = String(legacy.hijriDate ?? payload.hijriDate);
      payload.nextPrayerName = String(legacy.nextPrayerName ?? payload.nextPrayerName);
      payload.nextPrayerTime = String(legacy.nextPrayerTime ?? payload.nextPrayerTime);
      return payload;
    }
    const configRaw = await AsyncStorage.getItem(WIDGET_CONFIG_CACHE_KEY);
    if (configRaw) {
      const config = JSON.parse(configRaw) as WidgetConfigCache;
      const computed = computeFullWidgetPayloadFromConfig(config, new Date());
      payload = {
        ...computed,
        theme: 'light',
      };
    }
  } catch (e) {
    if (__DEV__) console.warn('Widget data load failed', e);
  }
  return payload;
}

function renderForWidgetName(
  widgetName: string,
  payload: UnifiedWidgetPayload
): React.ReactElement | { light: React.ReactElement; dark: React.ReactElement } {
  const base = {
    city: payload.city,
    date: payload.date,
    hijriDate: payload.hijriDate,
    nextPrayerName: payload.nextPrayerName,
    nextPrayerTime: payload.nextPrayerTime,
  };

  if (widgetName === 'NextPrayerWidget') {
    const nextProps = {
      nextPrayerName: payload.nextPrayerName,
      nextPrayerTime: payload.nextPrayerTime,
      timeUntilNextMs: payload.timeUntilNextMs,
    };
    return {
      light: React.createElement(NextPrayerWidget, { ...nextProps, theme: 'light' }),
      dark: React.createElement(NextPrayerWidget, { ...nextProps, theme: 'dark' }),
    };
  }

  if (widgetName === 'DailyScheduleWidget') {
    return {
      light: React.createElement(DailyScheduleWidget, {
        prayerTimes: payload.prayerTimes,
        nextPrayer: payload.nextPrayer,
        theme: 'light',
      }),
      dark: React.createElement(DailyScheduleWidget, {
        prayerTimes: payload.prayerTimes,
        nextPrayer: payload.nextPrayer,
        theme: 'dark',
      }),
    };
  }

  return {
    light: React.createElement(PrayerTimesWidget, { ...base, theme: 'light' }),
    dark: React.createElement(PrayerTimesWidget, { ...base, theme: 'dark' }),
  };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, widgetInfo, renderWidget } = props;
  const payload = await loadPayload();
  const widgetName = widgetInfo.widgetName ?? 'PrayerTimesWidget';

  const doRender = () => {
    try {
      const tree = renderForWidgetName(widgetName, payload);
      renderWidget(tree);
    } catch (err) {
      if (__DEV__) console.error('Widget render error', err);
      try {
        const fallback = defaultPayload();
        renderWidget(
          renderForWidgetName(widgetName, { ...fallback, city: 'Hata', nextPrayerName: 'Uygulamayı Aç', nextPrayerTime: '--:--' })
        );
      } catch (_) {}
    }
  };

  if (widgetAction === 'WIDGET_DELETED') return;
  doRender();
}
