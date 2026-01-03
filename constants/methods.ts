import type { CalculationMethod, HighLatitudeRule } from '../types';

export const CALCULATION_METHODS: CalculationMethod[] = [
  'MWL',
  'ISNA',
  'Egypt',
  'Makkah',
  'Karachi',
  'Tehran',
  'Turkey',
  'MoonsightingCommittee',
  'Dubai',
  'Kuwait',
  'Qatar',
  'Singapore',
  'NorthAmerica',
];

export const CALCULATION_METHOD_DISPLAY_NAMES: Record<CalculationMethod, string> = {
  MWL: 'Muslim World League',
  ISNA: 'Islamic Society of North America',
  Egypt: 'Egyptian General Authority of Survey',
  Makkah: 'Umm al-Qura, Makkah',
  Karachi: 'University of Islamic Sciences, Karachi',
  Tehran: 'Institute of Geophysics, University of Tehran',
  Turkey: 'Diyanet İşleri Başkanlığı, Turkey',
  MoonsightingCommittee: 'Moonsighting Committee',
  Dubai: 'Dubai',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Singapore',
  NorthAmerica: 'North America',
};

export const HIGH_LATITUDE_RULES: HighLatitudeRule[] = [
  'MiddleOfTheNight',
  'SeventhOfTheNight',
  'TwilightAngle',
];

export const HIGH_LATITUDE_RULE_DISPLAY_NAMES: Record<HighLatitudeRule, string> = {
  MiddleOfTheNight: 'Middle of the Night',
  SeventhOfTheNight: 'Seventh of the Night',
  TwilightAngle: 'Twilight Angle',
};

// Kaaba coordinates for Qibla calculation
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
};

