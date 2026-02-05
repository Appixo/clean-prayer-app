part of 'prayer_times_bloc.dart';

sealed class PrayerTimesEvent extends Equatable {
  const PrayerTimesEvent();
  @override
  List<Object?> get props => [];
}

final class PrayerTimesRefreshRequested extends PrayerTimesEvent {
  const PrayerTimesRefreshRequested();
}

final class PrayerTimesDateChanged extends PrayerTimesEvent {
  const PrayerTimesDateChanged(this.date);
  final DateTime date;
  @override
  List<Object?> get props => [date];
}
