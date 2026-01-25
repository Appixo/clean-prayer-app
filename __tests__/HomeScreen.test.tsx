/**
 * Home screen (main screen) UI test
 * Renders with mocked useStore and verifies prayer data appears on screen.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

// Mock child components that use lucide / NativeWind / complex deps so we only test the screen shell + store integration
jest.mock('../components/HijriDate', () => ({ HijriDate: () => null }));
jest.mock('../components/NotificationToggle', () => ({ NotificationToggle: () => null }));
jest.mock('../components/PrayerCard', () => ({ PrayerCard: () => null }));
jest.mock('../components/CountdownTimer', () => ({ CountdownTimer: () => null }));
jest.mock('../components/CustomAlert', () => ({ CustomAlert: () => null }));

// Icons used directly by HomeScreen (avoid pulling in full lucide -> react-native-svg -> css-interop)
jest.mock('lucide-react-native', () => ({
  ChevronDown: () => null,
  VolumeX: () => null,
  Share2: () => null,
  Square: () => null,
  CheckSquare: () => null,
  Search: () => null,
  MapPin: () => null,
  X: () => null,
}));

jest.mock('../store/useStore', () => {
  const mockState = {
    location: { latitude: 52.09, longitude: 5.12 },
    city: 'Utrecht',
    country: 'Netherlands',
    language: 'tr',
    calculationMethod: 'Turkey',
    asrMethod: 'Standard',
    highLatitudeRule: 'MiddleOfTheNight',
    timeFormat: '24h',
    viewMode: 'standart',
    theme: 'system',
    isAdhanPlaying: false,
    savedLocations: [],
    prayerLog: {},
    togglePrayerPerformed: jest.fn(),
    addSavedLocation: jest.fn(),
    selectLocation: jest.fn(),
  };
  const useStore = () => mockState;
  (useStore as unknown as { getState: () => typeof mockState }).getState = () => mockState;
  return { useStore };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('../lib/notifications', () => ({
  stopAdhan: jest.fn(),
  refreshAllNotifications: jest.fn(),
  updatePersistentNotification: jest.fn(),
}));

jest.mock('../lib/location', () => ({
  searchCities: jest.fn().mockResolvedValue([]),
  getCityName: () => '',
  getProvinceAndCountry: () => '',
}));

jest.mock('../lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useNavigation: () => ({ setOptions: jest.fn() }),
}));

describe('HomeScreen', () => {
  it('renders without crashing', async () => {
    render(<HomeScreen />);
    await waitFor(() => {
      expect(screen.getByText('UTRECHT')).toBeTruthy();
    });
  });

  it('shows prayer times when store has location and prayer data is loaded', async () => {
    render(<HomeScreen />);
    await waitFor(
      () => {
        expect(screen.getByText('İmsak')).toBeTruthy();
        expect(screen.getByText('Öğle')).toBeTruthy();
        expect(screen.getByText('İkindi')).toBeTruthy();
        expect(screen.getByText('Akşam')).toBeTruthy();
        expect(screen.getByText('Yatsı')).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});
