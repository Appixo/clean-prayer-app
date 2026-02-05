import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/core/routes/onboarding_notifier.dart';
import 'package:namaz_vakitleri_flutter/data/services/adhan_playback_service.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/location_repository.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isPreviewPlaying = false;

  static String _randomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return List.generate(7, (_) => chars[Random().nextInt(chars.length)]).join();
  }

  Future<void> _playPreview() async {
    if (_isPreviewPlaying) {
      await AdhanPlaybackService.instance.stop();
      if (mounted) setState(() => _isPreviewPlaying = false);
      return;
    }
    setState(() => _isPreviewPlaying = true);
    await AdhanPlaybackService.instance.play(
      assetPath: 'assets/audio/adhan_fajr.mp3',
      prayerName: 'Ezan',
    );
    await Future<void>.delayed(const Duration(seconds: 30));
    if (mounted) setState(() => _isPreviewPlaying = false);
  }

  void _selectSearchResult(BuildContext sheetContext, SearchResult r) {
    final id = _randomId();
    final loc = SavedLocation(
      id: id,
      city: r.city,
      country: r.country ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
    );
    context.read<LocationBloc>()
      ..add(SavedLocationAdded(loc))
      ..add(LocationSelected(id));
    Navigator.of(sheetContext).pop();
  }

  Future<void> _resetApp() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Uygulamayı Sıfırla'),
        content: const Text(
          'Tüm veriler silinecek ve uygulama fabrika ayarlarına dönecek. Emin misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Sıfırla'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    await getIt<SharedPreferences>().clear();
    context.read<LocationBloc>().add(const LocationReloadFromRepoRequested());
    context.read<SettingsBloc>().add(const SettingsLoadRequested());
    context.read<NotificationsBloc>().add(const NotificationsLoadRequested());
    OnboardingNotifierScope.of(context)?.setCompleted(false);
    if (mounted) context.go('/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Ayarlar'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: BlocBuilder<SettingsBloc, SettingsState>(
        builder: (context, state) {
          final settings = state.settings;
          if (settings == null) {
            return const Center(child: CircularProgressIndicator());
          }
          return BlocBuilder<LocationBloc, LocationState>(
            builder: (context, locationState) {
              return BlocBuilder<NotificationsBloc, NotificationsState>(
                builder: (context, notifState) {
                  return _SettingsBody(
                    settings: settings,
                    locationState: locationState,
                    notifState: notifState,
                    isPreviewPlaying: _isPreviewPlaying,
                    onPlayPreview: _playPreview,
                    onShowLocations: () => _showLocationsSheet(context, locationState),
                    onAddLocation: () => _showCitySearchSheet(context),
                    onManageLocations: () => _showLocationsSheet(context, locationState),
                    onResetApp: _resetApp,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  void _showCitySearchSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _CitySearchSheetContent(
        onSelect: (r) => _selectSearchResult(ctx, r),
      ),
    );
  }

  void _showLocationsSheet(BuildContext context, LocationState locationState) {
    final saved = locationState.savedLocations;
    final selectedId = locationState.selectedLocationId;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Konumlarım',
                    style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Theme.of(ctx).colorScheme.primary,
                        ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    icon: const Icon(LucideIcons.x),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Kayıtlı şehirleriniz arasında geçiş yapın veya silin.',
                style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                      color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 16),
              ...saved.map((loc) {
                final isSelected = selectedId == loc.id;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isSelected
                          ? Theme.of(ctx).colorScheme.primary
                          : Theme.of(ctx).colorScheme.surfaceContainerHighest,
                      child: Icon(
                        LucideIcons.mapPin,
                        color: isSelected
                            ? Theme.of(ctx).colorScheme.onPrimary
                            : Theme.of(ctx).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    title: Text(
                      loc.city,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? Theme.of(ctx).colorScheme.primary
                            : Theme.of(ctx).colorScheme.onSurface,
                      ),
                    ),
                    subtitle: loc.country.isNotEmpty ? Text(loc.country) : null,
                    trailing: isSelected
                        ? Icon(LucideIcons.check, color: Theme.of(ctx).colorScheme.primary)
                        : IconButton(
                            icon: Icon(LucideIcons.trash2, color: Theme.of(ctx).colorScheme.error),
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: ctx,
                                builder: (c) => AlertDialog(
                                  title: const Text('Konumu Sil'),
                                  content: const Text('Bu konumu silmek istediğinize emin misiniz?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(c).pop(false),
                                      child: const Text('İptal'),
                                    ),
                                    FilledButton(
                                      onPressed: () => Navigator.of(c).pop(true),
                                      style: FilledButton.styleFrom(
                                        backgroundColor: Theme.of(c).colorScheme.error,
                                      ),
                                      child: const Text('Sil'),
                                    ),
                                  ],
                                ),
                              );
                              if (confirm == true && ctx.mounted) {
                                context.read<LocationBloc>().add(SavedLocationRemoved(loc.id));
                                Navigator.of(ctx).pop();
                              }
                            },
                          ),
                    onTap: () {
                      context.read<LocationBloc>().add(LocationSelected(loc.id));
                      Navigator.of(ctx).pop();
                    },
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsBody extends StatelessWidget {
  const _SettingsBody({
    required this.settings,
    required this.locationState,
    required this.notifState,
    required this.isPreviewPlaying,
    required this.onPlayPreview,
    required this.onShowLocations,
    required this.onAddLocation,
    required this.onManageLocations,
    required this.onResetApp,
  });

  final AppSettings settings;
  final LocationState locationState;
  final NotificationsState notifState;
  final bool isPreviewPlaying;
  final VoidCallback onPlayPreview;
  final VoidCallback onShowLocations;
  final VoidCallback onAddLocation;
  final VoidCallback onManageLocations;
  final VoidCallback onResetApp;

  /// Set to true to show Zikirmatik, Kaza Takibi, İstatistikler in settings.
  static const bool _showExtraFeatures = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Only standard view is used; basit/gelismis are not offered.
    final isBasit = false;
    final city = locationState.city;
    final saved = locationState.savedLocations;
    final playAdhan = notifState.playAdhan;
    final prayerNotifs = notifState.prayerNotifications;

    return ListView(
      padding: EdgeInsets.fromLTRB(
        16,
        8,
        16,
        24 + MediaQuery.of(context).viewPadding.bottom,
      ),
      children: [
        _SectionHeader(icon: LucideIcons.mapPin, title: 'Konumlarım'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Mevcut Konum',
                  style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        city.isEmpty ? 'Konum Seçilmedi' : city,
                        style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: theme.colorScheme.primary,
                            ),
                      ),
                    ),
                    if (saved.length > 1)
                      TextButton(
                        onPressed: onShowLocations,
                        child: const Text('Değiştir'),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: onAddLocation,
                  child: const Text('Yeni Konum Ekle'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                if (saved.isNotEmpty && !isBasit) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: onManageLocations,
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text('Kaydedilen Konumları Yönet (${saved.length})'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        if (!isBasit) ...[
          const SizedBox(height: 24),
          _SectionHeader(icon: LucideIcons.slidersHorizontal, title: 'Hesaplama'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Hesaplama Yöntemi',
                    style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Diyanet İşleri Başkanlığı',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    'Türkiye için varsayılan yöntemdir.',
                    style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'İkindi Vakti (Asr)',
                    style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  _SegmentedRow<AsrMethod>(
                    value: settings.calculationParams.asrMethod,
                    options: [AsrMethod.standard, AsrMethod.hanafi],
                    labels: const ['Standart', 'Hanefi'],
                    onChanged: (v) => context.read<SettingsBloc>().add(AsrMethodChanged(v)),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
        _SectionHeader(icon: LucideIcons.volume2, title: 'Bildirimler'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ezan Sesi',
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Vakitlerde ezan okunsun.',
                            style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: playAdhan,
                      onChanged: (v) {
                        context.read<NotificationsBloc>().add(PlayAdhanChanged(v));
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton.tonal(
                  onPressed: onPlayPreview,
                  style: FilledButton.styleFrom(
                    backgroundColor: isPreviewPlaying
                        ? theme.colorScheme.errorContainer
                        : theme.colorScheme.primaryContainer,
                    foregroundColor: isPreviewPlaying
                        ? theme.colorScheme.onErrorContainer
                        : theme.colorScheme.onPrimaryContainer,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(isPreviewPlaying ? LucideIcons.square : LucideIcons.play),
                      const SizedBox(width: 8),
                      Text(isPreviewPlaying ? 'Durdur' : 'Ezan Sesi Dinle'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (!isBasit) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Vakit Bildirimleri',
                    style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ..._prayerToggles(context, prayerNotifs),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
        _SectionHeader(icon: LucideIcons.palette, title: 'Görünüm'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Tema',
                  style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                _SegmentedRow<AppTheme>(
                  value: settings.theme,
                  options: [AppTheme.system, AppTheme.light, AppTheme.dark],
                  labels: const ['Oto', 'Açık', 'Koyu'],
                  onChanged: (v) => context.read<SettingsBloc>().add(ThemeChanged(v)),
                ),
              ],
            ),
          ),
        ),
        // View mode selector removed: only standard view is used.
        // _SectionHeader(icon: LucideIcons.layoutDashboard, title: 'Görünüm Modu') + Card with Basit/Standart/Gelişmiş
        if (_showExtraFeatures) ...[
          const SizedBox(height: 24),
          _SectionHeader(icon: LucideIcons.layoutGrid, title: 'Ekstra Özellikler'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: Icon(LucideIcons.circleDot, color: theme.colorScheme.primary),
                  title: const Text('Zikirmatik'),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () => context.push('/zikirmatik'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(LucideIcons.calendar, color: theme.colorScheme.primary),
                  title: const Text('Kaza Takibi'),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () => context.push('/kaza'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(LucideIcons.barChart3, color: theme.colorScheme.primary),
                  title: const Text('İstatistikler'),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () => context.push('/statistics'),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        _SectionHeader(icon: LucideIcons.info, title: 'Bilgi'),
        Card(
          child: ListTile(
            title: const Text('Hakkında'),
            trailing: const Icon(LucideIcons.chevronRight),
            onTap: () => context.push('/about'),
          ),
        ),
        const SizedBox(height: 24),
        _SectionHeader(icon: LucideIcons.alertTriangle, title: 'Tehlikeli İşlemler'),
        Card(
          color: theme.colorScheme.errorContainer.withValues(alpha: 0.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppConstants.cardRadius),
            side: BorderSide(color: theme.colorScheme.error.withValues(alpha: 0.4)),
          ),
          child: ListTile(
            leading: Icon(LucideIcons.trash2, color: theme.colorScheme.error),
            title: Text(
              'Uygulamayı Sıfırla',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.error,
              ),
            ),
            subtitle: const Text('Bu işlem geri alınamaz.'),
            trailing: Icon(LucideIcons.chevronRight, color: theme.colorScheme.error),
            onTap: onResetApp,
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (theme.brightness == Brightness.light)
                Image.asset(
                  'assets/images/logo-default.png',
                  height: 28,
                  width: 28,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              if (theme.brightness == Brightness.light) const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(const ClipboardData(text: '1.0.0'));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Versiyon kopyalandı')),
                    );
                  }
                },
                child: Text(
                  'Namaz Vakitleri v1.0.0',
                  style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _prayerToggles(BuildContext context, Map<PrayerName, bool> map) {
    const prayers = [
      (PrayerName.fajr, 'Sabah'),
      (PrayerName.dhuhr, 'Öğle'),
      (PrayerName.asr, 'İkindi'),
      (PrayerName.maghrib, 'Akşam'),
      (PrayerName.isha, 'Yatsı'),
    ];
    return prayers
        .map((e) => Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(e.$2, style: Theme.of(context).textTheme.bodyMedium),
                Switch(
                  value: map[e.$1] ?? false,
                  onChanged: (v) {
                    context.read<NotificationsBloc>().add(
                          PrayerNotificationToggled(e.$1, v),
                        );
                  },
                ),
              ],
            ))
        .toList();
  }

  // _viewModeDesc removed with view mode selector
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: Theme.of(context).colorScheme.primary,
                ),
          ),
        ],
      ),
    );
  }
}

class _SegmentedRow<T> extends StatelessWidget {
  const _SegmentedRow({
    required this.value,
    required this.options,
    required this.labels,
    required this.onChanged,
  });

  final T value;
  final List<T> options;
  final List<String> labels;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final trackColor = theme.colorScheme.surfaceContainerHighest;
    final selectedBg = theme.colorScheme.surface;
    final selectedFg = theme.colorScheme.primary;
    final unselectedFg = theme.colorScheme.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: trackColor,
        borderRadius: BorderRadius.circular(AppConstants.cardRadius),
      ),
      child: Row(
        children: List.generate(options.length, (i) {
          final opt = options[i];
          final label = labels[i];
          final selected = value == opt;
          return Expanded(
            child: Material(
              color: selected ? selectedBg : Colors.transparent,
              borderRadius: BorderRadius.circular(AppConstants.cardRadius - 4),
              child: InkWell(
                onTap: () => onChanged(opt),
                borderRadius: BorderRadius.circular(AppConstants.cardRadius - 4),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Center(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: selected ? selectedFg : unselectedFg,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _CitySearchSheetContent extends StatefulWidget {
  const _CitySearchSheetContent({required this.onSelect});

  final void Function(SearchResult r) onSelect;

  @override
  State<_CitySearchSheetContent> createState() => _CitySearchSheetContentState();
}

class _CitySearchSheetContentState extends State<_CitySearchSheetContent> {
  String _query = '';
  bool _searching = false;
  List<SearchResult> _results = [];
  String? _error;

  Future<void> _search() async {
    if (_query.trim().length < 2) return;
    setState(() {
      _searching = true;
      _error = null;
    });
    try {
      final results = await getIt<LocationRepository>().searchCities(_query, language: 'tr');
      if (mounted) {
        setState(() {
          _results = results;
          _searching = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Bağlantı kurulamadı.';
          _searching = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Şehir Seçin',
                  style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: theme.colorScheme.primary,
                      ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(LucideIcons.x),
                ),
              ],
            ),
            const SizedBox(height: 16),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Şehir veya ilçe ara...',
                        border: const OutlineInputBorder(),
                        prefixIcon: const Icon(LucideIcons.search),
                        suffixIcon: _searching
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              )
                            : null,
                      ),
                      onChanged: (v) => setState(() => _query = v),
                      onSubmitted: (_) => _search(),
                      textInputAction: TextInputAction.search,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _query.trim().length >= 2 && !_searching ? _search : null,
                    child: const Text('Ara'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
            const SizedBox(height: 16),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _results.length,
                itemBuilder: (context, i) {
                  final r = _results[i];
                  return ListTile(
                    leading: Icon(LucideIcons.mapPin, color: theme.colorScheme.primary),
                    title: Text(r.city),
                    subtitle: r.country != null ? Text(r.country!) : null,
                    onTap: () => widget.onSelect(r),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
