import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';

class NotificationsLocalDatasource {
  NotificationsLocalDatasource(this._prefs);

  final SharedPreferences _prefs;

  Map<PrayerName, bool> loadPrayerNotifications() {
    final map = <PrayerName, bool>{};
    for (final p in PrayerName.values) {
      map[p] = _prefs.getBool('${StorageKeys.notificationsPrefix}${p.key}') ?? false;
    }
    return map;
  }

  Future<void> setPrayerNotification(PrayerName prayer, bool enabled) async {
    await _prefs.setBool('${StorageKeys.notificationsPrefix}${prayer.key}', enabled);
  }

  Map<PrayerName, int> loadPreAlarms() {
    final map = <PrayerName, int>{};
    for (final p in PrayerName.values) {
      map[p] = _prefs.getInt('${StorageKeys.preAlarmPrefix}${p.key}') ?? 0;
    }
    return map;
  }

  Future<void> setPreAlarm(PrayerName prayer, int minutes) async {
    await _prefs.setInt('${StorageKeys.preAlarmPrefix}${prayer.key}', minutes);
  }

  bool get playAdhan => _prefs.getBool(StorageKeys.playAdhan) ?? false;

  Future<void> setPlayAdhan(bool value) async {
    await _prefs.setBool(StorageKeys.playAdhan, value);
  }
}
