import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';

class GetQiblaAngle {
  GetQiblaAngle(this._repository);

  final PrayerTimesRepository _repository;

  double call(Coordinates coordinates) {
    return _repository.getQiblaAngle(coordinates);
  }
}
