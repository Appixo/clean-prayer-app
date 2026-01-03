import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Coordinates, LocationData } from '../types';
import { storageService } from './storage';
import { getLanguage } from './i18n';

/**
 * Requests location permissions and gets the current device location
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Gets the current device location
 */
export async function getDeviceLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    // Get current location with 5-second timeout
    try {
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('GPS timeout')), 5000);
      });

      const location = await Promise.race([locationPromise, timeoutPromise]);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.log('GPS timeout or error:', error);
      return null;
    }

  } catch (error) {
    console.error('Error getting device location:', error);
    return null;
  }
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim API (for web)
 */
async function reverseGeocodeWeb(coordinates: Coordinates): Promise<string | undefined> {
  try {
    const { latitude, longitude } = coordinates;
    // Get current language for API call
    const currentLang = getLanguage();
    const langCode = currentLang === 'tr' ? 'tr' : 'en';

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=${langCode}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CleanPrayerApp/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    if (data && data.address) {
      const parts: string[] = [];

      // City/Town/Village (required)
      if (data.address.city) parts.push(data.address.city);
      else if (data.address.town) parts.push(data.address.town);
      else if (data.address.village) parts.push(data.address.village);
      else if (data.address.municipality) parts.push(data.address.municipality);

      // Region/State/Province (always include if available, even if same as city)
      // This helps distinguish "Utrecht (city), Utrecht (province)" from just "Utrecht"
      if (data.address.state) parts.push(data.address.state);
      else if (data.address.region) parts.push(data.address.region);
      else if (data.address.province) parts.push(data.address.province);
      else if (data.address.administrative) parts.push(data.address.administrative);

      // Country (if available, use country code if available)
      if (data.address.country_code) {
        // Use country code in uppercase (e.g., "NL", "US")
        parts.push(data.address.country_code.toUpperCase());
      } else if (data.address.country) {
        parts.push(data.address.country);
      }

      // Return formatted as "City, Region, Country"
      // Always show all 3 parts if available, even if city and region have same name
      return parts.length > 0 ? parts.join(', ') : undefined;
    }
    return undefined;
  } catch (error) {
    // Silently fail - location name is optional
    return undefined;
  }
}

/**
 * Reverse geocoding using expo-location (for native)
 */
async function reverseGeocodeNative(coordinates: Coordinates): Promise<string | undefined> {
  try {
    const [result] = await Location.reverseGeocodeAsync(coordinates);
    if (result) {
      const parts: string[] = [];

      // City/Town (required)
      if (result.city) parts.push(result.city);
      else if (result.subregion) parts.push(result.subregion);

      // Region/State (if available)
      if (result.region) parts.push(result.region);


      // Country (if available, prefer ISO country code)
      if (result.isoCountryCode) {
        parts.push(result.isoCountryCode.toUpperCase());
      } else if (result.country) {
        parts.push(result.country);
      }

      // Return formatted as "City, Region, Country"
      return parts.length > 0 ? parts.join(', ') : undefined;
    }
    return undefined;
  } catch (error) {
    console.log('Error with native reverse geocoding:', error);
    return undefined;
  }
}

/**
 * Gets the current location (manual override if set, otherwise device location)
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  // Check for manual location override first
  const manualLocation = storageService.getManualLocation();

  if (manualLocation) {
    const manualLocationName = storageService.getManualLocationName();
    // Show the city name that was saved, or fallback to coordinates if name not available
    if (manualLocationName) {
      return {
        coordinates: manualLocation,
        name: manualLocationName,
        isManual: true,
      };
    }
    // If no name saved, try to reverse geocode to get city name
    let locationName: string | undefined;
    try {
      if (Platform.OS === 'web') {
        locationName = await reverseGeocodeWeb(manualLocation);
      } else {
        locationName = await reverseGeocodeNative(manualLocation);
      }
    } catch (error) {
      // Silently fail
    }
    return {
      coordinates: manualLocation,
      name: locationName || 'Current Location',
      isManual: true,
    };
  }

  // Otherwise, get device location
  const deviceLocation = await getDeviceLocation();

  if (deviceLocation) {
    // Try to get location name (reverse geocoding)
    let locationName: string | undefined;

    try {
      if (Platform.OS === 'web') {
        locationName = await reverseGeocodeWeb(deviceLocation);
      } else {
        locationName = await reverseGeocodeNative(deviceLocation);
      }
    } catch (error) {
      // Silently fail - location name is optional
      console.log('Could not get location name:', error);
    }

    // If reverse geocoding failed, use "Current Location" instead of undefined
    return {
      coordinates: deviceLocation,
      name: locationName || 'Current Location',
      isManual: false,
    };
  }

  return null;
}

/**
 * Gets location name from coordinates (reverse geocoding)
 * Returns "Manual Location" for privacy-focused users
 */
export async function getLocationName(
  coordinates: Coordinates,
  isManual: boolean = false
): Promise<string> {
  if (isManual) {
    return 'Manual Location';
  }

  try {
    let locationName: string | undefined;

    if (Platform.OS === 'web') {
      locationName = await reverseGeocodeWeb(coordinates);
    } else {
      locationName = await reverseGeocodeNative(coordinates);
    }

    return locationName || 'Unknown Location';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown Location';
  }
}
