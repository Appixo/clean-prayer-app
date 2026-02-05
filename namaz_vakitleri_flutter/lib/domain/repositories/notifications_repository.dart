import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';

abstract class NotificationsRepository {
  Map<PrayerName, bool> getPrayerNotifications();
  Future<void> setPrayerNotification(PrayerName prayer, bool enabled);

  Map<PrayerName, int> getPreAlarms();
  Future<void> setPreAlarm(PrayerName prayer, int minutesBefore);

  bool get playAdhan;
  Future<void> setPlayAdhan(bool value);
}
