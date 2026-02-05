import 'package:flutter_test/flutter_test.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';

/// Tier 1: Mathematical accuracy. Diyanet (Turkey) calculation must be within
/// 1 minute of reference values. Reference source: Diyanet İşleri Başkanlığı
/// (https://www.diyanet.gov.tr) for the given date; update when adhan_dart or
/// Diyanet tables change.
///
/// Note: Calculator returns times in device local timezone (.toLocal()). For
/// reference match, run tests with TZ=Europe/Istanbul (Istanbul test) and
/// TZ=Europe/London (London test), or from Turkey/UK.
void main() {
  late PrayerCalculator calculator;

  setUp(() {
    calculator = PrayerCalculator();
  });

  const turkeyParams = CalculationParams(
    method: CalculationMethod.turkey,
    asrMethod: AsrMethod.standard,
    highLatitudeRule: HighLatitudeRule.middleOfTheNight,
  );

  /// Absolute difference in minutes between two local times (same day).
  int diffMinutes(DateTime a, DateTime b) {
    final diff = a.difference(b).inMinutes;
    return diff < 0 ? -diff : diff;
  }

  group('Diyanet accuracy', () {
    test(
        'Istanbul Fajr and Maghrib within 1 minute of reference (2025-06-15) [UTC Comparison]',
        () {
      const coords = Coordinates(latitude: 41.0082, longitude: 28.9784);
      final date = DateTime(2025, 6, 15);
      final result = calculator.getPrayerTimesForDate(
        coordinates: coords,
        params: turkeyParams,
        date: date,
      );
      // Reference: Diyanet Istanbul 15 Haziran 2025 (UTC+3) -> Adjusted to UTC
      // Fajr: 03:28 (UTC+3) -> 00:28 UTC
      // Maghrib: 20:32 (UTC+3) -> 17:32 UTC
      final referenceFajrUtc = DateTime.utc(2025, 6, 15, 0, 28);
      final referenceMaghribUtc = DateTime.utc(2025, 6, 15, 17, 32);

      expect(diffMinutes(result.fajr.toUtc(), referenceFajrUtc),
          lessThanOrEqualTo(1),
          reason:
              'Fajr (UTC) ${result.fajr.toUtc()} vs reference $referenceFajrUtc');
      expect(diffMinutes(result.maghrib.toUtc(), referenceMaghribUtc),
          lessThanOrEqualTo(1),
          reason:
              'Maghrib (UTC) ${result.maghrib.toUtc()} vs reference $referenceMaghribUtc');
    });

    test(
        'London Fajr and Maghrib within 1 minute of reference (2025-06-15) [UTC Comparison]',
        () {
      const coords = Coordinates(latitude: 51.5074, longitude: -0.1278);
      final date = DateTime(2025, 6, 15);
      final result = calculator.getPrayerTimesForDate(
        coordinates: coords,
        params: turkeyParams,
        date: date,
      );
      // Reference: London 15 June 2025 (BST UTC+1) -> Adjusted to UTC
      // Fajr: 02:44 (UTC+1) -> 01:44 UTC
      // Maghrib: 21:18 (UTC+1) -> 20:18 UTC
      final referenceFajrUtc = DateTime.utc(2025, 6, 15, 1, 44);
      final referenceMaghribUtc = DateTime.utc(2025, 6, 15, 20, 18);

      expect(diffMinutes(result.fajr.toUtc(), referenceFajrUtc),
          lessThanOrEqualTo(1),
          reason:
              'Fajr (UTC) ${result.fajr.toUtc()} vs reference $referenceFajrUtc');
      expect(diffMinutes(result.maghrib.toUtc(), referenceMaghribUtc),
          lessThanOrEqualTo(1),
          reason:
              'Maghrib (UTC) ${result.maghrib.toUtc()} vs reference $referenceMaghribUtc');
    });
  });
}
