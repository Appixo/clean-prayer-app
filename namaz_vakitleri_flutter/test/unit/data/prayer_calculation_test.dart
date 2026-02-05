import 'package:flutter_test/flutter_test.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';
import '../../fixtures/coordinates_fixture.dart';
import '../../fixtures/prayer_times_fixture.dart';

void main() {
  late PrayerCalculator calculator;

  setUp(() {
    calculator = PrayerCalculator();
  });

  group('PrayerCalculator', () {
    test('getPrayerTimesForDate returns all six prayer times', () {
      final date = PrayerTimesFixture.testDate(2025, 6, 15);
      final result = calculator.getPrayerTimesForDate(
        coordinates: CoordinatesFixture.istanbul,
        params: PrayerTimesFixture.turkeyParams,
        date: date,
      );

      expect(result.fajr, isNotNull);
      expect(result.sunrise, isNotNull);
      expect(result.dhuhr, isNotNull);
      expect(result.asr, isNotNull);
      expect(result.maghrib, isNotNull);
      expect(result.isha, isNotNull);
    });

    test('prayer times are in correct order for Istanbul', () {
      final date = PrayerTimesFixture.testDate(2025, 6, 15);
      final result = calculator.getPrayerTimesForDate(
        coordinates: CoordinatesFixture.istanbul,
        params: PrayerTimesFixture.turkeyParams,
        date: date,
      );

      expect(result.fajr.isBefore(result.sunrise), isTrue);
      expect(result.sunrise.isBefore(result.dhuhr), isTrue);
      expect(result.dhuhr.isBefore(result.asr), isTrue);
      expect(result.asr.isBefore(result.maghrib), isTrue);
      expect(result.maghrib.isBefore(result.isha), isTrue);
    });

    test('getQiblaAngle returns a value in 0-360 range', () {
      final angle = calculator.getQiblaAngle(CoordinatesFixture.istanbul);
      expect(angle, greaterThanOrEqualTo(0));
      expect(angle, lessThanOrEqualTo(360));
    });

    test('getQiblaAngle for Istanbul is roughly south-east', () {
      final angle = calculator.getQiblaAngle(CoordinatesFixture.istanbul);
      expect(angle, greaterThan(100));
      expect(angle, lessThan(180));
    });
  });
}
