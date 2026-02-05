import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/widgets/pattern_background.dart';
import 'package:namaz_vakitleri_flutter/features/home/presentation/home_screen.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/qibla/presentation/qibla_screen.dart';
import 'package:namaz_vakitleri_flutter/features/religious_days/presentation/religious_days_screen.dart';
import 'package:namaz_vakitleri_flutter/core/routes/tab_index_cubit.dart';
import 'package:namaz_vakitleri_flutter/features/settings/presentation/settings_screen.dart';

/// Bottom nav shell: Vakitler, Dini Günler, Kıble, Ayarlar (always all four).
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  static const _tabs = [
    (label: 'Vakitler', icon: LucideIcons.home),
    (label: 'Dini Günler', icon: LucideIcons.calendar),
    (label: 'Kıble', icon: LucideIcons.compass),
    (label: 'Ayarlar', icon: LucideIcons.settings),
  ];

  static final _screens = [
    const HomeScreen(),
    const ReligiousDaysScreen(),
    const QiblaScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final unselected = theme.colorScheme.onSurfaceVariant;
    final currentIndex = context.watch<TabIndexCubit>().state.clamp(0, _screens.length - 1);
    return Scaffold(
      body: PatternBackground(
        child: SafeArea(
          minimum: EdgeInsets.only(top: 24),
          child: IndexedStack(
            index: currentIndex,
            children: _screens,
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
            ),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                for (int i = 0; i < _tabs.length; i++)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        if (i == 0 && currentIndex != 0) {
                          context.read<PrayerTimesBloc>().add(
                                PrayerTimesDateChanged(DateTime.now()),
                              );
                        }
                        context.read<TabIndexCubit>().selectTab(i);
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _tabs[i].icon,
                            size: 24,
                            color: i == currentIndex ? primary : unselected,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _tabs[i].label,
                            style: TextStyle(
                              fontSize: 12,
                              color: i == currentIndex ? primary : unselected,
                              fontWeight: i == currentIndex ? FontWeight.w600 : FontWeight.normal,
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
    );
  }
}
