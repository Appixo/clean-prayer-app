import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';

class LocationResult {
  const LocationResult({
    required this.coordinates,
    this.city,
    this.country,
    this.timezone,
  });

  final Coordinates coordinates;
  final String? city;
  final String? country;
  final String? timezone;
}

/// Classifies Nominatim place type for ranking (cities boosted, organizations penalized).
enum PlaceType {
  /// City or town — preferred for "En iyi eşleşme".
  city,
  /// Village, municipality — neutral ranking.
  village,
  /// Amenity, building, office, etc. — downranked.
  other,
}

/// One search hit from Nominatim (city/location for onboarding).
class SearchResult {
  const SearchResult({
    required this.latitude,
    required this.longitude,
    required this.city,
    this.country,
    this.placeType = PlaceType.other,
  });

  final double latitude;
  final double longitude;
  final String city;
  final String? country;
  final PlaceType placeType;
}

abstract class LocationRepository {
  Future<LocationResult?> getCurrentLocation();
  Future<bool> requestPermission();
  Future<List<SearchResult>> searchCities(String query, {String language = 'tr'});
}
