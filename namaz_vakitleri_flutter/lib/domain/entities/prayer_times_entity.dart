import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';

class PrayerTimesEntity extends Equatable {
  const PrayerTimesEntity({
    required this.fajr,
    required this.sunrise,
    required this.dhuhr,
    required this.asr,
    required this.maghrib,
    required this.isha,
    this.nextPrayer,
    this.timeUntilNextMs,
    this.nextPrayerTime,
  });

  final DateTime fajr;
  final DateTime sunrise;
  final DateTime dhuhr;
  final DateTime asr;
  final DateTime maghrib;
  final DateTime isha;
  final PrayerName? nextPrayer;
  final int? timeUntilNextMs;
  final DateTime? nextPrayerTime;

  @override
  List<Object?> get props => [
        fajr,
        sunrise,
        dhuhr,
        asr,
        maghrib,
        isha,
        nextPrayer,
        timeUntilNextMs,
        nextPrayerTime,
      ];
}
