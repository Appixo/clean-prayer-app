import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';

class ZikirmatikLocalDatasource {
  ZikirmatikLocalDatasource(this._prefs);

  final SharedPreferences _prefs;

  Map<String, int> loadHistory() {
    final json = _prefs.getString('${StorageKeys.zikirmatikHistoryPrefix}map');
    if (json == null) return {};
    final map = jsonDecode(json) as Map<String, dynamic>?;
    if (map == null) return {};
    return map.map((k, v) => MapEntry(k, (v as num).toInt()));
  }

  Future<void> setCountForDate(String dateKey, int count) async {
    final map = loadHistory();
    map[dateKey] = count;
    await _prefs.setString('${StorageKeys.zikirmatikHistoryPrefix}map', jsonEncode(map));
  }
}
