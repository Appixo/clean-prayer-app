import 'package:equatable/equatable.dart';

enum CalculationMethod {
  mwl,
  isna,
  egypt,
  makkah,
  karachi,
  tehran,
  turkey,
  moonsightingCommittee,
  dubai,
  kuwait,
  qatar,
  singapore,
  northAmerica,
  jafari,
}

enum AsrMethod {
  standard,
  hanafi,
}

enum HighLatitudeRule {
  middleOfTheNight,
  seventhOfTheNight,
  twilightAngle,
}

class CalculationParams extends Equatable {
  const CalculationParams({
    required this.method,
    required this.asrMethod,
    required this.highLatitudeRule,
  });

  final CalculationMethod method;
  final AsrMethod asrMethod;
  final HighLatitudeRule highLatitudeRule;

  CalculationParams copyWith({
    CalculationMethod? method,
    AsrMethod? asrMethod,
    HighLatitudeRule? highLatitudeRule,
  }) {
    return CalculationParams(
      method: method ?? this.method,
      asrMethod: asrMethod ?? this.asrMethod,
      highLatitudeRule: highLatitudeRule ?? this.highLatitudeRule,
    );
  }

  @override
  List<Object?> get props => [method, asrMethod, highLatitudeRule];
}
