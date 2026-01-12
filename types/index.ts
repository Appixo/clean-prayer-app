export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  nextPrayer: PrayerName | null;
  timeUntilNext: number | null; // milliseconds
  nextPrayerTime?: Date;
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CalculationMethod =
  | 'MWL'
  | 'ISNA'
  | 'Egypt'
  | 'Makkah'
  | 'Karachi'
  | 'Tehran'
  | 'Turkey'
  | 'MoonsightingCommittee'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'NorthAmerica'
  | 'Jafari';

export type AsrMethod = 'Standard' | 'Hanafi';

export type HighLatitudeRule =
  | 'MiddleOfTheNight'
  | 'SeventhOfTheNight'
  | 'TwilightAngle';

export type TimeFormat = '12h' | '24h';

export type Theme = 'light' | 'dark' | 'system';

export interface LocationData {
  coordinates: Coordinates;
  name?: string;
  country?: string;
  isManual: boolean;
}

export interface PrayerTimeData {
  name: PrayerName;
  displayName: string;
  time: Date;
  formattedTime: string;
  isNext: boolean;
}

export type SavedLocation = {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

