import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/widgets/error_placeholder.dart';
import 'package:namaz_vakitleri_flutter/core/widgets/loading_indicator.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/date_selector_card.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/prayer_time_card.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/verse_of_day_card.dart' show VerseOfDayTeaser;
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart' show ViewMode, TimeFormat;
import 'package:namaz_vakitleri_flutter/core/platform/notifications_platform.dart';
import 'package:namaz_vakitleri_flutter/data/services/adhan_playback_service.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  /// Which prayer row to highlight. Matches the countdown: we highlight the *next* prayer
  /// so the user sees at a glance what the countdown is for. [nextPrayerDate] is that day.
  /// Called when the countdown hits zero. Shows notification and plays adhan if enabled for that prayer.
  static void _onCountdownReachedZero(BuildContext context, PrayerName? prayer) {
    if (prayer == null) return;
    final notifState = context.read<NotificationsBloc>().state;
    if (notifState is! NotificationsStateLoaded) return;
    final enabled = notifState.prayerNotifications[prayer] ?? false;
    if (!enabled) return;

    final now = DateTime.now();
    final dateKey =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final title = _prayerNotificationTitle(prayer);
    final body = 'Namaz vakti girdi.';
    final playAdhan = notifState.playAdhan && prayer != PrayerName.sunrise;

    // When playing adhan, the foreground service shows its own notification ("X Adhan" + Durdur).
    // Skip the separate prayer-time notification to avoid showing two notifications for the same event.
    if (!playAdhan) {
      final id = 100 + prayer.index;
      showPrayerTimeNotification(
        id: id,
        title: title,
        body: body,
        dateKey: dateKey,
        prayerName: prayer.key,
      );
    }

    if (playAdhan) {
      final assetPath = prayer == PrayerName.fajr
          ? 'assets/audio/adhan_fajr.mp3'
          : 'assets/audio/adhan_fajr.mp3';
      AdhanPlaybackService.instance.play(
        assetPath: assetPath,
        prayerName: title,
      );
    }
  }

  static String _prayerNotificationTitle(PrayerName p) {
    switch (p) {
      case PrayerName.fajr:
        return 'İmsak';
      case PrayerName.sunrise:
        return 'Güneş';
      case PrayerName.dhuhr:
        return DateTime.now().weekday == DateTime.friday ? 'Cuma' : 'Öğle';
      case PrayerName.asr:
        return 'İkindi';
      case PrayerName.maghrib:
        return 'Akşam';
      case PrayerName.isha:
        return 'Yatsı';
    }
  }

  static PrayerName? getActivePrayer(
    PrayerTimesEntity pt,
    DateTime displayedDate,
    DateTime? nextPrayerDate,
  ) {
    if (nextPrayerDate == null) return null;
    final displayDay = DateTime(displayedDate.year, displayedDate.month, displayedDate.day);
    final nextDay = DateTime(nextPrayerDate.year, nextPrayerDate.month, nextPrayerDate.day);
    if (displayDay != nextDay) return null;

    final next = pt.nextPrayer;
    if (next == null) return null;
    if (next == PrayerName.fajr && pt.nextPrayerTime != null) {
      final nextTimeDay = DateTime(pt.nextPrayerTime!.year, pt.nextPrayerTime!.month, pt.nextPrayerTime!.day);
      if (nextTimeDay.isAfter(displayDay)) return null; // next prayer is tomorrow
    }
    return next; // highlight the next prayer (same as countdown)
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: BlocBuilder<LocationBloc, LocationState>(
        buildWhen: (prev, curr) =>
            prev.runtimeType != curr.runtimeType ||
            (curr is LocationStateLoaded &&
                prev is LocationStateLoaded &&
                curr.city != prev.city),
        builder: (context, locationState) {
          if (locationState is LocationStateLoading ||
              locationState is LocationStateInitial) {
            return const LoadingIndicator(message: 'Konum alınıyor...');
          }
          if (locationState is LocationStateNoLocation) {
            return ErrorPlaceholder(
              message: 'Konum belirlenemedi.',
              icon: LucideIcons.mapPinOff,
              actionLabel: 'Şehir Seç',
              actionIcon: LucideIcons.mapPin,
              onAction: () => _showLocationSheet(context),
            );
          }
          return BlocBuilder<PrayerTimesBloc, PrayerTimesState>(
            builder: (context, prayerState) {
              if (prayerState is! PrayerTimesStateLoaded) {
                return const LoadingIndicator(message: 'Konum alınıyor...');
              }
              return BlocBuilder<SettingsBloc, SettingsState>(
                builder: (context, settingsState) {
                  final settings = settingsState.settings;
                  final timeFormat = settings?.timeFormat ?? TimeFormat.hour24;
                  return _LoadedContent(
                      viewMode: ViewMode.standart,
                      timeFormat: timeFormat,
                      city: prayerState.city,
                      country: locationState is LocationStateLoaded
                          ? locationState.country
                          : null,
                      date: prayerState.date,
                      prayerTimes: prayerState.prayerTimes,
                      nextPrayerDate: prayerState.nextPrayerDate,
                      countdownTimeUntilMs: prayerState.countdownTimeUntilMs,
                      countdownNextPrayer: prayerState.countdownNextPrayer,
                      savedLocations: locationState.savedLocations,
                      onRefresh: () {
                        context
                            .read<PrayerTimesBloc>()
                            .add(const PrayerTimesRefreshRequested());
                      },
                      onCountdownReachedZero: (prayer) =>
                          _onCountdownReachedZero(context, prayer),
                      onDateChanged: (d) {
                        context
                            .read<PrayerTimesBloc>()
                            .add(PrayerTimesDateChanged(d));
                      },
                      onLocationTap: () => _showLocationSheet(context),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  static void _showLocationSheet(BuildContext context) {
    final locationState = context.read<LocationBloc>().state;
    final saved = locationState.savedLocations;
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Konumlarım',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(ctx).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 16),
                if (saved.isEmpty)
                  const Text('Kayıtlı konum yok. Ayarlardan ekleyin.')
                else
                  ...saved.map((loc) => ListTile(
                        leading: const Icon(LucideIcons.mapPin),
                        title: Text(loc.city),
                        subtitle:
                            loc.country.isNotEmpty ? Text(loc.country) : null,
                        onTap: () {
                          context.read<LocationBloc>().add(LocationSelected(loc.id));
                          Navigator.of(ctx).pop();
                        },
                      )),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _LoadedContent extends StatelessWidget {
  const _LoadedContent({
    required this.viewMode,
    required this.timeFormat,
    required this.city,
    this.country,
    required this.date,
    required this.prayerTimes,
    this.nextPrayerDate,
    this.countdownTimeUntilMs,
    this.countdownNextPrayer,
    required this.savedLocations,
    required this.onRefresh,
    this.onCountdownReachedZero,
    required this.onDateChanged,
    required this.onLocationTap,
  });

  final ViewMode viewMode;
  final TimeFormat timeFormat;
  final String city;
  final String? country;
  final DateTime date;
  final PrayerTimesEntity prayerTimes;
  /// Date (y/m/d) of the next prayer from now; only that day's list is highlighted.
  final DateTime? nextPrayerDate;
  /// Countdown to actual next prayer (from today's entity); shown on all dates so UI doesn't jump.
  final int? countdownTimeUntilMs;
  final PrayerName? countdownNextPrayer;
  final List<SavedLocation> savedLocations;
  final VoidCallback onRefresh;
  /// Called when countdown hits zero, with the prayer that was reached. Then [onRefresh] is called.
  final void Function(PrayerName?)? onCountdownReachedZero;
  final ValueChanged<DateTime> onDateChanged;
  final VoidCallback onLocationTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateKey =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    final activePrayer = HomeScreen.getActivePrayer(prayerTimes, date, nextPrayerDate);
    final isBasit = viewMode == ViewMode.basit;
    final countdownPrayerName = nextPrayerDate != null && countdownNextPrayer != null
        ? _countdownPrayerName(countdownNextPrayer!, nextPrayerDate!)
        : null;
    final media = MediaQuery.of(context);
    final size = media.size;
    final viewPadding = media.viewPadding;
    final textScale = media.textScaler.scale(1.0);
    final availableHeight = size.height -
        viewPadding.top -
        viewPadding.bottom -
        kBottomNavigationBarHeight;
    // Compact only on smaller height so S25 and similar get larger prayers; normal = bigger text and rows.
    final isCompact = availableHeight < 640 || textScale > 1.15;
    final isVerySmall = availableHeight < 560;
    // Grid fallback: guarantee all 6 prayers visible on very small / high text scale.
    final useGrid = availableHeight < 600 || textScale > 1.2;
    final hasCountry = (country ?? '').isNotEmpty;
    final locationLabel = city.isNotEmpty ? city.toUpperCase() : 'KONUM SEÇİN';
    // Shell body height already stops at bottom nav; small gap so teaser isn't flush.
    final bottomPad = 20.0;
    // Reduce header padding in compact so more space for prayers.
    final topPad = isVerySmall ? 0.0 : (isCompact ? 2.0 : 4.0);

    final horizontalPad = isCompact ? 12.0 : 16.0;
    // Body height in shell stops at bottom nav, so content stays above it; no page scroll.
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(horizontalPad, topPad, horizontalPad, bottomPad),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildAboveTheFold(
              context,
              theme,
              isBasit,
              dateKey,
              date,
              activePrayer,
              countdownPrayerName,
              countdownNextPrayer,
              countdownTimeUntilMs,
              prayerTimes,
              onRefresh,
              onCountdownReachedZero,
              onDateChanged,
              onLocationTap,
              locationLabel,
              hasCountry,
              country,
              viewMode,
              timeFormat,
              isCompact,
              isVerySmall,
              useGrid,
            ),
          ],
        ),
      ),
    );
  }

  /// Fixed content: location, date, countdown, 6 prayers. Must fit on 6.2" without scroll.
  Widget _buildAboveTheFold(
    BuildContext context,
    ThemeData theme,
    bool isBasit,
    String dateKey,
    DateTime date,
    PrayerName? activePrayer,
    String? countdownPrayerName,
    PrayerName? countdownNextPrayer,
    int? countdownTimeUntilMs,
    PrayerTimesEntity prayerTimes,
    VoidCallback onRefresh,
    void Function(PrayerName?)? onCountdownReachedZero,
    ValueChanged<DateTime> onDateChanged,
    VoidCallback onLocationTap,
    String locationLabel,
    bool hasCountry,
    String? country,
    ViewMode viewMode,
    TimeFormat timeFormat,
    bool isCompact,
    bool isVerySmall,
    bool useGrid,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
          if (!isBasit)
            Padding(
              padding: EdgeInsets.only(bottom: isVerySmall ? 2 : (isCompact ? 3 : 4)),
              child: Row(
                children: [
                    Expanded(
                      child: InkWell(
                        onTap: onLocationTap,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: isVerySmall ? 6 : (isCompact ? 8 : 10),
                            vertical: isVerySmall ? 2 : (isCompact ? 4 : 5),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                LucideIcons.mapPin,
                                size: isVerySmall ? 14 : (isCompact ? 16 : 18),
                                color: theme.colorScheme.primary,
                              ),
                              SizedBox(width: isVerySmall ? 4 : (isCompact ? 4 : 6)),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      locationLabel,
                                      style: (isVerySmall
                                              ? theme.textTheme.labelLarge
                                              : theme.textTheme.titleSmall)
                                          ?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 1.0,
                                        color: theme.colorScheme.primary,
                                      ),
                                    ),
                                    if (hasCountry)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 1),
                                        child: Text(
                                          country!,
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: theme.colorScheme.onSurfaceVariant,
                                            height: 1.2,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              SizedBox(width: isVerySmall ? 2 : (isCompact ? 2 : 4)),
                              Icon(
                                LucideIcons.chevronDown,
                                size: isVerySmall ? 14 : (isCompact ? 16 : 18),
                                color: theme.colorScheme.primary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  IconButton(
                    icon: const Icon(LucideIcons.bookOpen, size: 22),
                    onPressed: () => VerseOfDayTeaser.showVerseSheet(context),
                    color: theme.colorScheme.primary,
                    tooltip: 'Günün Ayeti',
                  ),
                ],
              ),
            ),
          // 2. Date first
            if (!isBasit) ...[
              DateSelectorCard(
                date: date,
                onDateChanged: onDateChanged,
                isCompact: isCompact,
              ),
              SizedBox(height: isVerySmall ? 4 : (isCompact ? 4 : 10)),
            ],
            // 3. Prayer times: countdown then list (larger rows on normal/S25)
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Countdown: 56–64 dp in compact
                if (!isBasit &&
                    countdownPrayerName != null &&
                    countdownTimeUntilMs != null)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        height: isVerySmall ? 56 : (isCompact ? 60 : 76),
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: theme.brightness == Brightness.dark
                              ? theme.colorScheme.surface.withValues(alpha: 0.55)
                              : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(AppConstants.cardRadius),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Center(
                          child: CountdownText(
                            initialTimeUntilMs: countdownTimeUntilMs,
                            onReachedZero: () {
                              onCountdownReachedZero?.call(countdownNextPrayer);
                              onRefresh();
                            },
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                              fontSize: isVerySmall ? 28 : (isCompact ? 32 : 42),
                              fontFeatures: [FontFeature.tabularFigures()],
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                // Prayer list: translucent (match date/countdown)
                Container(
                  decoration: BoxDecoration(
                    color: theme.brightness == Brightness.dark
                        ? theme.colorScheme.surface.withValues(alpha: 0.55)
                        : theme.colorScheme.surface.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(AppConstants.cardRadius),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: isVerySmall ? 6 : (isCompact ? 8 : AppConstants.cardPaddingHorizontal),
                          vertical: isVerySmall ? 2 : (isCompact ? 3 : 8),
                        ),
                        child: useGrid
                            ? _buildPrayerGrid(
                                dateKey: dateKey,
                                activePrayer: activePrayer,
                                prayerTimes: prayerTimes,
                                viewMode: viewMode,
                                timeFormat: timeFormat,
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  PrayerTimeCard(
                                    prayer: PrayerName.fajr,
                                    time: prayerTimes.fajr,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.fajr,
                                    isSunrise: false,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                  PrayerTimeCard(
                                    prayer: PrayerName.sunrise,
                                    time: prayerTimes.sunrise,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.sunrise,
                                    isSunrise: true,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                  PrayerTimeCard(
                                    prayer: PrayerName.dhuhr,
                                    time: prayerTimes.dhuhr,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.dhuhr,
                                    isSunrise: false,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                  PrayerTimeCard(
                                    prayer: PrayerName.asr,
                                    time: prayerTimes.asr,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.asr,
                                    isSunrise: false,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                  PrayerTimeCard(
                                    prayer: PrayerName.maghrib,
                                    time: prayerTimes.maghrib,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.maghrib,
                                    isSunrise: false,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                  PrayerTimeCard(
                                    prayer: PrayerName.isha,
                                    time: prayerTimes.isha,
                                    dateKey: dateKey,
                                    isHighlighted: activePrayer == PrayerName.isha,
                                    isSunrise: false,
                                    viewMode: viewMode,
                                    timeFormat: timeFormat,
                                    isCompact: isCompact,
                                    isVerySmall: isVerySmall,
                                  ),
                                ],
                              ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
      ],
    );
  }

  /// 2-column grid (3 rows) for very small height or large text scale; keeps all 6 prayers visible.
  Widget _buildPrayerGrid({
    required String dateKey,
    required PrayerName? activePrayer,
    required PrayerTimesEntity prayerTimes,
    required ViewMode viewMode,
    required TimeFormat timeFormat,
  }) {
    const crossAxisCount = 2;
    const mainAxisSpacing = 6.0;
    const crossAxisSpacing = 6.0;
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: crossAxisCount,
      mainAxisSpacing: mainAxisSpacing,
      crossAxisSpacing: crossAxisSpacing,
      childAspectRatio: 2.0,
      children: [
        PrayerTimeCard(
          prayer: PrayerName.fajr,
          time: prayerTimes.fajr,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.fajr,
          isSunrise: false,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
        PrayerTimeCard(
          prayer: PrayerName.sunrise,
          time: prayerTimes.sunrise,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.sunrise,
          isSunrise: true,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
        PrayerTimeCard(
          prayer: PrayerName.dhuhr,
          time: prayerTimes.dhuhr,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.dhuhr,
          isSunrise: false,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
        PrayerTimeCard(
          prayer: PrayerName.asr,
          time: prayerTimes.asr,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.asr,
          isSunrise: false,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
        PrayerTimeCard(
          prayer: PrayerName.maghrib,
          time: prayerTimes.maghrib,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.maghrib,
          isSunrise: false,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
        PrayerTimeCard(
          prayer: PrayerName.isha,
          time: prayerTimes.isha,
          dateKey: dateKey,
          isHighlighted: activePrayer == PrayerName.isha,
          isSunrise: false,
          viewMode: viewMode,
          timeFormat: timeFormat,
          isCompact: true,
          isVerySmall: true,
        ),
      ],
    );
  }

  // Kept for potential reuse (e.g. accessibility); hero uses _countdownPrayerName.
  // ignore: unused_element
  String? _countdownLabel(PrayerName? next) {
    if (next == null) return null;
    switch (next) {
      case PrayerName.fajr:
        return 'SABAH VAKTINE KALAN SÜRE';
      case PrayerName.sunrise:
        return 'GÜNEŞE KALAN SÜRE';
      case PrayerName.dhuhr:
        return 'ÖĞLE VAKTINE KALAN SÜRE';
      case PrayerName.asr:
        return 'İKİNDİ VAKTINE KALAN SÜRE';
      case PrayerName.maghrib:
        return 'AKŞAM VAKTINE KALAN SÜRE';
      case PrayerName.isha:
        return 'YATSI VAKTİNE KALAN SÜRE';
    }
  }

  /// Short Turkish name for next prayer (for hero countdown: "İkindi", "Öğle", etc.).
  String? _countdownPrayerName(PrayerName? next, DateTime date) {
    if (next == null) return null;
    final isFriday = date.weekday == DateTime.friday;
    switch (next) {
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
}

/// Text-only countdown HH:MM:SS (no circular progress).
class CountdownText extends StatefulWidget {
  const CountdownText({
    super.key,
    required this.initialTimeUntilMs,
    this.onReachedZero,
    this.style,
  });

  final int initialTimeUntilMs;
  final VoidCallback? onReachedZero;
  final TextStyle? style;

  @override
  State<CountdownText> createState() => _CountdownTextState();
}

class _CountdownTextState extends State<CountdownText> {
  late int _remainingMs;
  bool _running = false;

  @override
  void initState() {
    super.initState();
    _remainingMs = widget.initialTimeUntilMs;
    _startTimer();
  }

  @override
  void didUpdateWidget(CountdownText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialTimeUntilMs != widget.initialTimeUntilMs) {
      _remainingMs = widget.initialTimeUntilMs;
      _startTimer();
    }
  }

  void _startTimer() {
    if (_remainingMs <= 0) {
      widget.onReachedZero?.call();
      return;
    }
    if (_running) return;
    _running = true;
    Future<void> tick() async {
      while (_remainingMs > 0 && mounted) {
        await Future<void>.delayed(const Duration(seconds: 1));
        if (!mounted) return;
        setState(() {
          _remainingMs -= 1000;
          if (_remainingMs <= 0) {
            _remainingMs = 0;
            widget.onReachedZero?.call();
          }
        });
      }
      _running = false;
    }
    tick();
  }

  static String _format(int ms) {
    if (ms <= 0) return '00:00:00';
    final d = Duration(milliseconds: ms);
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultStyle = theme.textTheme.headlineSmall?.copyWith(
      fontWeight: FontWeight.bold,
      color: theme.colorScheme.primary,
      fontFeatures: [FontFeature.tabularFigures()],
    );
    return Text(
      _format(_remainingMs),
      style: widget.style ?? defaultStyle,
    );
  }
}
