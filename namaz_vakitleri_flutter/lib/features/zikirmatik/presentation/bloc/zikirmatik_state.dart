part of 'zikirmatik_bloc.dart';

sealed class ZikirmatikState extends Equatable {
  const ZikirmatikState();
  @override
  List<Object?> get props => [];
}

final class ZikirmatikStateInitial extends ZikirmatikState {
  const ZikirmatikStateInitial();
}

final class ZikirmatikStateLoaded extends ZikirmatikState {
  const ZikirmatikStateLoaded({this.history = const {}});
  final Map<String, int> history;
  @override
  List<Object?> get props => [history];
}
