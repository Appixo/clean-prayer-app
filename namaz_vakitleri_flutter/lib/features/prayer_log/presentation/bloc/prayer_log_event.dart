part of 'prayer_log_bloc.dart';

sealed class PrayerLogEvent extends Equatable {
  const PrayerLogEvent();
  @override
  List<Object?> get props => [];
}

final class PrayerLogLoadRequested extends PrayerLogEvent {
  const PrayerLogLoadRequested();
}

final class PrayerPerformedToggled extends PrayerLogEvent {
  const PrayerPerformedToggled(this.dateKey, this.prayerName, this.performed);
  final String dateKey;
  final String prayerName;
  final bool performed;
  @override
  List<Object?> get props => [dateKey, prayerName, performed];
}
