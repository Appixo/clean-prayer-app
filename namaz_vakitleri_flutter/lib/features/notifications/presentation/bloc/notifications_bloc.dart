import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/notifications_repository.dart';

part 'notifications_event.dart';
part 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc(this._repo) : super(const NotificationsStateInitial()) {
    on<NotificationsLoadRequested>(_onLoad);
    on<PrayerNotificationToggled>(_onPrayerToggled);
    on<PreAlarmSet>(_onPreAlarmSet);
    on<PlayAdhanChanged>(_onPlayAdhanChanged);
  }

  final NotificationsRepository _repo;

  void _onLoad(NotificationsLoadRequested event, Emitter<NotificationsState> emit) {
    emit(NotificationsStateLoaded(
      prayerNotifications: _repo.getPrayerNotifications(),
      preAlarms: _repo.getPreAlarms(),
      playAdhan: _repo.playAdhan,
    ));
  }

  Future<void> _onPrayerToggled(PrayerNotificationToggled event, Emitter<NotificationsState> emit) async {
    AppLogger.notifications('prayerNotification toggled prayer=${event.prayer.key} enabled=${event.enabled}');
    await _repo.setPrayerNotification(event.prayer, event.enabled);
    emit(NotificationsStateLoaded(
      prayerNotifications: _repo.getPrayerNotifications(),
      preAlarms: _repo.getPreAlarms(),
      playAdhan: _repo.playAdhan,
    ));
  }

  Future<void> _onPreAlarmSet(PreAlarmSet event, Emitter<NotificationsState> emit) async {
    await _repo.setPreAlarm(event.prayer, event.minutesBefore);
    emit(NotificationsStateLoaded(
      prayerNotifications: _repo.getPrayerNotifications(),
      preAlarms: _repo.getPreAlarms(),
      playAdhan: _repo.playAdhan,
    ));
  }

  Future<void> _onPlayAdhanChanged(PlayAdhanChanged event, Emitter<NotificationsState> emit) async {
    AppLogger.notifications('playAdhan changed play=${event.play}');
    await _repo.setPlayAdhan(event.play);
    final current = state;
    if (current is NotificationsStateLoaded) {
      emit(current.copyWith(playAdhan: event.play));
    } else {
      emit(NotificationsStateLoaded(
        prayerNotifications: _repo.getPrayerNotifications(),
        preAlarms: _repo.getPreAlarms(),
        playAdhan: event.play,
      ));
    }
  }
}
