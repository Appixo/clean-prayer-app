import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/widgets/error_placeholder.dart';
import 'package:namaz_vakitleri_flutter/core/widgets/loading_indicator.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/date_selector_card.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/prayer_time_card.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/widgets/verse_of_day_card.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart' show ViewMode, TimeFormat;
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';
import 'package:share_plus/share_plus.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  /// Which prayer row to highlight. Matches the countdown: we highlight the *next* prayer
  /// so the user sees at a glance what the countdown is for. [nextPrayerDate] is that day.
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
                      onDateChanged: (d) {
                        context
                            .read<PrayerTimesBloc>()
                            .add(PrayerTimesDateChanged(d));
                      },
                      onShare: () => _sharePrayerTimes(
                        context,
                        prayerState.city,
                        prayerState.date,
                        prayerState.prayerTimes,
                        timeFormat,
                      ),
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

  static Future<void> _sharePrayerTimes(
    BuildContext context,
    String city,
    DateTime date,
    PrayerTimesEntity pt,
    TimeFormat timeFormatSetting,
  ) async {
    final formatter = DateFormat.yMMMMEEEEd('tr');
    final timeFormat = timeFormatSetting == TimeFormat.hour24
        ? DateFormat.Hm()
        : DateFormat('h:mm a', 'tr');
    final dateStr = formatter.format(date);
    final buffer = StringBuffer();
    buffer.writeln('Namaz Vakitleri - $dateStr');
    buffer.writeln();
    buffer.writeln('📍 $city');
    buffer.writeln();
    final isFriday = date.weekday == DateTime.friday;
    buffer.writeln('Sabah: ${timeFormat.format(pt.fajr)}');
    buffer.writeln('Güneş: ${timeFormat.format(pt.sunrise)}');
    buffer.writeln('${isFriday ? "Cuma" : "Öğle"}: ${timeFormat.format(pt.dhuhr)}');
    buffer.writeln('İkindi: ${timeFormat.format(pt.asr)}');
    buffer.writeln('Akşam: ${timeFormat.format(pt.maghrib)}');
    buffer.writeln('Yatsı: ${timeFormat.format(pt.isha)}');
    buffer.writeln();
    buffer.writeln('Namaz Vakitleri Uygulaması');
    await Share.share(buffer.toString());
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
    required this.onDateChanged,
    required this.onShare,
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
  final ValueChanged<DateTime> onDateChanged;
  final VoidCallback onShare;
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
    final height = MediaQuery.of(context).size.height;
    // iPhone SE = 667pt; use smallest screen as standard so everything fits there first.
    final isCompact = height < 700;
    final isVerySmall = height < 670;
    final hasCountry = (country ?? '').isNotEmpty;
    final locationLabel = city.isNotEmpty ? city.toUpperCase() : 'KONUM SEÇİN';
    final bottomPad =
        (isVerySmall ? 12 : isCompact ? 16 : 24) + MediaQuery.of(context).viewPadding.bottom;
    final topPad = isVerySmall ? 4.0 : (isCompact ? 6.0 : 8.0);

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: _buildSingleScroll(
        context,
        theme,
        topPad,
        bottomPad,
        isBasit,
        dateKey,
        date,
        activePrayer,
        countdownPrayerName,
        countdownTimeUntilMs,
        prayerTimes,
        onRefresh,
        onDateChanged,
        onShare,
        onLocationTap,
        locationLabel,
        hasCountry,
        country,
        viewMode,
        timeFormat,
        isCompact,
        isVerySmall,
      ),
    );
  }

  /// Basit view: single scroll with all content.
  Widget _buildSingleScroll(
    BuildContext context,
    ThemeData theme,
    double topPad,
    double bottomPad,
    bool isBasit,
    String dateKey,
    DateTime date,
    PrayerName? activePrayer,
    String? countdownPrayerName,
    int? countdownTimeUntilMs,
    PrayerTimesEntity prayerTimes,
    VoidCallback onRefresh,
    ValueChanged<DateTime> onDateChanged,
    VoidCallback onShare,
    VoidCallback onLocationTap,
    String locationLabel,
    bool hasCountry,
    String? country,
    ViewMode viewMode,
    TimeFormat timeFormat,
    bool isCompact,
    bool isVerySmall,
  ) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, topPad, 16, bottomPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!isBasit)
            Padding(
              padding: EdgeInsets.only(bottom: isVerySmall ? 2 : (isCompact ? 4 : 8)),
              child: Row(
                children: [
                    Expanded(
                      child: InkWell(
                        onTap: onLocationTap,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: isVerySmall ? 6 : (isCompact ? 8 : 10),
                            vertical: isVerySmall ? 4 : (isCompact ? 6 : 8),
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
                                              : isCompact
                                                  ? theme.textTheme.titleSmall
                                                  : theme.textTheme.titleMedium)
                                          ?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1.2,
                                        color: theme.colorScheme.primary,
                                        shadows: [
                                          Shadow(
                                            color: Colors.black.withOpacity(0.2),
                                            blurRadius: 4,
                                            offset: const Offset(0, 1),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (hasCountry)
                                      Text(
                                        country!,
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: theme.colorScheme.onSurfaceVariant,
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
                    icon: const Icon(LucideIcons.share2, size: 20),
                    onPressed: onShare,
                    color: theme.colorScheme.primary,
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
              SizedBox(height: isVerySmall ? 6 : (isCompact ? 8 : 12)),
            ],
            // 3. Prayer times card (with countdown at top)
            Container(
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
                padding: EdgeInsets.symmetric(
                  horizontal: isVerySmall ? 6 : (isCompact ? 8 : AppConstants.cardPaddingHorizontal),
                  vertical: isVerySmall ? 6 : (isCompact ? 10 : 28),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!isBasit &&
                        countdownPrayerName != null &&
                        countdownTimeUntilMs != null) ...[
                      Container(
                        height: isVerySmall ? 80 : (isCompact ? 100 : 140),
                        margin: EdgeInsets.symmetric(
                          horizontal: isVerySmall ? 0 : (isCompact ? 4 : 8),
                          vertical: isVerySmall ? 0 : 4,
                        ),
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
                          border: Border.all(
                            color: theme.colorScheme.onSurface.withOpacity(0.06),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: CountdownText(
                            initialTimeUntilMs: countdownTimeUntilMs,
                            onReachedZero: onRefresh,
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                              fontSize: isVerySmall ? 40 : (isCompact ? 48 : 52),
                              fontFeatures: [FontFeature.tabularFigures()],
                              letterSpacing: 2,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 1,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: isVerySmall ? 4 : (isCompact ? 12 : 28)),
                      SizedBox(height: isVerySmall ? 4 : (isCompact ? 8 : 12)),
                    ],
                    // Prayer rows
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
            ),
            // 5. Günün Ayeti - below fold, scroll to see (shown on all screen sizes)
            if (!isBasit) ...[
              const SizedBox(height: 24),
              const VerseOfDayCard(),
            ],
          ],
        ),
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
