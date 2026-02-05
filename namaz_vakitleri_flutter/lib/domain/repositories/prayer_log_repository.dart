abstract class PrayerLogRepository {
  bool isPrayerPerformed(String dateKey, String prayerName);
  Future<void> setPrayerPerformed(String dateKey, String prayerName, bool performed);
}
