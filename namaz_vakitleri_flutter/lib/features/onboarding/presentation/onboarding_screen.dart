import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';
import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/core/routes/onboarding_notifier.dart';
import 'package:namaz_vakitleri_flutter/core/routes/tab_index_cubit.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/saved_location.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/location_repository.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:permission_handler/permission_handler.dart';

/// Three-step onboarding: Location (auto-advance) → Prayer selection → Ezan. Progress at bottom.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;
  static const _totalSteps = 3;

  // Step 0: Location
  bool _loading = false;
  bool _showSearch = false;
  String _searchQuery = '';
  List<SearchResult> _searchResults = [];
  bool _searching = false;
  String? _errorMessage;

  // Step 1: Prayer selection (which prayers to notify)
  final Set<PrayerName> _selectedPrayers = {};

  // Step 2: Ezan
  bool _ezanEnabled = true;

  Future<void> _useGps() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final result = await getIt<LocationRepository>().getCurrentLocation();
      if (!mounted) return;
      if (result == null) {
        setState(() {
          _loading = false;
          _errorMessage = 'Konum alınamadı. Lütfen manuel arama yapın.';
        });
        return;
      }
      final id = _randomId();
      final loc = SavedLocation(
        id: id,
        city: result.city ?? 'Konumum',
        country: result.country ?? '',
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
      );
      context.read<LocationBloc>()
        ..add(SavedLocationAdded(loc))
        ..add(LocationSelected(id));
      if (mounted) setState(() => _loading = false);
      await Future<void>.delayed(const Duration(milliseconds: 300));
      if (mounted) _advanceToStep(1);
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = 'Konum hatası. Lütfen manuel arama yapın.';
        });
      }
    }
  }

  void _advanceToStep(int step) {
    if (!mounted) return;
    setState(() => _step = step);
  }

  String? _searchError;

  Future<void> _search() async {
    if (_searchQuery.trim().length < 2) return;
    setState(() {
      _searching = true;
      _searchError = null;
    });
    try {
      final results = await getIt<LocationRepository>().searchCities(_searchQuery, language: 'tr');
      if (mounted) {
        setState(() {
          _searchResults = results;
          _searching = false;
          _searchError = results.isEmpty ? 'Sonuç bulunamadı.' : null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _searchResults = [];
          _searching = false;
          _searchError = 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.';
        });
      }
    }
  }

  void _selectSearchResult(SearchResult r) {
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
    setState(() {
      _showSearch = false;
      _searchQuery = '';
      _searchResults = [];
      _searchError = null;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _advanceToStep(1);
    });
  }

  static String _randomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return List.generate(7, (_) => chars[Random().nextInt(chars.length)]).join();
  }

  Future<void> _requestNotificationPermission() async {
    await Permission.notification.request();
  }

  void _finishOnboarding() {
    getIt<SharedPreferences>().setBool(StorageKeys.onboardingCompleted, true);
    OnboardingNotifierScope.of(context)?.setCompleted(true);
    context.read<TabIndexCubit>().selectTab(0);
    context.go('/');
  }

  Future<void> _finishWithSelections() async {
    if (!mounted) return;
    for (final p in _selectedPrayers) {
      context.read<NotificationsBloc>().add(PrayerNotificationToggled(p, true));
    }
    // When no prayers selected (step 2 skipped), ezan stays off.
    context.read<NotificationsBloc>().add(
          PlayAdhanChanged(_selectedPrayers.isEmpty ? false : _ezanEnabled),
        );
    if (!mounted) return;
    _finishOnboarding();
  }

  void _togglePrayer(PrayerName p) {
    setState(() {
      if (_selectedPrayers.contains(p)) {
        _selectedPrayers.remove(p);
      } else {
        _selectedPrayers.add(p);
      }
    });
  }

  static const _prayerLabels = [
    (PrayerName.fajr, 'Sabah'),
    (PrayerName.dhuhr, 'Öğle'),
    (PrayerName.asr, 'İkindi'),
    (PrayerName.maghrib, 'Akşam'),
    (PrayerName.isha, 'Yatsı'),
  ];

  @override
  Widget build(BuildContext context) {
    if (_showSearch) {
      return _buildSearchScreen(context);
    }
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        minimum: EdgeInsets.only(top: 24),
        child: Column(
          children: [
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(minHeight: constraints.maxHeight),
                      child: Align(
                        alignment: Alignment.topCenter,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                          child: _buildStepContent(context),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            _buildProgressIndicator(context),
            _buildBottomActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator(BuildContext context) {
    final theme = Theme.of(context);
    // When no prayers selected, step 3 is skipped — show "2 / 2" so continuing feels like completion, not a jump.
    final effectiveTotal =
        (_step == 1 && _selectedPrayers.isEmpty) ? 2 : _totalSteps;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ...List.generate(effectiveTotal, (i) {
            final active = i <= _step;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: active ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: active
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withOpacity(0.3),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
          const SizedBox(width: 12),
          Text(
            '${_step + 1} / $effectiveTotal',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent(BuildContext context) {
    switch (_step) {
      case 0:
        return _buildLocationStep(context);
      case 1:
        return _buildPrayerSelectionStep(context);
      case 2:
        return _buildEzanStep(context);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildLocationStep(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Konumunuz',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Hangi şehir için namaz vakitlerini görmek istersiniz?',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          if (_errorMessage != null) ...[
            Text(
              _errorMessage!,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
          ],
          FilledButton.icon(
            onPressed: _loading ? null : _useGps,
            icon: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(LucideIcons.navigation),
            label: Text(_loading ? 'Konum alınıyor...' : 'GPS ile Bul'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 16),
          Semantics(
            identifier: 'city_search_button',
            child: OutlinedButton.icon(
              onPressed: () => setState(() => _showSearch = true),
              icon: const Icon(LucideIcons.search),
              label: const Text('Şehir Ara'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
    );
  }

  Widget _buildPrayerSelectionStep(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      identifier: 'onboarding_prayer_step',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            LucideIcons.bell,
            size: 40,
            color: theme.colorScheme.primary.withOpacity(0.9),
          ),
          const SizedBox(height: 20),
          Text(
            'Hangi Namazlar İçin Bildirim?',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onSurface,
              letterSpacing: -0.3,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Seçtiğiniz namazlardan önce hatırlatma alacaksınız.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: _prayerLabels
                .map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _buildPrayerCheckbox(context, e.$2, e.$1),
                    ))
                .toList(),
          ),
          const SizedBox(height: 16),
          Text(
            'Daha sonra Ayarlar\'dan değiştirebilirsiniz.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPrayerCheckbox(BuildContext context, String label, PrayerName prayer) {
    final theme = Theme.of(context);
    final isSelected = _selectedPrayers.contains(prayer);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _togglePrayer(prayer),
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primaryContainer.withOpacity(0.6)
                : theme.colorScheme.surfaceContainerHighest.withOpacity(0.8),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary.withOpacity(0.5)
                  : theme.colorScheme.outline.withOpacity(0.2),
              width: isSelected ? 1.5 : 1,
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: theme.colorScheme.primary.withOpacity(0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : Colors.transparent,
                  border: Border.all(
                    color: isSelected
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline.withOpacity(0.5),
                    width: 2,
                  ),
                  shape: BoxShape.circle,
                ),
                child: isSelected
                    ? Center(
                        child: Icon(
                          LucideIcons.check,
                          size: 14,
                          color: theme.colorScheme.onPrimary,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  label,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: theme.colorScheme.onSurface,
                    letterSpacing: -0.2,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEzanStep(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      identifier: 'onboarding_ezan_step',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(LucideIcons.volume2, size: 80, color: theme.colorScheme.primary),
        const SizedBox(height: 24),
        Text(
          'Ezan Sesi',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Namaz vakitlerinde ezan sesi duymak ister misiniz?',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 40),
        _buildEzanChoice(
          context,
          title: 'Evet, Ezan Okunsun',
          subtitle: 'Her namazda ezan sesi çalacak',
          icon: LucideIcons.volume2,
          isSelected: _ezanEnabled,
          onTap: () => setState(() => _ezanEnabled = true),
        ),
        const SizedBox(height: 16),
        _buildEzanChoice(
          context,
          title: 'Hayır, Sadece Bildirim',
          subtitle: 'Sessiz bildirim alacaksınız',
          icon: LucideIcons.bellOff,
          isSelected: !_ezanEnabled,
          onTap: () => setState(() => _ezanEnabled = false),
        ),
      ],
    ),
    );
  }

  Widget _buildEzanChoice(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primaryContainer
                : theme.colorScheme.surfaceContainerHighest,
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outline.withOpacity(0.3),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 32,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Icon(
                  LucideIcons.check,
                  color: theme.colorScheme.primary,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomActions(BuildContext context) {
    final bottomPad = 24 + MediaQuery.of(context).viewPadding.bottom;
    if (_step == 0) {
      return Padding(
        padding: EdgeInsets.fromLTRB(24, 0, 24, bottomPad),
        child: Center(
          child: Text(
            'Konumunuzu seçin veya GPS kullanın',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    if (_step == 1) {
      return Padding(
        padding: EdgeInsets.fromLTRB(24, 0, 24, bottomPad),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _step = 0),
                    child: const Text('Geri'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Semantics(
                    identifier: 'onboarding_prayer_continue',
                    child: FilledButton(
                      onPressed: () async {
                        if (_selectedPrayers.isEmpty) {
                          await _finishWithSelections();
                          return;
                        }
                        await _requestNotificationPermission();
                        if (!mounted) return;
                        setState(() => _step = 2);
                      },
                      child: const Text('Devam Et'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
    // Step 2: Ezan (final)
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, bottomPad),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() => _step = 1),
              child: const Text('Geri'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Semantics(
              identifier: 'onboarding_finish',
              child: FilledButton(
                onPressed: () => _finishWithSelections(),
                child: const Text('Başla'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchScreen(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => setState(() {
            _showSearch = false;
            _searchQuery = '';
            _searchResults = [];
            _searchError = null;
          }),
        ),
        title: const Text('Şehir Arayın'),
        backgroundColor: colorScheme.surface,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(
                identifier: 'city_search_description',
                child: Text(
                  'Namaz vakitleri için bulunduğunuz şehri seçin.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: Semantics(
                        identifier: 'city_search_input',
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Şehir adı yazın...',
                            prefixIcon: const Icon(LucideIcons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                          onChanged: (v) => setState(() => _searchQuery = v),
                          onSubmitted: (_) => _search(),
                          textInputAction: TextInputAction.search,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Semantics(
                      identifier: 'city_search_submit',
                      child: FilledButton(
                        onPressed: _searchQuery.trim().length >= 2 && !_searching
                            ? _search
                            : null,
                        child: const Text('Ara'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (_searchError != null) ...[
                const SizedBox(height: 12),
                Semantics(
                  identifier: 'city_search_no_results',
                  child: Text(
                    _searchError!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.error,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Expanded(
                child: _searching
                    ? const Center(child: CircularProgressIndicator())
                    : _searchResults.isEmpty
                        ? _buildSearchEmptyState(context)
                        : ListView.builder(
                            padding: EdgeInsets.zero,
                            itemCount: _searchResults.length,
                            itemBuilder: (context, i) {
                              final r = _searchResults[i];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Semantics(
                                  identifier: i == 0
                                      ? 'city_search_first_result'
                                      : 'city_search_result_$i',
                                  child: ListTile(
                                    leading: Icon(
                                      LucideIcons.mapPin,
                                      color: colorScheme.primary,
                                    ),
                                    title: Text(r.city),
                                    subtitle:
                                        r.country != null ? Text(r.country!) : null,
                                    onTap: () => _selectSearchResult(r),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchEmptyState(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.mapPin,
              size: 48,
              color: colorScheme.primary.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'En az 2 karakter yazıp Ara\'ya basın',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
