# Android Home Screen Widget Implementation

## Overview
This document describes the Android home screen widget implementation for the Prayer Times app.

## Implementation Summary

### 1. Packages Installed
- `react-native-android-widget` - Widget library for React Native
- `expo-background-fetch` - Background task scheduling
- `expo-task-manager` - Task management for background operations

### 2. Widget Component (`widgets/PrayerTimesWidget.tsx`)
- **Layout**: 4x2 widget (280dp x 110dp)
- **Left Side**: City name (top), Date & Hijri date (bottom)
- **Right Side**: Next prayer name (large text), Next prayer time (big time display)
- **Design**: Minimalist, clean layout with proper spacing
- **Click Action**: Opens the app when tapped

### 3. Data Bridge (`lib/widget-bridge.ts`)
- Pushes prayer times data from app to widget storage
- Uses AsyncStorage to store widget data
- Updates widget via WidgetTask API
- Called automatically when:
  - Location changes
  - Prayer times are recalculated
  - App initializes with location

### 4. Background Fetch (`lib/background-fetch.ts`)
- Registers background task for midnight updates
- Updates prayer times cache for new day
- Updates widget with fresh data
- Runs every hour (Android minimum interval)
- Continues after device reboot

### 5. Widget Task Handler (`widgets/widget-task-handler.tsx`)
- Handles widget lifecycle events:
  - `WIDGET_ADDED` - Widget added to home screen
  - `WIDGET_UPDATE` - Widget needs update
  - `WIDGET_RESIZED` - Widget size changed
  - `WIDGET_CLICK` - Widget tapped
  - `WIDGET_DELETED` - Widget removed
- Loads data from AsyncStorage
- Renders widget component with current data

### 6. Configuration (`app.json`)
- Widget plugin configured with:
  - Name: `PrayerTimesWidget`
  - Label: "Namaz Vakitleri"
  - Size: 4x2 cells (280dp x 110dp)
  - Update period: 30 minutes (1800000ms)
  - Description for widget picker
  - **Preview images**: Each widget has `previewImage` pointing at a drawable. The picker uses this so users see a preview before adding. Current setup uses `./assets/icon.png` for all three; the plugin copies it to `drawable/{widgetname}_preview.png`. To use custom previews (e.g. "Fajr 05:00", "Utrecht"), add PNGs under e.g. `assets/widget-previews/` and set per widget:
    - `PrayerTimesWidget`: `"previewImage": "./assets/widget-previews/prayertimeswidget_preview.png"`
    - `NextPrayerWidget`: `"previewImage": "./assets/widget-previews/nextprayerwidget_preview.png"`
    - `DailyScheduleWidget`: `"previewImage": "./assets/widget-previews/dailyschedulewidget_preview.png"`
  - Suggested sizes: ~320×180 (medium), ~220×220 (small), ~320×320 (large). Run `npx expo prebuild --platform android` after adding/changing preview assets.

### 7. Integration Points
- **App Initialization** (`app/_layout.tsx`): Updates widget on app start
- **Location Changes** (`store/useStore.ts`): Updates widget when location is set/selected
- **Prayer Times Load** (`app/(tabs)/index.tsx`): Updates widget when times are calculated
- **Cache Updates** (`lib/cache.ts`): Updates widget when cache is refreshed

## Next Steps for Testing

### 1. Prebuild Native Files
Since this is an Expo managed workflow, you need to generate native files:

```bash
npx expo prebuild --platform android
```

This will:
- Generate `android/` folder
- Configure widget provider in AndroidManifest.xml
- Set up native widget infrastructure

### 2. Build Development Client
Build a new development client with widget support:

```bash
npx expo run:android
```

Or use EAS Build:
```bash
eas build --profile development --platform android
```

### 3. Test Widget
1. Install the app on an Android device/emulator
2. Long-press on home screen
3. Select "Widgets" from the menu
4. Find "Namaz Vakitleri" widget
5. Add it to home screen
6. Verify it displays current prayer times
7. Tap widget to verify it opens the app

### 4. Test Background Updates
1. Set a location in the app
2. Add widget to home screen
3. Wait for midnight or manually trigger background fetch
4. Verify widget updates with new day's times

## Widget Data Structure

```typescript
interface WidgetData {
  city: string;              // City name (e.g., "AMSTERDAM")
  date: string;              // Gregorian date (e.g., "17 Ocak 2026, Cumartesi")
  hijriDate: string;         // Hijri date (e.g., "3 Recep 1404 H")
  nextPrayerName: string;    // Next prayer name (e.g., "Akşam")
  nextPrayerTime: string;    // Next prayer time (e.g., "17:07")
}
```

## Important Notes

1. **No Live Countdown**: Widget shows static time (no ticking seconds) due to Android update throttling
2. **Background Updates**: Widget refreshes via background fetch at midnight
3. **Data Storage**: Widget data stored in AsyncStorage for offline access
4. **Deep Linking**: Widget tap opens app via `clickAction="OPEN_APP"`
5. **Update Frequency**: Android limits widget updates to minimum 15-30 minutes

## Troubleshooting

### Widget Not Appearing
- Ensure `npx expo prebuild` was run
- Rebuild the app after adding widget plugin
- Check AndroidManifest.xml for widget provider registration

### Widget Shows Old Data
- Verify `updateWidgetData()` is being called
- Check AsyncStorage for widget data: `@prayer_times_widget_data`
- Ensure background fetch is registered

### Widget Not Updating
- Check background fetch registration in logs
- Verify battery optimization is not blocking updates
- Manually trigger update by opening app

## Future Enhancements

- Add dark mode support for widget
- Add configuration UI for widget (city selection, etc.)
- Add multiple widget sizes (2x1, 4x3)
- Add prayer times list widget variant
