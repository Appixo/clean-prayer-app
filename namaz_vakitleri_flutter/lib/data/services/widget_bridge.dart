import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:namaz_vakitleri_flutter/data/services/widget_service.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';

/// Facade for widget updates. Delegates to [WidgetService].
/// Call after prayer times or location/settings change.
class WidgetBridge {
  /// Pushes current prayer data to the home widget (Android).
  /// Uses [WidgetService] so data is written to SharedPreferences
  /// (via home_widget) for the native widget to read.
  static Future<void> updateWidgetData({
    required String city,
    required String date,
    required String hijriDate,
    required PrayerTimesEntity prayerTimes,
    required String theme,
  }) async {
    await getIt<WidgetService>().syncPrayerDataToWidget(
      city: city,
      date: date,
      hijriDate: hijriDate,
      prayerTimes: prayerTimes,
      theme: theme,
    );
  }
}
