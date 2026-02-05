import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_log_repository.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/prayer_log_local_datasource.dart';

class PrayerLogRepositoryImpl implements PrayerLogRepository {
  PrayerLogRepositoryImpl(this._ds);

  final PrayerLogLocalDatasource _ds;

  @override
  bool isPrayerPerformed(String dateKey, String prayerName) => _ds.isPrayerPerformed(dateKey, prayerName);

  @override
  Future<void> setPrayerPerformed(String dateKey, String prayerName, bool performed) =>
      _ds.setPrayerPerformed(dateKey, prayerName, performed);
}
