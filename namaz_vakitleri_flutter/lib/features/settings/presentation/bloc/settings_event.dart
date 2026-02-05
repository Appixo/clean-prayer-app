part of 'settings_bloc.dart';

sealed class SettingsEvent extends Equatable {
  const SettingsEvent();
  @override
  List<Object?> get props => [];
}

final class SettingsLoadRequested extends SettingsEvent {
  const SettingsLoadRequested();
}

final class CalculationMethodChanged extends SettingsEvent {
  const CalculationMethodChanged(this.method);
  final CalculationMethod method;
  @override
  List<Object?> get props => [method];
}

final class AsrMethodChanged extends SettingsEvent {
  const AsrMethodChanged(this.asrMethod);
  final AsrMethod asrMethod;
  @override
  List<Object?> get props => [asrMethod];
}

final class HighLatitudeRuleChanged extends SettingsEvent {
  const HighLatitudeRuleChanged(this.rule);
  final HighLatitudeRule rule;
  @override
  List<Object?> get props => [rule];
}

final class TimeFormatChanged extends SettingsEvent {
  const TimeFormatChanged(this.format);
  final TimeFormat format;
  @override
  List<Object?> get props => [format];
}

final class ThemeChanged extends SettingsEvent {
  const ThemeChanged(this.theme);
  final AppTheme theme;
  @override
  List<Object?> get props => [theme];
}

final class LanguageChanged extends SettingsEvent {
  const LanguageChanged(this.language);
  final String language;
  @override
  List<Object?> get props => [language];
}

final class ViewModeChanged extends SettingsEvent {
  const ViewModeChanged(this.viewMode);
  final ViewMode viewMode;
  @override
  List<Object?> get props => [viewMode];
}
