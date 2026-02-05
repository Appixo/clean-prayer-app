import 'package:namaz_vakitleri_flutter/domain/repositories/zikirmatik_repository.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/zikirmatik_local_datasource.dart';

class ZikirmatikRepositoryImpl implements ZikirmatikRepository {
  ZikirmatikRepositoryImpl(this._ds);

  final ZikirmatikLocalDatasource _ds;

  @override
  Map<String, int> getHistory() => _ds.loadHistory();

  @override
  Future<void> setCountForDate(String dateKey, int count) => _ds.setCountForDate(dateKey, count);
}
