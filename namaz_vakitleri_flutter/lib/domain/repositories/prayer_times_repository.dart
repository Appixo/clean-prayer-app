import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';

abstract class PrayerTimesRepository {
  PrayerTimesEntity getPrayerTimesForDate({
    required Coordinates coordinates,
    required CalculationParams params,
    required DateTime date,
  });

  double getQiblaAngle(Coordinates coordinates);
}
