part of 'notifications_bloc.dart';

sealed class NotificationsEvent extends Equatable {
  const NotificationsEvent();
  @override
  List<Object?> get props => [];
}

final class NotificationsLoadRequested extends NotificationsEvent {
  const NotificationsLoadRequested();
}

final class PrayerNotificationToggled extends NotificationsEvent {
  const PrayerNotificationToggled(this.prayer, this.enabled);
  final PrayerName prayer;
  final bool enabled;
  @override
  List<Object?> get props => [prayer, enabled];
}

final class PreAlarmSet extends NotificationsEvent {
  const PreAlarmSet(this.prayer, this.minutesBefore);
  final PrayerName prayer;
  final int minutesBefore;
  @override
  List<Object?> get props => [prayer, minutesBefore];
}

final class PlayAdhanChanged extends NotificationsEvent {
  const PlayAdhanChanged(this.play);
  final bool play;
  @override
  List<Object?> get props => [play];
}
