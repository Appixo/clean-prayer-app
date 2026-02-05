import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';

class GetPrayerTimesForDate {
  GetPrayerTimesForDate(this._repository);

  final PrayerTimesRepository _repository;

  PrayerTimesEntity call({
    required Coordinates coordinates,
    required CalculationParams params,
    required DateTime date,
  }) {
    return _repository.getPrayerTimesForDate(
      coordinates: coordinates,
      params: params,
      date: date,
    );
  }
}
