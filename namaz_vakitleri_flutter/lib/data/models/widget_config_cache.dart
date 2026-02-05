import 'dart:convert';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';

/// Cached location + calculation config for widget fail-safe hydration.
/// Stored in SharedPreferences so workmanager / widget update can recompute
/// prayer times when the app process is killed.
class WidgetConfigCache {
  const WidgetConfigCache({
    required this.latitude,
    required this.longitude,
    required this.city,
    this.country,
    required this.calculationMethodIndex,
    required this.asrMethodIndex,
    required this.highLatitudeRuleIndex,
    required this.timeFormatIndex,
  });

  final double latitude;
  final double longitude;
  final String city;
  final String? country;
  final int calculationMethodIndex;
  final int asrMethodIndex;
  final int highLatitudeRuleIndex;
  final int timeFormatIndex;

  Coordinates get coordinates => Coordinates(latitude: latitude, longitude: longitude);

  CalculationParams get calculationParams => CalculationParams(
        method: CalculationMethod.values[calculationMethodIndex],
        asrMethod: AsrMethod.values[asrMethodIndex],
        highLatitudeRule: HighLatitudeRule.values[highLatitudeRuleIndex],
      );

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'city': city,
        'country': country,
        'calculationMethodIndex': calculationMethodIndex,
        'asrMethodIndex': asrMethodIndex,
        'highLatitudeRuleIndex': highLatitudeRuleIndex,
        'timeFormatIndex': timeFormatIndex,
      };

  static WidgetConfigCache? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    try {
      final lat = json['latitude'];
      final lng = json['longitude'];
      final city = json['city'];
      if (lat is! num || lng is! num || city is! String) return null;
      return WidgetConfigCache(
        latitude: lat.toDouble(),
        longitude: lng.toDouble(),
        city: city,
        country: json['country'] as String?,
        calculationMethodIndex: (json['calculationMethodIndex'] as int?) ?? CalculationMethod.turkey.index,
        asrMethodIndex: (json['asrMethodIndex'] as int?) ?? AsrMethod.standard.index,
        highLatitudeRuleIndex: (json['highLatitudeRuleIndex'] as int?) ?? HighLatitudeRule.middleOfTheNight.index,
        timeFormatIndex: (json['timeFormatIndex'] as int?) ?? 1,
      );
    } catch (_) {
      return null;
    }
  }

  static WidgetConfigCache? fromJsonString(String? jsonStr) {
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final map = jsonDecode(jsonStr) as Map<String, dynamic>?;
      return fromJson(map);
    } catch (_) {
      return null;
    }
  }
}
