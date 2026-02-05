import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/notifications_repository.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/notifications_local_datasource.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl(this._ds);

  final NotificationsLocalDatasource _ds;

  @override
  Map<PrayerName, bool> getPrayerNotifications() => _ds.loadPrayerNotifications();

  @override
  Future<void> setPrayerNotification(PrayerName prayer, bool enabled) => _ds.setPrayerNotification(prayer, enabled);

  @override
  Map<PrayerName, int> getPreAlarms() => _ds.loadPreAlarms();

  @override
  Future<void> setPreAlarm(PrayerName prayer, int minutesBefore) => _ds.setPreAlarm(prayer, minutesBefore);

  @override
  bool get playAdhan => _ds.playAdhan;

  @override
  Future<void> setPlayAdhan(bool value) => _ds.setPlayAdhan(value);
}
