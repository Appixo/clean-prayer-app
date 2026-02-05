part of 'location_bloc.dart';

sealed class LocationState extends Equatable {
  const LocationState({this.savedLocations = const [], this.selectedLocationId});

  final List<SavedLocation> savedLocations;
  final String? selectedLocationId;

  @override
  List<Object?> get props => [savedLocations, selectedLocationId];
}

final class LocationStateInitial extends LocationState {
  const LocationStateInitial() : super();
}

final class LocationStateLoading extends LocationState {
  const LocationStateLoading() : super();
}

final class LocationStateNoLocation extends LocationState {
  const LocationStateNoLocation({super.savedLocations, super.selectedLocationId});
}

final class LocationStateLoaded extends LocationState {
  const LocationStateLoaded({
    required this.coordinates,
    required this.city,
    this.country,
    this.timezone,
    super.savedLocations,
    super.selectedLocationId,
    this.isManual = false,
  });

  final Coordinates coordinates;
  final String city;
  final String? country;
  final String? timezone;
  final bool isManual;

  LocationStateLoaded copyWith({
    Coordinates? coordinates,
    String? city,
    String? country,
    String? timezone,
    List<SavedLocation>? savedLocations,
    String? selectedLocationId,
    bool? isManual,
  }) {
    return LocationStateLoaded(
      coordinates: coordinates ?? this.coordinates,
      city: city ?? this.city,
      country: country ?? this.country,
      timezone: timezone ?? this.timezone,
      savedLocations: savedLocations ?? this.savedLocations,
      selectedLocationId: selectedLocationId ?? this.selectedLocationId,
      isManual: isManual ?? this.isManual,
    );
  }

  @override
  List<Object?> get props => [coordinates, city, country, timezone, savedLocations, selectedLocationId, isManual];
}

extension LocationStateX on LocationState {
  List<SavedLocation> get savedLocations {
    return switch (this) {
      LocationStateLoaded s => s.savedLocations,
      LocationStateNoLocation s => s.savedLocations,
      _ => const [],
    };
  }

  String? get selectedLocationId {
    return switch (this) {
      LocationStateLoaded s => s.selectedLocationId,
      LocationStateNoLocation s => s.selectedLocationId,
      _ => null,
    };
  }

  Coordinates? get coordinates {
    return switch (this) {
      LocationStateLoaded s => s.coordinates,
      _ => null,
    };
  }

  String get city {
    return switch (this) {
      LocationStateLoaded s => s.city,
      _ => '',
    };
  }
}
