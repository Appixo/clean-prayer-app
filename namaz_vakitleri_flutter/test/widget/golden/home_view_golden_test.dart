import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/theme/app_theme.dart';

/// Tier 2: Visual regression. Goldens assert 32px card corners (from AppTheme
/// CardThemeData) and Lucide icons. Run `flutter test test/widget/golden/ --update-goldens`
/// once to generate, then `flutter test test/widget/golden/` for regression.
/// Visual review when updating goldens: confirm 32px radius and Lucide icons.
void main() {
  testWidgets('Level 1 (Sade) view matches golden', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          key: const Key('home_basit'),
          backgroundColor: AppTheme.light.scaffoldBackgroundColor,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SABAH VAKTINE KALAN SÜRE',
                            style: AppTheme.light.textTheme.titleSmall?.copyWith(
                              color: AppTheme.light.colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '00:42:15',
                            style: AppTheme.light.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                          const Divider(height: 24),
                          _prayerRow('Sabah', '03:28', LucideIcons.sun),
                          _prayerRow('GÜNEŞ', '05:30', LucideIcons.sun),
                          _prayerRow('Öğle', '13:00', null),
                          _prayerRow('İkindi', '16:45', null),
                          _prayerRow('Akşam', '20:32', null),
                          _prayerRow('Yatsı', '22:15', null),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    await expectLater(
      find.byKey(const Key('home_basit')),
      matchesGoldenFile('home_basit.golden.png'),
    );
  });

  testWidgets('Level 3 (Tam Mod) view matches golden', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          key: const Key('home_gelismis'),
          backgroundColor: AppTheme.light.scaffoldBackgroundColor,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Text(
                        'UTRECHT',
                        style: AppTheme.light.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.light.colorScheme.primary,
                        ),
                      ),
                      const Icon(LucideIcons.chevronDown, size: 20),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(LucideIcons.share2),
                        onPressed: () {},
                      ),
                    ],
                  ),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(LucideIcons.chevronLeft),
                            onPressed: () {},
                          ),
                          Expanded(
                            child: Column(
                              children: [
                                Text(
                                  '15 Haziran 2025 Cumartesi',
                                  style: AppTheme.light.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                Text(
                                  '8 Zilhicce 1446',
                                  style: AppTheme.light.textTheme.bodySmall,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(LucideIcons.chevronRight),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SABAH VAKTINE KALAN SÜRE',
                            style: AppTheme.light.textTheme.titleSmall?.copyWith(
                              color: AppTheme.light.colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '00:42:15',
                            style: AppTheme.light.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Divider(height: 24),
                          _prayerRow('Sabah', '03:28', LucideIcons.sun),
                          _prayerRow('Öğle', '13:00', null),
                          _prayerRow('Akşam', '20:32', null),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Günün Ayeti',
                                style: AppTheme.light.textTheme.titleSmall?.copyWith(
                                  color: AppTheme.light.colorScheme.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(LucideIcons.share2),
                                onPressed: () {},
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '"Hakkı bâtılla karıştırıp..."',
                            style: AppTheme.light.textTheme.bodyMedium?.copyWith(
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    await expectLater(
      find.byKey(const Key('home_gelismis')),
      matchesGoldenFile('home_gelismis.golden.png'),
    );
  });
}

Widget _prayerRow(String name, String time, IconData? icon) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20, color: AppTheme.light.colorScheme.primary),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            name,
            style: AppTheme.light.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          time,
          style: AppTheme.light.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
      ],
    ),
  );
}
