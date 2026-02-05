part of 'zikirmatik_bloc.dart';

sealed class ZikirmatikEvent extends Equatable {
  const ZikirmatikEvent();
  @override
  List<Object?> get props => [];
}

final class ZikirmatikLoadRequested extends ZikirmatikEvent {
  const ZikirmatikLoadRequested();
}

final class ZikirmatikCountUpdated extends ZikirmatikEvent {
  const ZikirmatikCountUpdated(this.dateKey, this.count);
  final String dateKey;
  final int count;
  @override
  List<Object?> get props => [dateKey, count];
}
