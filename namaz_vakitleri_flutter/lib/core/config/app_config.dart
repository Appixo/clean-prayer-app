import 'package:flutter/foundation.dart';

import 'env.dart';

/// App-wide configuration: environment, feature flags, metadata.
/// Inject via DI. Use --dart-define=ENV=dev|staging|prod when building.
class AppConfig {
  AppConfig._();

  static Env get env {
    if (kReleaseMode) {
      return envFromString(const String.fromEnvironment('ENV', defaultValue: 'prod'));
    }
    return envFromString(const String.fromEnvironment('ENV', defaultValue: 'dev'));
  }

  static bool get isDev => env == Env.dev;
  static bool get isStaging => env == Env.staging;
  static bool get isProd => env == Env.prod;

  /// Feature flags. Extend when adding A/B tests or gradual rollouts.
  static bool get useNewHome => false;
}
