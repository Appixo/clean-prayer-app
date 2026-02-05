import 'package:equatable/equatable.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';

enum TimeFormat { hour12, hour24 }

enum AppTheme { light, dark, system }

enum ViewMode { basit, standart, gelismis }

class AppSettings extends Equatable {
  const AppSettings({
    required this.calculationParams,
    required this.timeFormat,
    required this.theme,
    required this.language,
    required this.viewMode,
  });

  final CalculationParams calculationParams;
  final TimeFormat timeFormat;
  final AppTheme theme;
  final String language;
  final ViewMode viewMode;

  AppSettings copyWith({
    CalculationParams? calculationParams,
    TimeFormat? timeFormat,
    AppTheme? theme,
    String? language,
    ViewMode? viewMode,
  }) {
    return AppSettings(
      calculationParams: calculationParams ?? this.calculationParams,
      timeFormat: timeFormat ?? this.timeFormat,
      theme: theme ?? this.theme,
      language: language ?? this.language,
      viewMode: viewMode ?? this.viewMode,
    );
  }

  @override
  List<Object?> get props => [calculationParams, timeFormat, theme, language, viewMode];
}
