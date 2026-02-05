abstract class ZikirmatikRepository {
  Map<String, int> getHistory();
  Future<void> setCountForDate(String dateKey, int count);
}
