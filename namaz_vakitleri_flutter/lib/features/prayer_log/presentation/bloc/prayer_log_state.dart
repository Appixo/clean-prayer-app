part of 'prayer_log_bloc.dart';

sealed class PrayerLogState extends Equatable {
  const PrayerLogState();
  @override
  List<Object?> get props => [];
}

final class PrayerLogStateInitial extends PrayerLogState {
  const PrayerLogStateInitial();
}

final class PrayerLogStateLoaded extends PrayerLogState {
  const PrayerLogStateLoaded();
}
