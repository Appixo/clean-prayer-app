import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/location_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/settings_repository.dart';

part 'location_event.dart';
part 'location_state.dart';

class LocationBloc extends Bloc<LocationEvent, LocationState> {
  LocationBloc(this._locationRepo, this._settingsRepo) : super(const LocationStateInitial()) {
    on<LocationRequested>(_onLocationRequested);
    on<LocationUpdated>(_onLocationUpdated);
    on<LocationSelected>(_onLocationSelected);
    on<SavedLocationAdded>(_onSavedLocationAdded);
    on<SavedLocationRemoved>(_onSavedLocationRemoved);
    on<LocationReloadFromRepoRequested>(_onLocationReloadFromRepoRequested);
  }

  final LocationRepository _locationRepo;
  final SettingsRepository _settingsRepo;

  Future<void> _onLocationRequested(LocationRequested event, Emitter<LocationState> emit) async {
    final saved = _settingsRepo.getSavedLocations();
    final selectedId = _settingsRepo.getSelectedLocationId();
    final selected = selectedId != null
        ? saved.where((e) => e.id == selectedId).firstOrNull
        : null;

    if (selected != null) {
      emit(LocationStateLoaded(
        coordinates: Coordinates(latitude: selected.latitude, longitude: selected.longitude),
        city: selected.city,
        country: selected.country,
        timezone: null,
        savedLocations: saved,
        selectedLocationId: selectedId,
        isManual: true,
      ));
      return;
    }

    emit(const LocationStateLoading());
    final result = await _locationRepo.getCurrentLocation();
    if (result == null) {
      emit(LocationStateNoLocation(savedLocations: saved, selectedLocationId: selectedId));
      return;
    }
    emit(LocationStateLoaded(
      coordinates: result.coordinates,
      city: result.city ?? 'Unknown',
      country: result.country,
      timezone: result.timezone,
      savedLocations: saved,
      selectedLocationId: selectedId,
      isManual: false,
    ));
  }

  void _onLocationUpdated(LocationUpdated event, Emitter<LocationState> emit) {
    final current = state;
    final saved = current.savedLocations;
    final selectedId = current.selectedLocationId;
    if (current is LocationStateLoaded) {
      emit(current.copyWith(
        coordinates: event.coordinates,
        city: event.city ?? current.city,
        country: event.country ?? current.country,
        timezone: event.timezone ?? current.timezone,
        isManual: event.isManual ?? current.isManual,
      ));
    } else {
      emit(LocationStateLoaded(
        coordinates: event.coordinates,
        city: event.city ?? 'Unknown',
        country: event.country,
        timezone: event.timezone,
        savedLocations: saved,
        selectedLocationId: selectedId,
        isManual: event.isManual ?? false,
      ));
    }
  }

  Future<void> _onLocationSelected(LocationSelected event, Emitter<LocationState> emit) async {
    await _settingsRepo.setSelectedLocationId(event.locationId);
    final saved = _settingsRepo.getSavedLocations();
    final loc = saved.where((e) => e.id == event.locationId).firstOrNull;
    if (loc != null) {
      add(LocationUpdated(
        coordinates: Coordinates(latitude: loc.latitude, longitude: loc.longitude),
        city: loc.city,
        country: loc.country,
        isManual: true,
      ));
    }
  }

  Future<void> _onSavedLocationAdded(SavedLocationAdded event, Emitter<LocationState> emit) async {
    final saved = [...state.savedLocations, event.location];
    await _settingsRepo.saveSavedLocations(saved);
    final current = state;
    if (current is LocationStateLoaded) {
      emit(current.copyWith(savedLocations: saved));
    } else if (current is LocationStateNoLocation) {
      emit(LocationStateNoLocation(savedLocations: saved, selectedLocationId: current.selectedLocationId));
    }
  }

  Future<void> _onSavedLocationRemoved(SavedLocationRemoved event, Emitter<LocationState> emit) async {
    final saved = state.savedLocations.where((e) => e.id != event.locationId).toList();
    await _settingsRepo.saveSavedLocations(saved);
    final selectedId = state.selectedLocationId == event.locationId ? null : state.selectedLocationId;
    await _settingsRepo.setSelectedLocationId(selectedId);
    final current = state;
    if (current is LocationStateLoaded) {
      emit(current.copyWith(savedLocations: saved, selectedLocationId: selectedId));
    } else if (current is LocationStateNoLocation) {
      emit(LocationStateNoLocation(savedLocations: saved, selectedLocationId: selectedId));
    }
  }

  void _onLocationReloadFromRepoRequested(LocationReloadFromRepoRequested event, Emitter<LocationState> emit) {
    final saved = _settingsRepo.getSavedLocations();
    final selectedId = _settingsRepo.getSelectedLocationId();
    if (saved.isEmpty) {
      emit(LocationStateNoLocation(savedLocations: [], selectedLocationId: null));
      return;
    }
    final selected = selectedId != null ? saved.where((e) => e.id == selectedId).firstOrNull : null;
    if (selected != null) {
      emit(LocationStateLoaded(
        coordinates: Coordinates(latitude: selected.latitude, longitude: selected.longitude),
        city: selected.city,
        country: selected.country,
        savedLocations: saved,
        selectedLocationId: selectedId,
        isManual: true,
      ));
    } else {
      emit(LocationStateNoLocation(savedLocations: saved, selectedLocationId: selectedId));
    }
  }
}
