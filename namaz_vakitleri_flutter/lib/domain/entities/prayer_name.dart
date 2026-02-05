
enum PrayerName {
  fajr,
  sunrise,
  dhuhr,
  asr,
  maghrib,
  isha,
}

extension PrayerNameX on PrayerName {
  String get key {
    switch (this) {
      case PrayerName.fajr:
        return 'fajr';
      case PrayerName.sunrise:
        return 'sunrise';
      case PrayerName.dhuhr:
        return 'dhuhr';
      case PrayerName.asr:
        return 'asr';
      case PrayerName.maghrib:
        return 'maghrib';
      case PrayerName.isha:
        return 'isha';
    }
  }
}
