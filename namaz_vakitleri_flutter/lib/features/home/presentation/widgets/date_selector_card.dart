import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/utils/hijri_date.dart';

/// Date card: prev/next arrows, Gregorian + Hijri. Tap date to reset to today.
class DateSelectorCard extends StatelessWidget {
  const DateSelectorCard({
    super.key,
    required this.date,
    required this.onDateChanged,
    this.isCompact = false,
  });

  final DateTime date;
  final ValueChanged<DateTime> onDateChanged;
  final bool isCompact;

  static String _dateLabel(DateTime selected, DateTime today) {
    final selectedDay = DateTime(selected.year, selected.month, selected.day);
    final todayDay = DateTime(today.year, today.month, today.day);
    final diff = selectedDay.difference(todayDay).inDays;
    if (diff == 0) return 'BUGÜN';
    if (diff == 1) return 'YARIN';
    if (diff == -1) return 'DÜN';
    return DateFormat('d MMMM yyyy', 'tr').format(selected).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final isToday = _isSameDay(date, now);
    final gregorianStr = DateFormat.yMMMMEEEEd('tr').format(date);
    final hijriStr = formatHijriDate(date);
    final dateLabel = _dateLabel(date, now);

    final padding = isCompact
        ? const EdgeInsets.symmetric(horizontal: 8, vertical: 6)
        : EdgeInsets.symmetric(
            horizontal: AppConstants.cardPaddingHorizontal,
            vertical: AppConstants.cardPaddingVertical,
          );
    return Container(
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
      child: Padding(
        padding: padding,
        child: Row(
          children: [
            IconButton(
              icon: Icon(LucideIcons.chevronLeft, size: isCompact ? 20 : 24),
              onPressed: () {
                final prev = DateTime(date.year, date.month, date.day - 1);
                onDateChanged(prev);
              },
            ),
            Expanded(
              child: InkWell(
                onTap: () => onDateChanged(DateTime.now()),
                borderRadius: BorderRadius.circular(AppConstants.cardRadius),
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: isCompact ? 4 : 8),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          gregorianStr,
                          style: (isCompact
                                  ? theme.textTheme.labelLarge
                                  : theme.textTheme.titleSmall)
                              ?.copyWith(
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.onSurface,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                        ),
                      ),
                      if (hijriStr.isNotEmpty) ...[
                        SizedBox(height: isCompact ? 2 : 4),
                        Text(
                          hijriStr,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      SizedBox(height: isCompact ? 4 : 8),
                      Text(
                        dateLabel,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: isToday
                              ? theme.colorScheme.primary
                              : theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            IconButton(
              icon: Icon(LucideIcons.chevronRight, size: isCompact ? 20 : 24),
              onPressed: () {
                final next = DateTime(date.year, date.month, date.day + 1);
                onDateChanged(next);
              },
            ),
          ],
        ),
      ),
    );
  }

  static bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
