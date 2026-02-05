import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/settings_repository.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/settings_local_datasource.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  SettingsRepositoryImpl(this._ds);

  final SettingsLocalDatasource _ds;

  @override
  AppSettings getSettings() => _ds.loadSettings();

  @override
  Future<void> saveSettings(AppSettings settings) => _ds.saveSettings(settings);

  @override
  List<SavedLocation> getSavedLocations() => _ds.loadSavedLocations();

  @override
  Future<void> saveSavedLocations(List<SavedLocation> locations) => _ds.saveSavedLocations(locations);

  @override
  String? getSelectedLocationId() => _ds.selectedLocationId;

  @override
  Future<void> setSelectedLocationId(String? id) => _ds.setSelectedLocationId(id);
}
