/**
 * Jest setup for Expo 54 + NativeWind 4 + RNTL
 * Mocks NativeWind, Expo Router, native modules, and Android Widget to avoid
 * runtime/syntax errors and to keep tests focused on behavior.
 */

// Optional: uncomment if you add react-native-gesture-handler as a dependency
// import 'react-native-gesture-handler/jestSetup';

// Mock NativeWind 4 — we do not need to test CSS class generation
jest.mock('nativewind', () => ({
  styled: (Component: unknown) => Component,
  css: jest.fn(),
}));

// Mock Expo Router so components render without routing context
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }),
  usePathname: () => '/',
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: { Screen: 'Stack.Screen' },
  Tabs: { Screen: 'Tabs.Screen' },
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// Mock Android Widget to prevent XML/parsing errors when any module pulls it in
jest.mock('react-native-android-widget', () => ({
  FlexWidget: 'FlexWidget',
  TextWidget: 'TextWidget',
  WidgetTask: { updateWidget: jest.fn() },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 52.09, longitude: 5.12 },
  }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock AsyncStorage for persist and general storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

// Mock expo-localization so store's detectSystemLanguage doesn't break
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'tr' }],
  locale: 'tr',
}));

// Mock widget-bridge so store's setLocation/selectLocation don't call native code
jest.mock('./lib/widget-bridge', () => ({
  updateWidgetData: jest.fn().mockResolvedValue(undefined),
}));

// Reduce noise from expected warnings during tests (optional)
const originalWarn = global.console.warn;
const originalError = global.console.error;
global.console.warn = (msg: string, ...args: unknown[]) => {
  if (typeof msg === 'string' && (msg.includes('NativeWind') || msg.includes('Reanimated'))) return;
  originalWarn.call(console, msg, ...args);
};
global.console.error = (msg: string, ...args: unknown[]) => {
  if (typeof msg === 'string' && (msg.includes('NativeWind') || msg.includes('Reanimated'))) return;
  originalError.call(console, msg, ...args);
};
