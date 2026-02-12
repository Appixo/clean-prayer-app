import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:home_widget/home_widget.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/data/models/widget_config_cache.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Single service that syncs prayer time data into the home_widget storage
/// (Android: SharedPreferences via home_widget; native widget reads same keys).
/// Also persists a config cache so workmanager can refresh the widget when
/// the app process is killed.
class WidgetService {
  WidgetService(this._prefs);

  final SharedPreferences _prefs;

  /// Android widget provider names; must match native AndroidManifest.
  static const String androidWidgetName = 'PrayerTimesWidgetProvider';
  static const String androidCountdownWidgetName = 'CountdownWidgetProvider';
  static const String androidScheduleWidgetName = 'ScheduleWidgetProvider';

  /// Resolves app theme to widget theme string for native UI.
  static String resolveWidgetTheme(AppTheme theme) {
    if (theme == AppTheme.light) return 'light';
    if (theme == AppTheme.dark) return 'dark';
    return 'light'; // system: default to light; native can use system if needed
  }

  /// Resolves theme string from cached themeIndex (for background/Workmanager).
  static String themeStringFromIndex(int themeIndex) {
    if (themeIndex == 1) return 'dark';
    return 'light';
  }

  static void _log(String message) {
    if (kDebugMode) {
      debugPrint('[WidgetService] $message');
    }
  }

  // --- Config cache (for background / workmanager) ---

  /// Persists current location + calculation config for widget fail-safe hydration.
  /// Call whenever location or calculation settings change.
  Future<void> persistWidgetConfigCache({
    required Coordinates coordinates,
    required String city,
    String? country,
    required CalculationParams calculationParams,
    required TimeFormat timeFormat,
    required AppTheme theme,
  }) async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      final cache = WidgetConfigCache(
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city: city,
        country: country,
        calculationMethodIndex: calculationParams.method.index,
        asrMethodIndex: calculationParams.asrMethod.index,
        highLatitudeRuleIndex: calculationParams.highLatitudeRule.index,
        timeFormatIndex: timeFormat.index,
        themeIndex: theme.index,
      );
      await _prefs.setString(StorageKeys.widgetConfigCache, jsonEncode(cache.toJson()));
      _log('Config cache persisted: $city');
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[WidgetService] persistWidgetConfigCache failed: $e');
        debugPrint(st.toString());
      }
    }
  }

  /// Returns cached config for background tasks (e.g. workmanager midnight refresh).
  /// Null if never saved or cleared.
  WidgetConfigCache? getWidgetConfigCache() {
    final jsonStr = _prefs.getString(StorageKeys.widgetConfigCache);
    return WidgetConfigCache.fromJsonString(jsonStr);
  }

  // --- Sync data to home_widget (SharedPreferences on Android) ---

  /// Writes all widget payload keys to home_widget and triggers widget update.
  /// On Android, home_widget stores these in SharedPreferences; the native
  /// widget reads them via the same plugin (or same prefs name) so no
  /// separate "group ID" is needed for Android.
  Future<void> syncPrayerDataToWidget({
    required String city,
    required String date,
    required String hijriDate,
    required PrayerTimesEntity prayerTimes,
    required String theme,
  }) async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      await HomeWidget.saveWidgetData<String>('city', city);
      await HomeWidget.saveWidgetData<String>('date', date);
      await HomeWidget.saveWidgetData<String>('hijri_date', hijriDate);
      await HomeWidget.saveWidgetData<String>(
        'next_prayer_name',
        prayerTimes.nextPrayer?.key ?? '',
      );
      await HomeWidget.saveWidgetData<String>(
        'next_prayer_time',
        prayerTimes.nextPrayerTime != null
            ? '${prayerTimes.nextPrayerTime!.hour.toString().padLeft(2, '0')}:${prayerTimes.nextPrayerTime!.minute.toString().padLeft(2, '0')}'
            : '',
      );
      await HomeWidget.saveWidgetData<int?>('time_until_next_ms', prayerTimes.timeUntilNextMs);
      await HomeWidget.saveWidgetData<String>('theme', theme);
      final now = DateTime.now();
      final lastUpdated =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
      await HomeWidget.saveWidgetData<String>('last_updated', lastUpdated);
      _savePrayerTimes(prayerTimes);
      await HomeWidget.updateWidget(androidName: androidWidgetName);
      await HomeWidget.updateWidget(androidName: androidCountdownWidgetName);
      await HomeWidget.updateWidget(androidName: androidScheduleWidgetName);
      _log('Widget updated: city=$city, next=${prayerTimes.nextPrayer?.key}, last_updated=$lastUpdated');
    } catch (e) {
      // Log once per message type to avoid spamming (e.g. widget not on home screen yet)
      if (kDebugMode) {
        debugPrint('[WidgetService] syncPrayerDataToWidget failed: $e');
      }
    }
  }

  void _savePrayerTimes(PrayerTimesEntity pt) {
    String format(DateTime d) =>
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    HomeWidget.saveWidgetData<String>('fajr', format(pt.fajr));
    HomeWidget.saveWidgetData<String>('sunrise', format(pt.sunrise));
    HomeWidget.saveWidgetData<String>('dhuhr', format(pt.dhuhr));
    HomeWidget.saveWidgetData<String>('asr', format(pt.asr));
    HomeWidget.saveWidgetData<String>('maghrib', format(pt.maghrib));
    HomeWidget.saveWidgetData<String>('isha', format(pt.isha));
  }
}
