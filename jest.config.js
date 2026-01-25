module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@notifee|adhan|luxon|@react-native-async-storage|react-native-reanimated|react-native-svg|react-native-safe-area-context|react-native-screens|@react-navigation|expo-router|expo-location|expo-notifications|expo-task-manager|expo-background-fetch|react-native-android-widget|zustand|nativewind)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js|jsx)'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/__tests__/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
