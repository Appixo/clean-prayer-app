# home_widget setup (Android)

The app uses the **home_widget** package to send prayer data to Android home screen widgets. Data is written to SharedPreferences (via home_widget) so the native widget can read the same keys.

## WidgetService

- **`lib/data/services/widget_service.dart`** is the single service that syncs prayer data into the widget storage.
- **`syncPrayerDataToWidget(...)`** writes all payload keys to home_widget and calls `HomeWidget.updateWidget(androidName: 'PrayerTimesWidgetProvider')`.
- **`persistWidgetConfigCache(...)`** saves location + calculation params to SharedPreferences (`StorageKeys.widgetConfigCache`) so workmanager can refresh the widget when the app process is killed.
- **`getWidgetConfigCache()`** returns the cached config for background tasks (e.g. midnight refresh).

PrayerTimesBloc calls the widget service after emitting loaded state; no need to call it manually from UI.

## Native widget

1. Add the native Android widget (Kotlin/XML or Compose) and register the provider name **`PrayerTimesWidgetProvider`** in `AndroidManifest.xml`.
2. The native widget reads data via home_widget's API (e.g. `HomeWidget.getWidgetData<String>("city")`) so it uses the same SharedPreferences group as the Flutter app.
3. **Midnight refresh** is implemented in `lib/core/background/workmanager_task.dart`: a periodic task (`prayerTimesMidnightUpdate`) runs every 24h, loads `WidgetService(prefs).getWidgetConfigCache()`, recomputes today's prayer times with `PrayerCalculator`, then calls `syncPrayerDataToWidget(...)`. Registration happens in `main.dart` via `registerBackgroundTask()`.

## Payload keys

`city`, `date`, `hijri_date`, `next_prayer_name`, `next_prayer_time`, `time_until_next_ms`, `theme`, `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha`.
