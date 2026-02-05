import 'package:flutter_test/flutter_test.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';

/// BDD-style logic tests (mirrors test_driver/features/prayer_times_display.feature).
/// No emulator; runs in Dart VM.
void main() {
  late PrayerCalculator calculator;

  setUp(() {
    calculator = PrayerCalculator();
  });

  group('Prayer Times Display (BDD logic)', () {
    test('Given user location is Utrecht, When prayer times loaded for today, Then next prayer state available and all six times present', () {
      const coords = Coordinates(latitude: 52.0907, longitude: 5.1214);
      const params = CalculationParams(
        method: CalculationMethod.turkey,
        asrMethod: AsrMethod.standard,
        highLatitudeRule: HighLatitudeRule.middleOfTheNight,
      );
      final result = calculator.getPrayerTimesForDate(
        coordinates: coords,
        params: params,
        date: DateTime.now(),
      );
      expect(result.nextPrayer, isNotNull);
      expect(result.fajr, isNotNull);
      expect(result.sunrise, isNotNull);
      expect(result.dhuhr, isNotNull);
      expect(result.asr, isNotNull);
      expect(result.maghrib, isNotNull);
      expect(result.isha, isNotNull);
    });

    test('Given user location is Istanbul, When prayer times loaded for 2025-06-15, Then Fajr before Sunrise before Dhuhr before Asr before Maghrib before Isha', () {
      const coords = Coordinates(latitude: 41.0082, longitude: 28.9784);
      const params = CalculationParams(
        method: CalculationMethod.turkey,
        asrMethod: AsrMethod.standard,
        highLatitudeRule: HighLatitudeRule.middleOfTheNight,
      );
      final date = DateTime(2025, 6, 15);
      final result = calculator.getPrayerTimesForDate(
        coordinates: coords,
        params: params,
        date: date,
      );
      expect(result.fajr.isBefore(result.sunrise), isTrue);
      expect(result.sunrise.isBefore(result.dhuhr), isTrue);
      expect(result.dhuhr.isBefore(result.asr), isTrue);
      expect(result.asr.isBefore(result.maghrib), isTrue);
      expect(result.maghrib.isBefore(result.isha), isTrue);
    });
  });
}
