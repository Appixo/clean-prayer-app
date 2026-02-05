import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';

class PrayerLogLocalDatasource {
  PrayerLogLocalDatasource(this._prefs);

  final SharedPreferences _prefs;

  bool isPrayerPerformed(String dateKey, String prayerName) {
    return _prefs.getBool('${StorageKeys.prayerLogPrefix}${dateKey}_$prayerName') ?? false;
  }

  Future<void> setPrayerPerformed(String dateKey, String prayerName, bool performed) async {
    await _prefs.setBool('${StorageKeys.prayerLogPrefix}${dateKey}_$prayerName', performed);
  }
}
