import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/app.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';
import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:namaz_vakitleri_flutter/core/routes/app_router.dart';
import 'package:namaz_vakitleri_flutter/core/background/workmanager_task.dart';
import 'package:namaz_vakitleri_flutter/core/platform/notifications_platform.dart';
import 'package:namaz_vakitleri_flutter/core/routes/onboarding_notifier.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_log/prayer_log.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';
import 'package:namaz_vakitleri_flutter/features/zikirmatik/zikirmatik.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  await initDependencies();

  final onboardingNotifier = OnboardingNotifier();
  onboardingNotifier.setCompleted(
    getIt<SharedPreferences>().getBool(StorageKeys.onboardingCompleted) ?? false,
  );

  final router = createAppRouter(onboardingNotifier);

  runApp(NamazVakitleriApp(
    router: router,
    onboardingNotifier: onboardingNotifier,
    locationBloc: getIt<LocationBloc>(),
    settingsBloc: getIt<SettingsBloc>(),
    prayerTimesBloc: getIt<PrayerTimesBloc>(),
    notificationsBloc: getIt<NotificationsBloc>(),
    prayerLogBloc: getIt<PrayerLogBloc>(),
    zikirmatikBloc: getIt<ZikirmatikBloc>(),
  ));

  // Defer heavy/plugin init until after first frame and a delay so the VM
  // service can accept the debug connection (avoids "Service connection disposed"
  // / "Lost connection to device" on Android emulator).
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    await Future<void>.delayed(const Duration(seconds: 5));
    await initNotificationsAndAdhan();
    getIt<LocationBloc>().add(const LocationRequested());
    getIt<PrayerTimesBloc>().add(const PrayerTimesRefreshRequested());
    await registerBackgroundTask();
  });
}
