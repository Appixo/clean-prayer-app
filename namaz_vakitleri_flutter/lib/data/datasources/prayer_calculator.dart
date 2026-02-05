import 'package:adhan_dart/adhan_dart.dart' as adhan;
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';

/// Pure calculation logic (no I/O). Wraps adhan_dart to produce [PrayerTimesEntity] with local [DateTime]s.
class PrayerCalculator {
  PrayerTimesEntity getPrayerTimesForDate({
    required Coordinates coordinates,
    required CalculationParams params,
    required DateTime date,
  }) {
    final adhanCoords = adhan.Coordinates(
      coordinates.latitude,
      coordinates.longitude,
    );
    final calculationParams = _toAdhanParams(params);
    final prayerTimes = adhan.PrayerTimes(
      coordinates: adhanCoords,
      date: date,
      calculationParameters: calculationParams,
      precision: true,
    );

    final fajr = prayerTimes.fajr.toLocal();
    final sunrise = prayerTimes.sunrise.toLocal();
    final dhuhr = prayerTimes.dhuhr.toLocal();
    final asr = prayerTimes.asr.toLocal();
    final maghrib = prayerTimes.maghrib.toLocal();
    final isha = prayerTimes.isha.toLocal();

    final now = DateTime.now();
    final next = _getNextPrayerLocal(
      fajr: fajr,
      sunrise: sunrise,
      dhuhr: dhuhr,
      asr: asr,
      maghrib: maghrib,
      isha: isha,
      current: now,
    );

    return PrayerTimesEntity(
      fajr: fajr,
      sunrise: sunrise,
      dhuhr: dhuhr,
      asr: asr,
      maghrib: maghrib,
      isha: isha,
      nextPrayer: next.name,
      timeUntilNextMs: next.timeUntilMs,
      nextPrayerTime: next.time,
    );
  }

  double getQiblaAngle(Coordinates coordinates) {
    final adhanCoords = adhan.Coordinates(
      coordinates.latitude,
      coordinates.longitude,
    );
    return adhan.Qibla.qibla(adhanCoords);
  }

  adhan.CalculationParameters _toAdhanParams(CalculationParams p) {
    adhan.CalculationParameters params;
    switch (p.method) {
      case CalculationMethod.mwl:
        params = adhan.CalculationMethodParameters.muslimWorldLeague();
        break;
      case CalculationMethod.isna:
      case CalculationMethod.northAmerica:
        params = adhan.CalculationMethodParameters.northAmerica();
        break;
      case CalculationMethod.egypt:
        params = adhan.CalculationMethodParameters.egyptian();
        break;
      case CalculationMethod.makkah:
        params = adhan.CalculationMethodParameters.ummAlQura();
        break;
      case CalculationMethod.karachi:
        params = adhan.CalculationMethodParameters.karachi();
        break;
      case CalculationMethod.tehran:
      case CalculationMethod.jafari:
        params = adhan.CalculationMethodParameters.tehran();
        break;
      case CalculationMethod.turkey:
        params = adhan.CalculationMethodParameters.turkiye();
        break;
      case CalculationMethod.moonsightingCommittee:
        params = adhan.CalculationMethodParameters.moonsightingCommittee();
        break;
      case CalculationMethod.dubai:
        params = adhan.CalculationMethodParameters.dubai();
        break;
      case CalculationMethod.kuwait:
        params = adhan.CalculationMethodParameters.kuwait();
        break;
      case CalculationMethod.qatar:
        params = adhan.CalculationMethodParameters.qatar();
        break;
      case CalculationMethod.singapore:
        params = adhan.CalculationMethodParameters.singapore();
        break;
      default:
        params = adhan.CalculationMethodParameters.muslimWorldLeague();
    }

    params.madhab = p.asrMethod == AsrMethod.hanafi ? adhan.Madhab.hanafi : adhan.Madhab.shafi;

    switch (p.highLatitudeRule) {
      case HighLatitudeRule.middleOfTheNight:
        params.highLatitudeRule = adhan.HighLatitudeRule.middleOfTheNight;
        break;
      case HighLatitudeRule.seventhOfTheNight:
        params.highLatitudeRule = adhan.HighLatitudeRule.seventhOfTheNight;
        break;
      case HighLatitudeRule.twilightAngle:
        params.highLatitudeRule = adhan.HighLatitudeRule.twilightAngle;
        break;
      default:
        params.highLatitudeRule = adhan.HighLatitudeRule.middleOfTheNight;
    }

    return params;
  }

  ({PrayerName? name, int? timeUntilMs, DateTime? time}) _getNextPrayerLocal({
    required DateTime fajr,
    required DateTime sunrise,
    required DateTime dhuhr,
    required DateTime asr,
    required DateTime maghrib,
    required DateTime isha,
    required DateTime current,
  }) {
    final prayers = [
      (PrayerName.fajr, fajr),
      (PrayerName.sunrise, sunrise),
      (PrayerName.dhuhr, dhuhr),
      (PrayerName.asr, asr),
      (PrayerName.maghrib, maghrib),
      (PrayerName.isha, isha),
    ];

    for (final (name, time) in prayers) {
      if (time.isAfter(current)) {
        return (
          name: name,
          timeUntilMs: time.difference(current).inMilliseconds,
          time: time,
        );
      }
    }

    final tomorrowFajr = DateTime(fajr.year, fajr.month, fajr.day + 1, fajr.hour, fajr.minute, fajr.second);
    return (
      name: PrayerName.fajr,
      timeUntilMs: tomorrowFajr.difference(current).inMilliseconds,
      time: tomorrowFajr,
    );
  }
}
