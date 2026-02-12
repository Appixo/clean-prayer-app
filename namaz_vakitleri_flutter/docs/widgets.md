# Android home screen widgets

## Overview

The app exposes **three** Android home screen widgets. All read from the same SharedPreferences (`FlutterHomeWidget`) written by Flutter via the `home_widget` plugin. When prayer times or location/settings change, `WidgetService.syncPrayerDataToWidget` writes data and calls `HomeWidget.updateWidget` for all three provider names.

## Widgets

### 1. Namaz Vakitleri (Compact – next prayer)

- **Provider:** `PrayerTimesWidgetProvider`
- **Layout:** `widget_prayer_times.xml`
- **Shows:** Title, **next prayer time** (hero), "Sonraki: [name]", city • date.
- **Keys used:** `city`, `date`, `next_prayer_name`, `next_prayer_time`.

### 2. Namaz geri sayım (Countdown)

- **Provider:** `CountdownWidgetProvider`
- **Layout:** `widget_countdown.xml`
- **Shows:** Title, **countdown** (hh:mm:ss or mm:ss) until next prayer, "Sonraki: [name] [time]".
- **Keys used:** `time_until_next_ms`, `next_prayer_name`, `next_prayer_time`.
- **Note:** Countdown updates when the app or Workmanager refreshes data; system `updatePeriodMillis` is 30 min minimum.

### 3. Namaz vakitleri (gün) (Full schedule)

- **Provider:** `ScheduleWidgetProvider`
- **Layout:** `widget_schedule.xml`
- **Shows:** Title, city • date, then Fajr, Güneş, Öğle, İkindi, Akşam, Yatsı with times.
- **Keys used:** `city`, `date`, `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha`.

## Theme

- **Config cache** stores `themeIndex` (0=light, 1=dark, 2=system). When the app persists the widget config (on location/settings change), it saves the current theme.
- **Workmanager** midnight task uses `WidgetService.themeStringFromIndex(cache.themeIndex)` so the widget respects the user’s theme after background refresh instead of always using light.

## Files

| Role | Path |
|------|------|
| Flutter: sync + update all widgets | `lib/data/services/widget_service.dart` |
| Config cache (includes theme) | `lib/data/models/widget_config_cache.dart` |
| Background refresh (uses theme from cache) | `lib/core/background/workmanager_task.dart` |
| Compact widget | `android/.../PrayerTimesWidgetProvider.kt`, `res/layout/widget_prayer_times.xml` |
| Countdown widget | `android/.../CountdownWidgetProvider.kt`, `res/layout/widget_countdown.xml`, `res/xml/app_widget_countdown_info.xml` |
| Schedule widget | `android/.../ScheduleWidgetProvider.kt`, `res/layout/widget_schedule.xml`, `res/xml/app_widget_schedule_info.xml` |
| Manifest receivers | `android/app/src/main/AndroidManifest.xml` |

## Adding tap-to-open

To open the app when the user taps a widget, set a `PendingIntent` on the root view in each provider’s `onUpdate` (e.g. `views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)`). The intent should launch the app’s main activity.
