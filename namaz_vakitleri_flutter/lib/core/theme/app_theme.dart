import 'package:flutter/material.dart';

/// Light grey scaffold, brand primary (#276ddf), white cards with shadow (reference Expo UI).
/// Typography matches Expo: section headers w900, card titles w700, body w500/normal.
class AppTheme {
  AppTheme._();

  /// Brand color (app logo). Single source of truth for primary UI.
  static const Color brandPrimary = Color(0xFF276ddf);
  static const Color brandPrimaryDark = Color(0xFF1e5bc9);
  static const Color brandPrimaryLight = Color(0xFF5b91e8);

  static const Color _scaffoldLight = Color(0xFFF8FAFC);
  static const Color _cardLight = Color(0xFFFFFFFF);
  static const Color _highlightYellow = Color(0xFFFFF59D);

  /// Expo parity: font-black (900), font-bold (700), font-medium (500).
  static TextTheme _textTheme(ColorScheme colorScheme) {
    final base = ThemeData().textTheme;
    return TextTheme(
      displayLarge: base.displayLarge?.copyWith(fontWeight: FontWeight.w900),
      displayMedium: base.displayMedium?.copyWith(fontWeight: FontWeight.w900),
      displaySmall: base.displaySmall?.copyWith(fontWeight: FontWeight.w900),
      headlineLarge: base.headlineLarge?.copyWith(fontWeight: FontWeight.w900),
      headlineMedium: base.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
      headlineSmall: base.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
      titleLarge: base.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      titleMedium: base.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      titleSmall: base.titleSmall?.copyWith(fontWeight: FontWeight.w700),
      bodyLarge: base.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      bodyMedium: base.bodyMedium?.copyWith(fontWeight: FontWeight.normal),
      bodySmall: base.bodySmall?.copyWith(fontWeight: FontWeight.normal),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w700),
      labelMedium: base.labelMedium?.copyWith(fontWeight: FontWeight.w500),
      labelSmall: base.labelSmall?.copyWith(fontWeight: FontWeight.w500),
    );
  }

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: brandPrimary,
      brightness: Brightness.light,
      primary: brandPrimary,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme.copyWith(
        surface: _scaffoldLight,
        surfaceContainerHighest: _cardLight,
      ),
      textTheme: _textTheme(colorScheme),
      scaffoldBackgroundColor: _scaffoldLight,
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: _scaffoldLight,
        foregroundColor: colorScheme.primary,
      ),
      cardTheme: CardThemeData(
        color: _cardLight,
        elevation: 1,
        shadowColor: Colors.black26,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: brandPrimary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  static ThemeData get dark {
    const Color scaffoldDark = Color(0xFF1E293B);
    const Color cardDark = Color(0xFF334155);
    const Color surfaceHighest = Color(0xFF475569);
    const Color onSurfaceDark = Color(0xFFF1F5F9);
    const Color onSurfaceVariantDark = Color(0xFFCBD5E1);
    /// Dark theme primary: lighter tint of brand for visibility on dark backgrounds.
    const Color darkPrimary = Color(0xFF6b9ef5);
    const Color onPrimaryContainerDark = Color(0xFFE0F2FE);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: brandPrimary,
      brightness: Brightness.dark,
      surface: scaffoldDark,
    );
    final darkScheme = colorScheme.copyWith(
      primary: darkPrimary,
      surface: scaffoldDark,
      surfaceContainerHighest: cardDark,
      onSurface: onSurfaceDark,
      onSurfaceVariant: onSurfaceVariantDark,
      onPrimaryContainer: onPrimaryContainerDark,
    );
    final baseText = _textTheme(darkScheme);
    final darkTextTheme = TextTheme(
      displayLarge: baseText.displayLarge?.copyWith(color: onSurfaceDark),
      displayMedium: baseText.displayMedium?.copyWith(color: onSurfaceDark),
      displaySmall: baseText.displaySmall?.copyWith(color: onSurfaceDark),
      headlineLarge: baseText.headlineLarge?.copyWith(color: onSurfaceDark),
      headlineMedium: baseText.headlineMedium?.copyWith(color: onSurfaceDark),
      headlineSmall: baseText.headlineSmall?.copyWith(color: onSurfaceDark),
      titleLarge: baseText.titleLarge?.copyWith(color: onSurfaceDark),
      titleMedium: baseText.titleMedium?.copyWith(color: onSurfaceDark),
      titleSmall: baseText.titleSmall?.copyWith(color: onSurfaceVariantDark),
      bodyLarge: baseText.bodyLarge?.copyWith(color: onSurfaceDark),
      bodyMedium: baseText.bodyMedium?.copyWith(color: Color(0xFFE2E8F0)),
      bodySmall: baseText.bodySmall?.copyWith(color: onSurfaceVariantDark),
      labelLarge: baseText.labelLarge?.copyWith(color: onSurfaceDark),
      labelMedium: baseText.labelMedium?.copyWith(color: Color(0xFFE2E8F0)),
      labelSmall: baseText.labelSmall?.copyWith(color: onSurfaceVariantDark),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: darkScheme,
      textTheme: darkTextTheme,
      scaffoldBackgroundColor: scaffoldDark,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: scaffoldDark,
        foregroundColor: darkPrimary,
      ),
      cardTheme: CardThemeData(
        color: cardDark,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shadowColor: Colors.black45,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardDark,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: surfaceHighest),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkPrimary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      listTileTheme: ListTileThemeData(
        textColor: onSurfaceDark,
        iconColor: darkPrimary,
      ),
    );
  }

  static Color get highlightYellow => _highlightYellow;
}
