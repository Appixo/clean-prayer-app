import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:namaz_vakitleri_flutter/core/routes/main_shell.dart';
import 'package:namaz_vakitleri_flutter/core/routes/onboarding_notifier.dart';
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/features/about/presentation/about_screen.dart';
import 'package:namaz_vakitleri_flutter/features/kaza/presentation/kaza_screen.dart';
import 'package:namaz_vakitleri_flutter/features/onboarding/presentation/onboarding_screen.dart';
import 'package:namaz_vakitleri_flutter/features/statistics/presentation/statistics_screen.dart';
import 'package:namaz_vakitleri_flutter/features/zikirmatik/presentation/zikirmatik_screen.dart';
import 'package:talker_flutter/talker_flutter.dart';

GoRouter createAppRouter(OnboardingNotifier onboardingNotifier) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: onboardingNotifier,
    observers: [TalkerRouteObserver(AppLogger.talker)],
    redirect: (context, state) {
      final completed = onboardingNotifier.completed;
      final atOnboarding = state.matchedLocation == '/onboarding';
      String? target;
      if (completed == false && !atOnboarding) target = '/onboarding';
      if (completed == true && atOnboarding) target = '/';
      if (target != null) AppLogger.navigation('redirect to $target');
      return target;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) {
          final completed = onboardingNotifier.completed;
          if (completed == null) {
            return Scaffold(
              body: SafeArea(
                minimum: EdgeInsets.only(top: 24),
                child: const Center(child: CircularProgressIndicator()),
              ),
            );
          }
          return const MainShell();
        },
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: '/zikirmatik',
        builder: (context, state) => const ZikirmatikScreen(),
      ),
      GoRoute(
        path: '/kaza',
        builder: (context, state) => const KazaScreen(),
      ),
      GoRoute(
        path: '/statistics',
        builder: (context, state) => const StatisticsScreen(),
      ),
    ],
  );
}
