import {
  Coordinates,
  PrayerTimes,
  PrayerName,
  CalculationMethod,
  AsrMethod,
  HighLatitudeRule,
} from '../types';
import {
  PrayerTimes as AdhanPrayerTimes,
  Coordinates as AdhanCoordinates,
  CalculationMethod as AdhanCalculationMethod,
  CalculationParameters,
  Madhab,
  HighLatitudeRule as AdhanHighLatitudeRule,
} from 'adhan';
import { DateTime } from 'luxon';
import { logger } from './logger';

/**
 * Maps our CalculationMethod type to adhan library's CalculationMethod methods
 */
function getCalculationParameters(
  method: CalculationMethod,
  asrMethod: AsrMethod,
  highLatitudeRule: HighLatitudeRule
): CalculationParameters {
  let params: CalculationParameters;

  // Get base parameters from the calculation method
  switch (method) {
    case 'MWL':
      params = AdhanCalculationMethod.MuslimWorldLeague();
      break;
    case 'ISNA':
    case 'NorthAmerica':
      params = AdhanCalculationMethod.NorthAmerica();
      break;
    case 'Egypt':
      params = AdhanCalculationMethod.Egyptian();
      break;
    case 'Makkah':
      params = AdhanCalculationMethod.UmmAlQura();
      break;
    case 'Karachi':
      params = AdhanCalculationMethod.Karachi();
      break;
    case 'Tehran':
      params = AdhanCalculationMethod.Tehran();
      break;
    case 'Turkey':
      params = AdhanCalculationMethod.Turkey();
      break;
    case 'MoonsightingCommittee':
      params = AdhanCalculationMethod.MoonsightingCommittee();
      break;
    case 'Dubai':
      params = AdhanCalculationMethod.Dubai();
      break;
    case 'Kuwait':
      params = AdhanCalculationMethod.Kuwait();
      break;
    case 'Qatar':
      params = AdhanCalculationMethod.Qatar();
      break;
    case 'Singapore':
      params = AdhanCalculationMethod.Singapore();
      break;
    case 'Jafari':
      params = AdhanCalculationMethod.Tehran(); // Closest approximation for Shia
      break;
    default:
      params = AdhanCalculationMethod.MuslimWorldLeague();
  }

  // Set Asr madhab (Shafi = Standard, Hanafi = Hanafi)
  params.madhab = asrMethod === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  // Set high latitude rule
  switch (highLatitudeRule) {
    case 'MiddleOfTheNight':
      params.highLatitudeRule = AdhanHighLatitudeRule.MiddleOfTheNight;
      break;
    case 'SeventhOfTheNight':
      params.highLatitudeRule = AdhanHighLatitudeRule.SeventhOfTheNight;
      break;
    case 'TwilightAngle':
      params.highLatitudeRule = AdhanHighLatitudeRule.TwilightAngle;
      break;
    default:
      params.highLatitudeRule = AdhanHighLatitudeRule.MiddleOfTheNight;
  }

  return params;
}

/**
 * Calculates prayer times for a given location, date, and calculation parameters
 */
export function calculatePrayerTimes(
  coordinates: Coordinates,
  method: CalculationMethod,
  asrMethod: AsrMethod,
  highLatitudeRule: HighLatitudeRule,
  date: Date = new Date()
): PrayerTimes {
  const params = getCalculationParameters(method, asrMethod, highLatitudeRule);
  const adhanCoords = new AdhanCoordinates(coordinates.latitude, coordinates.longitude);

  const adhanTimes = new AdhanPrayerTimes(adhanCoords, date, params);

  const prayerTimes: PrayerTimes = {
    fajr: adhanTimes.fajr,
    sunrise: adhanTimes.sunrise,
    dhuhr: adhanTimes.dhuhr,
    asr: adhanTimes.asr,
    maghrib: adhanTimes.maghrib,
    isha: adhanTimes.isha,
    nextPrayer: null,
    timeUntilNext: null,
    nextPrayerTime: undefined,
  };

  // Calculate next prayer and time until next
  const nextPrayerInfo = getNextPrayer(prayerTimes, date);
  prayerTimes.nextPrayer = nextPrayerInfo.nextPrayer;
  prayerTimes.timeUntilNext = nextPrayerInfo.timeUntilNext;
  if (nextPrayerInfo.nextPrayerTime) {
    prayerTimes.nextPrayerTime = nextPrayerInfo.nextPrayerTime;
  }

  return prayerTimes;
}

/**
 * Determines the next prayer and calculates time until it
 * Handles midnight transition correctly (Isha -> Fajr next day)
 */
export function getNextPrayer(
  prayerTimes: Omit<PrayerTimes, 'nextPrayer' | 'timeUntilNext'>,
  currentTime: Date = new Date()
): { nextPrayer: PrayerName | null; timeUntilNext: number | null; nextPrayerTime: Date | null } {
  const prayers: Array<{ name: PrayerName; time: Date }> = [
    { name: 'fajr', time: prayerTimes.fajr },
    { name: 'sunrise', time: prayerTimes.sunrise },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'isha', time: prayerTimes.isha },
  ];

  // Find the next prayer that hasn't occurred yet today
  let nextPrayer: PrayerName | null = null;
  let nextPrayerTime: Date | null = null;

  for (const prayer of prayers) {
    if (prayer.time > currentTime) {
      nextPrayer = prayer.name;
      nextPrayerTime = prayer.time;
      break;
    }
  }

  // If no prayer found for today, next prayer is Fajr tomorrow
  if (!nextPrayer) {
    // Calculate Fajr for tomorrow
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Estimate Fajr time for tomorrow (approximately same time as today but +1 day)
    const fajrTime = new Date(prayerTimes.fajr);
    fajrTime.setDate(fajrTime.getDate() + 1);

    const timeUntilFajr = fajrTime.getTime() - currentTime.getTime();

    return {
      nextPrayer: 'fajr',
      timeUntilNext: timeUntilFajr > 0 ? timeUntilFajr : null,
      nextPrayerTime: fajrTime,
    };
  }

  const timeUntilNext = nextPrayerTime!.getTime() - currentTime.getTime();

  return {
    nextPrayer,
    timeUntilNext: timeUntilNext > 0 ? timeUntilNext : null,
    nextPrayerTime: nextPrayerTime,
  };
}

/**
 * Formats a Date to a time string in 12h or 24h format
 */
export function formatPrayerTime(time: Date, format12h: boolean = false): string {
  const dt = DateTime.fromJSDate(time);

  if (format12h) {
    return dt.toFormat('h:mm a');
  } else {
    return dt.toFormat('HH:mm');
  }
}

/**
 * Calculates time until next prayer in milliseconds
 * This is a convenience function that wraps getNextPrayer
 */
export function getTimeUntilNext(
  prayerTimes: Omit<PrayerTimes, 'nextPrayer' | 'timeUntilNext'>,
  currentTime: Date = new Date()
): number | null {
  return getNextPrayer(prayerTimes, currentTime).timeUntilNext;
}

/**
 * Gets the display name for a prayer
 * Note: This function should be called from components that have access to i18n
 * For direct use, import t from i18n and use t(prayer) directly
 */
export function getPrayerDisplayName(prayer: PrayerName): string {
  // This will be overridden by components using i18n
  const names: Record<PrayerName, string> = {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  };
  return names[prayer];
}
