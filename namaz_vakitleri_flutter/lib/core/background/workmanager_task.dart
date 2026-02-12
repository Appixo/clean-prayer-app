import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/utils/hijri_date.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';
import 'package:namaz_vakitleri_flutter/data/services/widget_service.dart';

const _midnightTaskName = 'prayerTimesMidnightUpdate';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    if (taskName != _midnightTaskName || !Platform.isAndroid) {
      return false;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      final widgetService = WidgetService(prefs);
      final cache = widgetService.getWidgetConfigCache();
      if (cache == null) return true;

      final calculator = PrayerCalculator();
      final now = DateTime.now();
      final entity = calculator.getPrayerTimesForDate(
        coordinates: cache.coordinates,
        params: cache.calculationParams,
        date: now,
      );

      final dateStr = DateFormat.yMMMMd('tr').format(now);
      final hijriStr = formatHijriDate(now);
      final theme = WidgetService.themeStringFromIndex(cache.themeIndex);
      await widgetService.syncPrayerDataToWidget(
        city: cache.city,
        date: dateStr,
        hijriDate: hijriStr,
        prayerTimes: entity,
        theme: theme,
      );
      return true;
    } catch (e, st) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('[Workmanager] midnight task failed: $e\n$st');
      }
      return false;
    }
  });
}

/// Registers the periodic "midnight" task to refresh prayer times and widget
/// (same behaviour as Expo background-fetch: update cache + widget for new day).
/// No-op when [AppConstants.enableWidgets] is false.
Future<void> registerBackgroundTask() async {
  if (!AppConstants.enableWidgets) return;
  await Workmanager().initialize(callbackDispatcher);
  await Workmanager().registerPeriodicTask(
    _midnightTaskName,
    _midnightTaskName,
    frequency: const Duration(hours: 24),
    initialDelay: const Duration(minutes: 1),
  );
}
