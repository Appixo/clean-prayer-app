import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';

/// Reusable test data for prayer calculation.
class PrayerTimesFixture {
  PrayerTimesFixture._();

  static const turkeyParams = CalculationParams(
    method: CalculationMethod.turkey,
    asrMethod: AsrMethod.standard,
    highLatitudeRule: HighLatitudeRule.middleOfTheNight,
  );

  static DateTime testDate(int year, int month, int day) =>
      DateTime(year, month, day);
}
