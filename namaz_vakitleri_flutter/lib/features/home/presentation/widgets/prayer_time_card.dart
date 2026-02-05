import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart' show ViewMode, TimeFormat;
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_log_repository.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_log/prayer_log.dart';

/// Prayer row: Turkish name (semibold), time; checkbox (prayer log, only in Gelişmiş); optional highlight. Notifications managed in Settings.
class PrayerTimeCard extends StatelessWidget {
  const PrayerTimeCard({
    super.key,
    required this.prayer,
    required this.time,
    required this.dateKey,
    this.isHighlighted = false,
    this.isSunrise = false,
    this.viewMode = ViewMode.standart,
    this.timeFormat = TimeFormat.hour24,
    this.isCompact = false,
    this.isVerySmall = false,
  });

  final PrayerName prayer;
  final DateTime time;
  final String dateKey;
  final bool isHighlighted;
  final bool isSunrise;
  final ViewMode viewMode;
  final TimeFormat timeFormat;
  final bool isCompact;
  final bool isVerySmall;

  static String turkishName(PrayerName p, bool isFriday) {
    switch (p) {
      case PrayerName.fajr:
        return 'Sabah';
      case PrayerName.sunrise:
        return 'Güneş';
      case PrayerName.dhuhr:
        return isFriday ? 'Cuma' : 'Öğle';
      case PrayerName.asr:
        return 'İkindi';
      case PrayerName.maghrib:
        return 'Akşam';
      case PrayerName.isha:
        return 'Yatsı';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isFriday = time.weekday == DateTime.friday;
    final name = turkishName(prayer, isFriday);
    final timeStr = timeFormat == TimeFormat.hour24
        ? DateFormat.Hm().format(time)
        : DateFormat('h:mm a', 'tr').format(time);
    final bgColor = theme.colorScheme.surfaceContainerHighest;
    final showCheckbox = viewMode == ViewMode.gelismis;
    return BlocBuilder<PrayerLogBloc, PrayerLogState>(
      buildWhen: (_, __) => true,
      builder: (context, _) {
        final performedNow = getIt<PrayerLogRepository>().isPrayerPerformed(dateKey, prayer.key);
        final isCompleted = performedNow && !isSunrise;
        final showCompletedStyle = isCompleted && !isHighlighted;
        final completedTextColor = theme.colorScheme.onSurfaceVariant;
        final nameStyle = isVerySmall
            ? theme.textTheme.labelLarge
            : (isCompact ? theme.textTheme.titleSmall : theme.textTheme.titleMedium);
        final timeStyle = isVerySmall
            ? theme.textTheme.labelLarge
            : (isCompact ? theme.textTheme.titleSmall : theme.textTheme.titleMedium);
        final decoration = isHighlighted
            ? BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(AppConstants.cardRadius),
                border: Border(
                  left: BorderSide(
                    color: theme.colorScheme.primary,
                    width: 4,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              )
            : BoxDecoration(
                color: showCompletedStyle
                    ? theme.colorScheme.surfaceContainerHigh
                    : bgColor,
                borderRadius: BorderRadius.circular(AppConstants.cardRadius),
              );

        return Container(
          margin: EdgeInsets.symmetric(vertical: isVerySmall ? 1 : (isCompact ? 3 : 5)),
          padding: EdgeInsets.symmetric(
            horizontal: isVerySmall ? 8 : (isCompact ? 10 : 12),
            vertical: isVerySmall ? 6 : (isCompact ? 9 : 14),
          ),
          decoration: decoration,
          child: Row(
            children: [
              if (!isSunrise && showCheckbox)
                Checkbox(
                  value: performedNow,
                  onChanged: (v) {
                    context.read<PrayerLogBloc>().add(
                          PrayerPerformedToggled(
                            dateKey,
                            prayer.key,
                            v ?? false,
                          ),
                        );
                  },
                ),
              if (isSunrise && showCheckbox) const SizedBox(width: 48),
              if (showCompletedStyle && !showCheckbox)
                Icon(
                  LucideIcons.check,
                  size: isVerySmall ? 14 : 16,
                  color: theme.colorScheme.primary,
                ),
              if (showCompletedStyle && !showCheckbox)
                SizedBox(width: isVerySmall ? 4 : 6),
              Expanded(
                child: Text(
                  name,
                  style: nameStyle?.copyWith(
                    fontWeight: isHighlighted ? FontWeight.w700 : FontWeight.w600,
                    letterSpacing: 0.3,
                    height: 1.2,
                    color: isHighlighted
                        ? theme.colorScheme.onSurface
                        : (showCompletedStyle ? completedTextColor : null),
                    decoration:
                        showCompletedStyle ? TextDecoration.lineThrough : TextDecoration.none,
                    decorationColor: completedTextColor,
                  ),
                ),
              ),
              Text(
                timeStr,
                style: timeStyle?.copyWith(
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.0,
                  color: showCompletedStyle
                      ? completedTextColor
                      : (isHighlighted ? theme.colorScheme.onSurface : null),
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
