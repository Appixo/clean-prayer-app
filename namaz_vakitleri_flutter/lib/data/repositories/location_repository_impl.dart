import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/location_repository.dart';

/// Timeout for getting a position (e.g. emulator with GPS off can hang indefinitely).
const _positionTimeout = Duration(seconds: 15);

class LocationRepositoryImpl implements LocationRepository {
  static void _log(String message) {
    if (kDebugMode) {
      debugPrint('[LocationRepo] $message');
    }
  }

  @override
  Future<LocationResult?> getCurrentLocation() async {
    _log('getCurrentLocation() started');
    LocationPermission permission = await Geolocator.checkPermission();
    _log('checkPermission() => $permission');

    if (permission == LocationPermission.deniedForever) {
      _log('Permission denied forever; returning null');
      return null;
    }
    if (permission == LocationPermission.denied) {
      _log('Requesting permission...');
      permission = await Geolocator.requestPermission();
      _log('requestPermission() => $permission');
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _log('User denied; returning null');
        return null;
      }
    }

    _log('Getting position (timeout ${_positionTimeout.inSeconds}s)...');
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: _positionTimeout,
        ),
      );
      _log('Position: lat=${position.latitude}, lng=${position.longitude}');
      String? city;
      String? country;
      try {
        final placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          city = p.locality ?? p.subAdministrativeArea ?? p.administrativeArea;
          country = p.country;
        }
      } catch (e) {
        _log('Reverse geocode failed: $e');
      }
      return LocationResult(
        coordinates: Coordinates(latitude: position.latitude, longitude: position.longitude),
        city: city ?? 'Konumum',
        country: country,
        timezone: null,
      );
    } on TimeoutException catch (e) {
      _log('getCurrentPosition timed out: $e');
      return null;
    } catch (e, st) {
      _log('getCurrentPosition failed: $e');
      if (kDebugMode) debugPrint(st.toString());
      return null;
    }
  }

  @override
  Future<List<SearchResult>> searchCities(String query, {String language = 'tr'}) async {
    if (query.trim().length < 2) return [];
    AppLogger.api('searchCities query=$query');
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search'
        '?q=${Uri.encodeComponent(query)}&format=json&limit=40&addressdetails=1&accept-language=$language',
      );
      final response = await http.get(
        uri,
        headers: {'User-Agent': 'NamazVakitleriFlutter/1.0'},
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) return [];
      final list = jsonDecode(response.body) as List<dynamic>?;
      if (list == null) return [];
      final seen = <String>{};
      final results = <SearchResult>[];
      for (final item in list) {
        final map = item as Map<String, dynamic>;
        final address = map['address'] as Map<String, dynamic>?;
        final lat = _parseDouble(map['lat']);
        final lon = _parseDouble(map['lon']);
        if (lat == null || lon == null || address == null) continue;
        final dn = (map['display_name'] as String?)?.split(',');
        final city = address['city'] as String? ??
            address['town'] as String? ??
            address['village'] as String? ??
            address['municipality'] as String? ??
            (dn != null && dn.isNotEmpty ? dn.first.trim() : null) ??
            '?';
        final country = address['country'] as String? ?? '';
        final key = '${city.toLowerCase()}-$country'.trim();
        if (seen.contains(key)) continue;
        seen.add(key);
        results.add(SearchResult(latitude: lat, longitude: lon, city: city, country: country.isEmpty ? null : country));
      }
      final out = results.take(20).toList();
      AppLogger.api('searchCities results=${out.length}');
      return out;
    } catch (e, st) {
      AppLogger.api('searchCities failed: $e');
      AppLogger.error(e, st);
      if (kDebugMode) {
        debugPrint('[LocationRepo] searchCities failed: $e');
        debugPrint(st.toString());
      }
      return [];
    }
  }

  /// Nominatim returns lat/lon as strings or numbers; parse both.
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  @override
  Future<bool> requestPermission() async {
    final status = await Geolocator.requestPermission();
    return status == LocationPermission.whileInUse || status == LocationPermission.always;
  }
}
