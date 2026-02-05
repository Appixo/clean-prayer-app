import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';

abstract class SettingsRepository {
  AppSettings getSettings();
  Future<void> saveSettings(AppSettings settings);

  List<SavedLocation> getSavedLocations();
  Future<void> saveSavedLocations(List<SavedLocation> locations);

  String? getSelectedLocationId();
  Future<void> setSelectedLocationId(String? id);
}
