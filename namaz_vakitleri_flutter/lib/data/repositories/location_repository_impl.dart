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
    final trimmed = query.trim();
    if (trimmed.length < 2) return [];
    AppLogger.api('searchCities query=$trimmed');
    try {
      var results = await _performSearch(trimmed, language);
      if (results.isEmpty && trimmed.contains(' ')) {
        await Future<void>.delayed(_delayBeforeFallback);
        results = await _tryFallbackQueries(trimmed, language);
      }
      AppLogger.api('searchCities results=${results.length}');
      return results;
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

  /// Nominatim allows max 1 request per second; delay between requests to avoid rate limiting.
  static const _nominatimDelay = Duration(milliseconds: 1100);
  /// Extra delay before fallback attempts so initial burst is fully past.
  static const _delayBeforeFallback = Duration(milliseconds: 2200);

  /// Performs one search: two Nominatim requests (full + prefix), merge, rank, filter, collapse.
  /// [rankByQuery] when set (e.g. for fallback) ranks/filters by this query instead of [query].
  Future<List<SearchResult>> _performSearch(
    String query,
    String language, {
    String? rankByQuery,
  }) async {
    final q = rankByQuery ?? query;
    final limit = rankByQuery != null ? 60 : 40;
    List<SearchResult> results = await _nominatimSearch(query, language, limit: limit);
    if (query.length >= 3 && rankByQuery == null) {
      await Future<void>.delayed(_nominatimDelay);
      final prefix = query.length > 3 ? query.substring(0, 3) : query;
      final prefixResults = await _nominatimSearch(prefix, language, limit: 60);
      results = _mergeAndDedupe(results, prefixResults);
    }
    results = _rankBySimilarity(results, q);
    final firstWord = rankByQuery != null
        ? (q.trim().split(RegExp(r'\s+')).isNotEmpty ? q.trim().split(RegExp(r'\s+')).first.toLowerCase() : '')
        : '';
    results = results.where((r) {
      if (_similarity(q, r.city) >= 0.45) return true;
      if (firstWord.isNotEmpty && r.city.toLowerCase().trim().startsWith(firstWord)) return true;
      return false;
    }).toList();
    results = _collapseByCityCountry(results);
    return results.take(20).toList();
  }

  /// When original query returns 0 results and has multiple words, try shorter queries.
  Future<List<SearchResult>> _tryFallbackQueries(String query, String language) async {
    final words = query.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    for (int wordsToRemove = 1; wordsToRemove <= 2; wordsToRemove++) {
      if (wordsToRemove > 1) await Future<void>.delayed(_nominatimDelay);
      final remainingWords = words.length - wordsToRemove;
      if (remainingWords < 1) break;
      final fallbackQuery = words.take(remainingWords).join(' ');
      if (fallbackQuery.length < 3) continue;
      if (kDebugMode) _log('Fallback: trying "$fallbackQuery"');
      final results = await _performSearch(fallbackQuery, language, rankByQuery: query);
      if (results.isNotEmpty) {
        if (kDebugMode) _log('Fallback: got ${results.length} results for "$fallbackQuery"');
        return results;
      }
    }
    return [];
  }

  Future<List<SearchResult>> _nominatimSearch(String query, String language, {int limit = 40}) async {
    final uri = Uri.parse(
      'https://nominatim.openstreetmap.org/search'
      '?q=${Uri.encodeComponent(query)}&format=json&limit=$limit&addressdetails=1&accept-language=$language',
    );
    final response = await http.get(
      uri,
      headers: {'User-Agent': 'NamazVakitleriFlutter/1.0'},
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      if (kDebugMode) _log('Nominatim query="$query" HTTP ${response.statusCode}');
      return [];
    }
    final list = jsonDecode(response.body) as List<dynamic>?;
    if (list == null) return [];
    if (kDebugMode) _log('Nominatim query="$query" returned ${list.length} raw items');
    if (kDebugMode && query.length <= 4) {
      _log('Nominatim query="$query" returned ${list.length} raw items');
      for (var i = 0; i < list.length && i < 10; i++) {
        final item = list[i] as Map<String, dynamic>;
        final addr = item['address'] as Map<String, dynamic>?;
        final type = item['type'] ?? '?';
        final cls = item['class'] ?? '?';
        final city = addr?['city'] ?? addr?['town'] ?? addr?['village'] ?? '?';
        _log('  [$i] type=$type class=$cls city=$city');
      }
      if (list.length > 10) _log('  ... and ${list.length - 10} more');
    }
    final seen = <String>{};
    final results = <SearchResult>[];
    for (final item in list) {
      final map = item as Map<String, dynamic>;
      final address = map['address'] as Map<String, dynamic>?;
      final lat = _parseDouble(map['lat']);
      final lon = _parseDouble(map['lon']);
      if (lat == null || lon == null || address == null) continue;
      final type = (map['type'] as String?)?.toLowerCase() ?? '';
      final cls = (map['class'] as String?)?.toLowerCase() ?? '';
      final placeType = _classifyPlaceType(type, cls, address);
      final dn = (map['display_name'] as String?)?.split(',');
      final city = address['city'] as String? ??
          address['town'] as String? ??
          address['village'] as String? ??
          address['municipality'] as String? ??
          (dn != null && dn.isNotEmpty ? dn.first.trim() : null) ??
          '?';
      final country = address['country'] as String? ?? '';
      final key = '${city.toLowerCase()}-${country.toLowerCase()}-${lat.toStringAsFixed(2)}-${lon.toStringAsFixed(2)}';
      if (seen.contains(key)) continue;
      seen.add(key);
      results.add(SearchResult(
        latitude: lat,
        longitude: lon,
        city: city,
        country: country.isEmpty ? null : country,
        placeType: placeType,
      ));
    }
    return results;
  }

  List<SearchResult> _mergeAndDedupe(List<SearchResult> a, List<SearchResult> b) {
    final seen = <String>{};
    final out = <SearchResult>[];
    for (final r in [...a, ...b]) {
      final key = '${r.city.toLowerCase()}-${(r.country ?? '').toLowerCase()}-${r.latitude.toStringAsFixed(2)}-${r.longitude.toStringAsFixed(2)}';
      if (seen.contains(key)) continue;
      seen.add(key);
      out.add(r);
    }
    return out;
  }

  /// Collapse identical city+country into one row (keep first = best after ranking).
  List<SearchResult> _collapseByCityCountry(List<SearchResult> results) {
    final seen = <String>{};
    final out = <SearchResult>[];
    for (final r in results) {
      final key = '${r.city.toLowerCase()}-${(r.country ?? '').toLowerCase()}';
      if (seen.contains(key)) continue;
      seen.add(key);
      out.add(r);
    }
    return out;
  }

  /// Levenshtein distance (insert, delete, substitute = 1).
  static int _levenshtein(String a, String b) {
    final m = a.length;
    final n = b.length;
    if (m == 0) return n;
    if (n == 0) return m;
    final row = List<int>.filled(n + 1, 0);
    for (int j = 0; j <= n; j++) {
      row[j] = j;
    }
    for (int i = 1; i <= m; i++) {
      int prev = i;
      for (int j = 1; j <= n; j++) {
        final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
        final next = [prev + cost, row[j] + 1, row[j - 1] + 1].reduce((x, y) => x < y ? x : y);
        row[j - 1] = prev;
        prev = next;
      }
      row[n] = prev;
    }
    return row[n];
  }

  /// Similarity 0.0–1.0 (1 = identical). Strongly prefer city that *starts with* query (e.g. "Utre" -> Utrecht).
  /// Down-rank cities that only contain the query in the middle (e.g. "Outre" in Sainte-Marie-Outre-l'Eau).
  static double _similarity(String query, String city) {
    final q = query.toLowerCase().trim();
    final c = city.toLowerCase().trim();
    if (c.startsWith(q)) return 0.98 + (q.length / c.length.clamp(1, 100)) * 0.02;
    if (c.contains(q)) return 0.72 + (q.length / c.length.clamp(1, 100)) * 0.08;
    final distance = _levenshtein(q, c);
    final maxLen = q.length > c.length ? q.length : c.length;
    return 1.0 - (distance / maxLen);
  }

  /// Place-type multiplier: cities boosted, organizations/buildings penalized.
  static double _placeTypeMultiplier(PlaceType type) {
    switch (type) {
      case PlaceType.city:
        return 1.2;
      case PlaceType.village:
        return 1.0;
      case PlaceType.other:
        return 0.6;
    }
  }

  List<SearchResult> _rankBySimilarity(List<SearchResult> results, String query) {
    if (results.isEmpty) return results;
    final scored = results
        .map((r) {
          final sim = _similarity(query, r.city);
          final score = sim * _placeTypeMultiplier(r.placeType);
          return MapEntry(score, r);
        })
        .toList();
    scored.sort((a, b) => b.key.compareTo(a.key));
    return scored.map((e) => e.value).toList();
  }

  /// Classify Nominatim type/class into PlaceType for ranking and best-match rules.
  /// [address] is used to treat administrative+boundary with city/town as city (e.g. Utrecht).
  static PlaceType _classifyPlaceType(String type, String cls, Map<String, dynamic>? address) {
    switch (type) {
      case 'city':
      case 'town':
        return PlaceType.city;
      case 'village':
      case 'municipality':
        return PlaceType.village;
      case 'hamlet':
      case 'locality':
      case 'suburb':
      case 'neighbourhood':
        return PlaceType.village;
      case 'administrative':
        if (cls == 'boundary' && address != null) {
          if (address['city'] != null || address['town'] != null) {
            return PlaceType.city;
          }
        }
        return PlaceType.other;
      default:
        break;
    }
    if (cls == 'place') return PlaceType.village;
    if (cls == 'building' || cls == 'office' || cls == 'amenity' ||
        cls == 'tourism' || cls == 'shop' || cls == 'leisure') {
      return PlaceType.other;
    }
    return PlaceType.other;
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
