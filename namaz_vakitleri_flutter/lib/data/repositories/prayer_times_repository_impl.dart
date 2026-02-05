import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';

class PrayerTimesRepositoryImpl implements PrayerTimesRepository {
  PrayerTimesRepositoryImpl(this._calculator);

  final PrayerCalculator _calculator;

  @override
  PrayerTimesEntity getPrayerTimesForDate({
    required Coordinates coordinates,
    required CalculationParams params,
    required DateTime date,
  }) {
    return _calculator.getPrayerTimesForDate(
      coordinates: coordinates,
      params: params,
      date: date,
    );
  }

  @override
  double getQiblaAngle(Coordinates coordinates) {
    return _calculator.getQiblaAngle(coordinates);
  }
}
