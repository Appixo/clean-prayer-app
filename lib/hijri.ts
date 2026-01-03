import { DateTime } from 'luxon';
import { t, type Translations } from './i18n';

/**
 * Converts a Gregorian date to Hijri date
 * Uses a simplified conversion algorithm
 * Adjustment allows +/- days for manual correction
 */
export function getHijriDate(
  gregorianDate: Date = new Date(),
  adjustment: number = 0
): {
  day: number;
  month: number;
  year: number;
  monthName: string;
  dayName: string;
  formatted: string;
} {
  // Apply adjustment
  const adjustedDate = new Date(gregorianDate);
  adjustedDate.setDate(adjustedDate.getDate() + adjustment);

  // Convert to Hijri using approximate algorithm
  // This is a simplified conversion - for production, consider using a more accurate library
  const gregorianYear = adjustedDate.getFullYear();
  const gregorianMonth = adjustedDate.getMonth() + 1;
  const gregorianDay = adjustedDate.getDate();

  // Approximate conversion (this is a simplified version)
  // The actual conversion is more complex and depends on moon sightings
  const hijriEpoch = 227014; // Days since Hijri epoch (July 16, 622 CE)
  const gregorianEpoch = new Date(622, 6, 16).getTime();
  const daysSinceEpoch = Math.floor((adjustedDate.getTime() - gregorianEpoch) / (1000 * 60 * 60 * 24));
  const hijriDays = Math.floor(daysSinceEpoch * 0.970224) + hijriEpoch;

  // Calculate Hijri year, month, and day
  let hijriYear = Math.floor((hijriDays - 227014) / 354.367) + 1;
  let hijriMonth = Math.floor(((hijriDays - 227014) % 354.367) / 29.53) + 1;
  let hijriDay = Math.floor(((hijriDays - 227014) % 354.367) % 29.53) + 1;

  // Normalize
  if (hijriMonth > 12) {
    hijriMonth = 12;
  }
  if (hijriDay > 30) {
    hijriDay = 30;
  }
  if (hijriDay < 1) {
    hijriDay = 1;
  }
  if (hijriMonth < 1) {
    hijriMonth = 1;
  }

  const monthKeys: (keyof Translations)[] = [
    'muharram',
    'safar',
    'rabiAlAwwal',
    'rabiAlThani',
    'jumadaAlUla',
    'jumadaAlThani',
    'rajab',
    'shaban',
    'ramadan',
    'shawwal',
    'dhuAlQidah',
    'dhuAlHijjah',
  ];

  const dayOfWeek = adjustedDate.getDay();
  const monthKey = monthKeys[hijriMonth - 1] || 'muharram';
  const monthName = t(monthKey);
  const yearSuffix = t('hijriYearSuffix');

  // Day names will be translated in the component
  const dayNames: (keyof Translations)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNameKey = dayNames[dayOfWeek];

  // Format: "Day Month Year AH"
  const formatted = `${hijriDay} ${monthName} ${hijriYear} ${yearSuffix}`;

  return {
    day: Math.round(hijriDay),
    month: Math.round(hijriMonth),
    year: Math.round(hijriYear),
    monthName,
    dayName: dayNameKey as keyof Translations, // Return key for translation
    formatted,
  };
}

/**
 * Formats Hijri date for display
 */
export function formatHijriDate(
  gregorianDate: Date = new Date(),
  adjustment: number = 0
): string {
  const hijri = getHijriDate(gregorianDate, adjustment);
  return hijri.formatted;
}

/**
 * Gets a short format Hijri date (e.g., "15 Ramadan 1445")
 */
export function getShortHijriDate(
  gregorianDate: Date = new Date(),
  adjustment: number = 0
): string {
  const hijri = getHijriDate(gregorianDate, adjustment);
  return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
}

