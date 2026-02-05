part of 'prayer_times_bloc.dart';

sealed class PrayerTimesState extends Equatable {
  const PrayerTimesState({this.date});
  final DateTime? date;
  @override
  List<Object?> get props => [date];
}

final class PrayerTimesStateInitial extends PrayerTimesState {
  const PrayerTimesStateInitial() : super();
}

final class PrayerTimesStateLoaded extends PrayerTimesState {
  const PrayerTimesStateLoaded({
    required this.prayerTimes,
    required this.date,
    this.city = '',
    this.nextPrayerDate,
    this.countdownTimeUntilMs,
    this.countdownNextPrayer,
  }) : super(date: date);

  final PrayerTimesEntity prayerTimes;
  @override
  final DateTime date;
  final String city;
  /// Date (year/month/day) of the next prayer from now. Used so we only highlight that day's list.
  final DateTime? nextPrayerDate;
  /// Time until the actual next prayer from now (from today's entity). Shown on all dates so UI doesn't jump.
  final int? countdownTimeUntilMs;
  /// Next prayer name from now (for countdown label).
  final PrayerName? countdownNextPrayer;

  @override
  List<Object?> get props => [prayerTimes, date, city, nextPrayerDate, countdownTimeUntilMs, countdownNextPrayer];
}
