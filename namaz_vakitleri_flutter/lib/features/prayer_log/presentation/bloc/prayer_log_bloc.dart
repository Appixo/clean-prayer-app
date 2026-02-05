import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_log_repository.dart';

part 'prayer_log_event.dart';
part 'prayer_log_state.dart';

class PrayerLogBloc extends Bloc<PrayerLogEvent, PrayerLogState> {
  PrayerLogBloc(this._repo) : super(const PrayerLogStateInitial()) {
    on<PrayerLogLoadRequested>(_onLoad);
    on<PrayerPerformedToggled>(_onToggled);
  }

  final PrayerLogRepository _repo;

  void _onLoad(PrayerLogLoadRequested event, Emitter<PrayerLogState> emit) {
    emit(const PrayerLogStateLoaded());
  }

  Future<void> _onToggled(PrayerPerformedToggled event, Emitter<PrayerLogState> emit) async {
    await _repo.setPrayerPerformed(event.dateKey, event.prayerName, event.performed);
    emit(const PrayerLogStateLoaded());
  }
}
