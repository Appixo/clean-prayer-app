import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Coordinates, LocationData } from '../types';
import { storageService } from './storage';
import { getLanguage } from './i18n';
import { logger } from './logger';

let pendingPermissionRequest: Promise<boolean> | null = null;
let pendingLocationRequest: Promise<LocationData | null> | null = null;

/**
 * Requests location permissions and gets the current device location
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (pendingPermissionRequest) {
    logger.debug('Location permission request already in progress, waiting...');
    return pendingPermissionRequest;
  }

  logger.info('Requesting location permission...');
  pendingPermissionRequest = (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      logger.info('Location permission status', { status });

      if (status === 'granted') {
        // Add a small delay for the OS to finalize permission state
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error requesting location permission', error);
      return false;
    } finally {
      pendingPermissionRequest = null;
    }
  })();

  return pendingPermissionRequest;
}

/**
 * Gets the current device location with retry logic for first-time grants
 */
async function getRawPositionWithRetry(retries: number = 2): Promise<Location.LocationObject | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (location) return location;
    } catch (error) {
      logger.warn(`Location fetch attempt ${i + 1} failed`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return null;
}

/**
 * Gets the current device location
 */
export async function getDeviceLocation(): Promise<Coordinates | null> {
  const timeoutMs = 15000;
  let timeoutId: any = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      logger.warn(`Location request timed out after ${timeoutMs}ms`);
      reject(new Error('LOCATION_TIMEOUT'));
    }, timeoutMs);
  });

  const locationPromise = (async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        logger.warn('Location permission denied');
        return null;
      }

      // Use the retry logic specifically for potential flakiness after permission grant
      const location = await getRawPositionWithRetry(2);

      if (!location) {
        logger.warn('Failed to get position after retries');
        return null;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  })();

  return Promise.race([locationPromise, timeoutPromise]);
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim API (for web)
 */
async function reverseGeocodeWeb(coordinates: Coordinates): Promise<{ city?: string; country?: string } | undefined> {
  try {
    const { latitude, longitude } = coordinates;
    // Get current language for API call
    const currentLang = getLanguage();
    const langCode = currentLang === 'tr' ? 'tr' : 'en';

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=${langCode}`;
    let timeoutId: any = null;

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SakinahPrayerApp/1.0', // Required by Nominatim
          },
        });
        return response;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 5000);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
      const country = data.address.country;
      return { city, country };
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Reverse geocoding using expo-location (for native)
 */
async function reverseGeocodeNative(coordinates: Coordinates): Promise<{ city?: string; country?: string } | undefined> {
  const timeoutMs = 3000;
  let timeoutId: any = null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    });

    const geocodePromise = (async () => {
      try {
        const results = await Location.reverseGeocodeAsync(coordinates);
        return results;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    })();

    const [result] = await Promise.race([geocodePromise, timeoutPromise]);
    if (result) {
      const city = result.city || result.subregion || undefined;
      const country = result.country || undefined;
      return { city, country };
    }
    return undefined;
  } catch (error) {
    logger.warn('Error with native reverse geocoding:', error);
    return undefined;
  }
}

/**
 * Gets the current location (manual override if set, otherwise device location)
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  if (pendingLocationRequest) {
    logger.debug('getCurrentLocation already in progress, waiting...');
    return pendingLocationRequest;
  }

  pendingLocationRequest = (async () => {
    try {
      logger.info('getCurrentLocation starting singleton...');
      const manualLocation = storageService.getManualLocation();

      if (manualLocation) {
        logger.info('Using manual location from storage');
        const manualLocationName = storageService.getManualLocationName();
        if (manualLocationName) {
          return {
            coordinates: manualLocation,
            name: manualLocationName,
            isManual: true,
          };
        }
        let locationRes: { city?: string; country?: string } | undefined;
        try {
          if (Platform.OS === 'web') {
            locationRes = await reverseGeocodeWeb(manualLocation);
          } else {
            locationRes = await reverseGeocodeNative(manualLocation);
          }
        } catch (error) {
          logger.warn('Failed reverse geocoding manual location', error);
        }
        return {
          coordinates: manualLocation,
          name: locationRes?.city || 'Manual Location',
          country: locationRes?.country,
          isManual: true,
        };
      }

      logger.info('Manual location not found, trying device location...');
      const deviceLocation = await getDeviceLocation();

      if (deviceLocation) {
        logger.info('Device location obtained', deviceLocation);
        let locationRes: { city?: string; country?: string } | undefined;

        try {
          if (Platform.OS === 'web') {
            locationRes = await reverseGeocodeWeb(deviceLocation);
          } else {
            locationRes = await reverseGeocodeNative(deviceLocation);
          }
        } catch (error) {
          logger.warn('Could not get location name for device location', error);
        }

        return {
          coordinates: deviceLocation,
          name: locationRes?.city || 'Current Location',
          country: locationRes?.country,
          isManual: false,
        };
      }

      logger.warn('Failed to obtain any location (manual or device)');
      return null;
    } finally {
      pendingLocationRequest = null;
    }
  })();

  return pendingLocationRequest;
}

/**
 * Gets location name from coordinates (reverse geocoding)
 */
export async function getLocationName(
  coordinates: Coordinates,
  isManual: boolean = false
): Promise<string> {
  if (isManual) {
    return 'Manual Location';
  }

  try {
    let locationRes: { city?: string; country?: string } | undefined;

    if (Platform.OS === 'web') {
      locationRes = await reverseGeocodeWeb(coordinates);
    } else {
      locationRes = await reverseGeocodeNative(coordinates);
    }

    return locationRes?.city || 'Unknown Location';
  } catch (error) {
    logger.error('Error getting location name', error);
    return 'Unknown Location';
  }
}
/**
 * Helper to get a clean city name from Nominatim/OpenStreetMap results
 */
export const getCityName = (result: any): string => {
  const { address, name, display_name } = result;
  return address?.city || address?.town || address?.village || address?.municipality || name || display_name.split(',')[0];
};

/**
 * Helper to get province and country string from Nominatim results
 */
export const getProvinceAndCountry = (result: any): string => {
  const { address } = result;
  if (!address) return '';
  const province = address.state || address.province || address.region || address.county;
  const country = address.country;
  return [province, country].filter(Boolean).join(', ');
};

/**
 * Search for cities using Nominatim API with aggressive de-duplication
 */
export async function searchCities(query: string, language: string): Promise<any[]> {
  try {
    const langCode = language === 'tr' ? 'tr' : 'en';
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=40&addressdetails=1&accept-language=${langCode}`,
      {
        headers: {
          'User-Agent': 'CleanPrayerApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Network error');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data)) return [];

    const seen = new Set<string>();
    const uniqueResults: any[] = [];

    for (const item of data) {
      const cityName = getCityName(item);
      const provCountry = getProvinceAndCountry(item);
      // Aggressive de-duplication key
      const key = `${cityName}-${provCountry}`.toLowerCase().trim();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(item);
      }
    }

    // Sort: cities first
    return uniqueResults.sort((a, b) => {
      const typeA = (a.addresstype || a.type || "").toLowerCase();
      const typeB = (b.addresstype || b.type || "").toLowerCase();
      const isCityA = typeA === 'city' || typeA === 'town' || typeA === 'village' || a.class === 'place';
      const isCityB = typeB === 'city' || typeB === 'town' || typeB === 'village' || b.class === 'place';
      if (isCityA && !isCityB) return -1;
      if (!isCityA && isCityB) return 1;
      return 0;
    }).slice(0, 20);
  } catch (error) {
    logger.error('searchCities error', error);
    throw error;
  }
}
