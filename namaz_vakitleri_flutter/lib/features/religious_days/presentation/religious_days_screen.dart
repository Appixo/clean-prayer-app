import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/religious_days_data.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/religious_days_explanations_data.dart';
import '../../../../domain/entities/religious_day.dart';

/// Dini Günler tab: list of religious days (Diyanet) with detail bottom sheet.
///
/// User intent & UX goals:
/// - Users visit this tab to see **upcoming Islamic religious days** and understand
///   **what they are and when they occur**.
/// - Primary question to answer quickly: "What's the next important religious day?"
/// - Secondary goal: tap into a day to learn its **meaning and significance** without
///   overwhelming the list.
/// - Tone: **calm, respectful, informative** (not festive, not promotional).
/// - Used occasionally (not multiple times per day like Home), so clarity > density.
class ReligiousDaysScreen extends StatelessWidget {
  const ReligiousDaysScreen({super.key});

  static DateTime _parseDate(String dateStr) {
    final parts = dateStr.split('-');
    return DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final allDays = getAllReligiousDaysSorted();
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    final days = allDays
        .where((day) {
          final eventDate = _parseDate(day.date);
          return !eventDate.isBefore(todayDate);
        })
        .toList();

    // Group by month (year-month key) for section headers
    final monthFormat = DateFormat.yMMMM('tr');
    final grouped = <int, List<ReligiousDay>>{};
    for (final day in days) {
      final date = _parseDate(day.date);
      final key = date.year * 100 + date.month;
      grouped.putIfAbsent(key, () => []).add(day);
    }
    final sortedKeys = grouped.keys.toList()..sort();
    final dateFormatFull = DateFormat.yMMMMEEEEd('tr');
    final dateFormatBadge = DateFormat('d MMM', 'tr');

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        minimum: EdgeInsets.only(top: 24),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Dini Günler',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Diyanet İşleri Başkanlığı dini günler takvimi',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                    ),
                  ],
                ),
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  int i = 0;
                  for (final key in sortedKeys) {
                    final monthDays = grouped[key]!;
                    final firstDate = _parseDate(monthDays.first.date);
                    final monthLabel = monthFormat.format(firstDate);
                    if (index == i) {
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                        child: Text(
                          monthLabel,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      );
                    }
                    i += 1;
                    for (final day in monthDays) {
                      if (index == i) {
                        final date = _parseDate(day.date);
                        final fullDateStr = dateFormatFull.format(date);
                        final badgeStr =
                            '${date.day} ${dateFormatBadge.format(date).split(' ').last.toUpperCase()}';
                        return _ReligiousDayTile(
                          badge: badgeStr,
                          name: day.name,
                          fullDate: fullDateStr,
                          onTap: () => _showDetailSheet(context, day),
                        );
                      }
                      i += 1;
                    }
                  }
                  return null;
                },
                childCount: sortedKeys.fold<int>(
                  0,
                  (sum, key) => sum + 1 + grouped[key]!.length,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(height: 24 + MediaQuery.of(context).viewPadding.bottom),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetailSheet(BuildContext context, ReligiousDay day) {
    final explanation = getReligiousDayExplanation(day.name);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        top: false,
        child: DraggableScrollableSheet(
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) => SingleChildScrollView(
            controller: scrollController,
            padding: EdgeInsets.fromLTRB(
              24,
              16,
              24,
              40 + MediaQuery.of(context).viewPadding.bottom,
            ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                day.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                DateFormat.yMMMMEEEEd('tr').format(_parseDate(day.date)),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              if (explanation != null) ...[
                const SizedBox(height: 16),
                Text(
                  explanation.description,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  'Önemi',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  explanation.significance,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ],
          ),
        ),
        ),
      ),
    );
  }
}

class _ReligiousDayTile extends StatelessWidget {
  const _ReligiousDayTile({
    required this.badge,
    required this.name,
    required this.fullDate,
    required this.onTap,
  });

  final String badge;
  final String name;
  final String fullDate;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.surfaceContainerHighest,
            theme.colorScheme.surfaceContainerHighest.withOpacity(0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(AppConstants.cardRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppConstants.cardRadius),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: AppConstants.cardPaddingHorizontal,
              vertical: 12,
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badge,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        fullDate,
                        style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  LucideIcons.chevronRight,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
