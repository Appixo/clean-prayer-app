import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';

class SettingsLocalDatasource {
  SettingsLocalDatasource(this._prefs);

  final SharedPreferences _prefs;

  static const _defaultLanguage = 'tr';
  static const _defaultMethod = CalculationMethod.turkey;
  static const _defaultAsr = AsrMethod.standard;
  static const _defaultHighLatitude = HighLatitudeRule.middleOfTheNight;

  AppSettings loadSettings() {
    final methodIndex = _prefs.getInt(StorageKeys.calculationMethod);
    final asrIndex = _prefs.getInt(StorageKeys.asrMethod);
    final highLatitudeIndex = _prefs.getInt(StorageKeys.highLatitudeRule);
    final timeFormatIndex = _prefs.getInt(StorageKeys.timeFormat);
    final themeIndex = _prefs.getInt(StorageKeys.theme);
    final viewModeIndex = _prefs.getInt(StorageKeys.viewMode);

    return AppSettings(
      calculationParams: CalculationParams(
        method: methodIndex != null ? CalculationMethod.values[methodIndex] : _defaultMethod,
        asrMethod: asrIndex != null ? AsrMethod.values[asrIndex] : _defaultAsr,
        highLatitudeRule: highLatitudeIndex != null ? HighLatitudeRule.values[highLatitudeIndex] : _defaultHighLatitude,
      ),
      timeFormat: timeFormatIndex != null ? TimeFormat.values[timeFormatIndex] : TimeFormat.hour24,
      theme: themeIndex != null ? AppTheme.values[themeIndex] : AppTheme.system,
      language: _prefs.getString(StorageKeys.language) ?? _defaultLanguage,
      viewMode: viewModeIndex != null ? ViewMode.values[viewModeIndex] : ViewMode.standart,
    );
  }

  Future<void> saveSettings(AppSettings settings) async {
    await _prefs.setInt(StorageKeys.calculationMethod, settings.calculationParams.method.index);
    await _prefs.setInt(StorageKeys.asrMethod, settings.calculationParams.asrMethod.index);
    await _prefs.setInt(StorageKeys.highLatitudeRule, settings.calculationParams.highLatitudeRule.index);
    await _prefs.setInt(StorageKeys.timeFormat, settings.timeFormat.index);
    await _prefs.setInt(StorageKeys.theme, settings.theme.index);
    await _prefs.setString(StorageKeys.language, settings.language);
    await _prefs.setInt(StorageKeys.viewMode, settings.viewMode.index);
  }

  List<SavedLocation> loadSavedLocations() {
    final json = _prefs.getString(StorageKeys.savedLocations);
    if (json == null) return [];
    final list = jsonDecode(json) as List<dynamic>?;
    if (list == null) return [];
    return list.map((e) => SavedLocation.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<void> saveSavedLocations(List<SavedLocation> locations) async {
    final list = locations.map((e) => e.toJson()).toList();
    await _prefs.setString(StorageKeys.savedLocations, jsonEncode(list));
  }

  String? get selectedLocationId => _prefs.getString(StorageKeys.selectedLocationId);

  Future<void> setSelectedLocationId(String? id) async {
    if (id == null) {
      await _prefs.remove(StorageKeys.selectedLocationId);
    } else {
      await _prefs.setString(StorageKeys.selectedLocationId, id);
    }
  }
}
