part of 'settings_bloc.dart';

sealed class SettingsState extends Equatable {
  const SettingsState({this.settings});
  final AppSettings? settings;
  @override
  List<Object?> get props => [settings];
}

final class SettingsStateInitial extends SettingsState {
  const SettingsStateInitial() : super();
}

final class SettingsStateLoaded extends SettingsState {
  const SettingsStateLoaded(AppSettings settings) : super(settings: settings);
}
