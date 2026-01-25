/**
 * Widget-safe prayer calculation. No i18n/store deps.
 * Used by the widget task handler when @prayer_times_widget_data is empty.
 */
import type { CalculationMethod, AsrMethod, HighLatitudeRule } from '../types';
import { calculatePrayerTimes, formatPrayerTime, getNextPrayer } from './prayer';

const PRAYER_NAMES_TR: Record<string, string> = {
  fajr: 'Fecir',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

export interface WidgetConfigCache {
  latitude: number;
  longitude: number;
  city: string;
  calculationMethod: CalculationMethod;
  asrMethod: AsrMethod;
  highLatitudeRule: HighLatitudeRule;
  timeFormat: '12h' | '24h';
}

export interface WidgetData {
  city: string;
  date: string;
  hijriDate: string;
  nextPrayerName: string;
  nextPrayerTime: string;
}

/** Full widget payload shape for fallback when AsyncStorage is empty. theme and hijriDate filled by caller. */
export interface FullWidgetPayloadFromConfig {
  city: string;
  date: string;
  hijriDate: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  prayerTimes: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  timeUntilNextMs: number | null;
  nextPrayer: string | null;
}

const formatTime = (d: Date, use12h: boolean) => formatPrayerTime(d, use12h);

/**
 * Compute full widget payload from cached config (coordinates + calculation settings).
 * Used when @widget_data is empty so the widget can show real times from last-known location.
 * Does not use i18n or store. Hijri is left empty; caller can set it if needed.
 */
export function computeFullWidgetPayloadFromConfig(
  config: WidgetConfigCache,
  when: Date = new Date()
): FullWidgetPayloadFromConfig {
  const prayerTimes = calculatePrayerTimes(
    { latitude: config.latitude, longitude: config.longitude },
    config.calculationMethod,
    config.asrMethod,
    config.highLatitudeRule,
    when
  );
  const { nextPrayer, nextPrayerTime, timeUntilNext } = getNextPrayer(prayerTimes, when);
  const use12h = config.timeFormat === '12h';

  const dateStr = when.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  const isFriday = when.getDay() === 5;
  const prayerNameKey = nextPrayer === 'dhuhr' && isFriday ? 'jumuah' : nextPrayer;
  const nextPrayerName = prayerNameKey === 'jumuah' ? 'Cuma' : (nextPrayer ? PRAYER_NAMES_TR[nextPrayer] ?? nextPrayer : '—');
  const formattedNextTime = nextPrayerTime ? formatPrayerTime(nextPrayerTime, use12h) : '--:--';

  return {
    city: config.city || 'Konum Seçin',
    date: dateStr,
    hijriDate: '',
    nextPrayerName: nextPrayerName || '—',
    nextPrayerTime: formattedNextTime,
    prayerTimes: {
      fajr: formatTime(prayerTimes.fajr, use12h),
      sunrise: formatTime(prayerTimes.sunrise, use12h),
      dhuhr: formatTime(prayerTimes.dhuhr, use12h),
      asr: formatTime(prayerTimes.asr, use12h),
      maghrib: formatTime(prayerTimes.maghrib, use12h),
      isha: formatTime(prayerTimes.isha, use12h),
    },
    timeUntilNextMs: timeUntilNext ?? null,
    nextPrayer: nextPrayer ?? null,
  };
}

/**
 * Compute widget data from cached config. Does not use i18n or store.
 * Hijri is left empty to avoid pulling i18n into the widget context.
 */
export function computeWidgetDataFromConfig(config: WidgetConfigCache, when: Date = new Date()): WidgetData {
  const full = computeFullWidgetPayloadFromConfig(config, when);
  return {
    city: full.city,
    date: full.date,
    hijriDate: full.hijriDate,
    nextPrayerName: full.nextPrayerName,
    nextPrayerTime: full.nextPrayerTime,
  };
}
