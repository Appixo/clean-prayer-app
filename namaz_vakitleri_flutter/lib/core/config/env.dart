/// Application environment: dev, staging, prod.
/// Use --dart-define=ENV=dev|staging|prod when building.
enum Env {
  dev,
  staging,
  prod,
}

/// Parses environment from String.
Env envFromString(String? value) {
  switch (value?.toLowerCase()) {
    case 'dev':
      return Env.dev;
    case 'staging':
      return Env.staging;
    case 'prod':
    default:
      return Env.prod;
  }
}
