import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/settings_repository.dart';

part 'settings_event.dart';
part 'settings_state.dart';

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  SettingsBloc(this._repo) : super(const SettingsStateInitial()) {
    on<SettingsLoadRequested>(_onLoad);
    on<CalculationMethodChanged>(_onCalculationMethodChanged);
    on<AsrMethodChanged>(_onAsrMethodChanged);
    on<HighLatitudeRuleChanged>(_onHighLatitudeRuleChanged);
    on<TimeFormatChanged>(_onTimeFormatChanged);
    on<ThemeChanged>(_onThemeChanged);
    on<LanguageChanged>(_onLanguageChanged);
    on<ViewModeChanged>(_onViewModeChanged);
  }

  final SettingsRepository _repo;

  void _onLoad(SettingsLoadRequested event, Emitter<SettingsState> emit) {
    final settings = _repo.getSettings();
    emit(SettingsStateLoaded(settings));
  }

  Future<void> _onCalculationMethodChanged(CalculationMethodChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(
      calculationParams: current.calculationParams.copyWith(method: event.method),
    );
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onAsrMethodChanged(AsrMethodChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(
      calculationParams: current.calculationParams.copyWith(asrMethod: event.asrMethod),
    );
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onHighLatitudeRuleChanged(HighLatitudeRuleChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(
      calculationParams: current.calculationParams.copyWith(highLatitudeRule: event.rule),
    );
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onTimeFormatChanged(TimeFormatChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(timeFormat: event.format);
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onThemeChanged(ThemeChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(theme: event.theme);
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onLanguageChanged(LanguageChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(language: event.language);
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }

  Future<void> _onViewModeChanged(ViewModeChanged event, Emitter<SettingsState> emit) async {
    final current = state.settings;
    if (current == null) return;
    final next = current.copyWith(viewMode: event.viewMode);
    await _repo.saveSettings(next);
    emit(SettingsStateLoaded(next));
  }
}
