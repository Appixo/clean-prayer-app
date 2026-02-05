part of 'notifications_bloc.dart';

sealed class NotificationsState extends Equatable {
  const NotificationsState({
    this.prayerNotifications = const {},
    this.preAlarms = const {},
    this.playAdhan = false,
  });
  final Map<PrayerName, bool> prayerNotifications;
  final Map<PrayerName, int> preAlarms;
  final bool playAdhan;
  @override
  List<Object?> get props => [prayerNotifications, preAlarms, playAdhan];
}

final class NotificationsStateInitial extends NotificationsState {
  const NotificationsStateInitial() : super();
}

final class NotificationsStateLoaded extends NotificationsState {
  const NotificationsStateLoaded({
    required super.prayerNotifications,
    required super.preAlarms,
    required super.playAdhan,
  });

  NotificationsStateLoaded copyWith({
    Map<PrayerName, bool>? prayerNotifications,
    Map<PrayerName, int>? preAlarms,
    bool? playAdhan,
  }) {
    return NotificationsStateLoaded(
      prayerNotifications: prayerNotifications ?? this.prayerNotifications,
      preAlarms: preAlarms ?? this.preAlarms,
      playAdhan: playAdhan ?? this.playAdhan,
    );
  }
}

extension NotificationsStateX on NotificationsState {
  Map<PrayerName, bool> get prayerNotifications {
    return switch (this) {
      NotificationsStateLoaded s => s.prayerNotifications,
      _ => {},
    };
  }

  Map<PrayerName, int> get preAlarms {
    return switch (this) {
      NotificationsStateLoaded s => s.preAlarms,
      _ => {},
    };
  }

  bool get playAdhan {
    return switch (this) {
      NotificationsStateLoaded s => s.playAdhan,
      _ => false,
    };
  }
}
