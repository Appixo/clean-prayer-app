import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:namaz_vakitleri_flutter/core/routes/onboarding_notifier.dart';
import 'package:namaz_vakitleri_flutter/core/routes/tab_index_cubit.dart';
import 'package:namaz_vakitleri_flutter/core/theme/app_theme.dart';
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_log/prayer_log.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';
import 'package:namaz_vakitleri_flutter/features/zikirmatik/zikirmatik.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart'
    as settings_entity;
import 'package:talker_flutter/talker_flutter.dart';

class NamazVakitleriApp extends StatelessWidget {
  const NamazVakitleriApp({
    super.key,
    required this.router,
    required this.onboardingNotifier,
    required this.locationBloc,
    required this.settingsBloc,
    required this.prayerTimesBloc,
    required this.notificationsBloc,
    required this.prayerLogBloc,
    required this.zikirmatikBloc,
  });

  final GoRouter router;
  final OnboardingNotifier onboardingNotifier;
  final LocationBloc locationBloc;
  final SettingsBloc settingsBloc;
  final PrayerTimesBloc prayerTimesBloc;
  final NotificationsBloc notificationsBloc;
  final PrayerLogBloc prayerLogBloc;
  final ZikirmatikBloc zikirmatikBloc;

  @override
  Widget build(BuildContext context) {
    final content = MultiBlocProvider(
      providers: [
        BlocProvider.value(value: locationBloc),
        BlocProvider.value(value: settingsBloc),
        BlocProvider.value(value: prayerTimesBloc),
        BlocProvider.value(value: notificationsBloc),
        BlocProvider.value(value: prayerLogBloc),
        BlocProvider.value(value: zikirmatikBloc),
        BlocProvider(create: (_) => TabIndexCubit()),
      ],
      child: OnboardingNotifierScope(
        notifier: onboardingNotifier,
        child: MaterialApp.router(
          title: 'Namaz Vakitleri',
          debugShowCheckedModeBanner: false,
          locale: const Locale('tr', 'TR'),
          supportedLocales: const [Locale('tr', 'TR')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: ThemeMode.system,
          routerConfig: router,
          builder: (context, child) {
            return BlocBuilder<SettingsBloc, SettingsState>(
              buildWhen: (prev, curr) =>
                  prev.settings?.theme != curr.settings?.theme,
              builder: (context, state) {
                final useDark = state.settings == null
                    ? null
                    : (state.settings!.theme == settings_entity.AppTheme.dark
                        ? true
                        : state.settings!.theme == settings_entity.AppTheme.light
                            ? false
                            : null);
                final theme = useDark == null
                    ? Theme.of(context)
                    : (useDark ? AppTheme.dark : AppTheme.light);
                return Theme(data: theme, child: child ?? const SizedBox.shrink());
              },
            );
          },
        ),
      ),
    );
    if (kDebugMode || kProfileMode) {
      return TalkerWrapper(
        talker: AppLogger.talker,
        child: content,
      );
    }
    return content;
  }
}
