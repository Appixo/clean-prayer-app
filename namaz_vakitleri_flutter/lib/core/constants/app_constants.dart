/// App-wide constants: dimensions, durations, magic numbers.
/// Use for values shared across features.
class AppConstants {
  AppConstants._();

  /// Default padding for screens and cards.
  static const double defaultPadding = 16;

  /// Compact padding for tight layouts.
  static const double compactPadding = 8;

  /// Card corner radius used across the app (date, prayer list, verse, etc.).
  static const double cardRadius = 12;

  /// Inner card padding (horizontal) for main content cards.
  static const double cardPaddingHorizontal = 12;

  /// Inner card padding (vertical) for main content cards.
  static const double cardPaddingVertical = 16;

  /// Spacing between related elements.
  static const double defaultSpacing = 24;

  /// Debounce duration for search/input.
  static const Duration debounceDuration = Duration(milliseconds: 300);

  /// Cache TTL for prayer times (e.g. midnight refresh).
  static const Duration prayerTimesCacheDuration = Duration(hours: 24);

  /// Workmanager task frequency.
  static const Duration backgroundTaskFrequency = Duration(hours: 24);
}
