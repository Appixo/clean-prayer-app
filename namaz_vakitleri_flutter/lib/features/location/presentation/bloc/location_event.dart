part of 'location_bloc.dart';

sealed class LocationEvent extends Equatable {
  const LocationEvent();
  @override
  List<Object?> get props => [];
}

final class LocationRequested extends LocationEvent {
  const LocationRequested();
}

final class LocationUpdated extends LocationEvent {
  const LocationUpdated({
    required this.coordinates,
    this.city,
    this.country,
    this.timezone,
    this.isManual,
  });
  final Coordinates coordinates;
  final String? city;
  final String? country;
  final String? timezone;
  final bool? isManual;
  @override
  List<Object?> get props => [coordinates, city, country, timezone, isManual];
}

final class LocationSelected extends LocationEvent {
  const LocationSelected(this.locationId);
  final String locationId;
  @override
  List<Object?> get props => [locationId];
}

final class SavedLocationAdded extends LocationEvent {
  const SavedLocationAdded(this.location);
  final SavedLocation location;
  @override
  List<Object?> get props => [location];
}

final class SavedLocationRemoved extends LocationEvent {
  const SavedLocationRemoved(this.locationId);
  final String locationId;
  @override
  List<Object?> get props => [locationId];
}

/// Reload saved locations and selected id from repo (e.g. after app reset).
final class LocationReloadFromRepoRequested extends LocationEvent {
  const LocationReloadFromRepoRequested();
}
