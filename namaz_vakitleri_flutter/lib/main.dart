import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/app.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
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
  FlutterForegroundTask.initCommunicationPort();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
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

  // Defer heavy/plugin init until after first frame so the VM service can
  // attach (avoids "Lost connection to device" on Android). A short delay
  // lets the first frame draw and the debug connection stabilize.
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    await Future<void>.delayed(const Duration(milliseconds: 1500));
    await initNotificationsAndAdhan();
    getIt<LocationBloc>().add(const LocationRequested());
    getIt<PrayerTimesBloc>().add(const PrayerTimesRefreshRequested());
    getIt<NotificationsBloc>().add(const NotificationsLoadRequested());
    if (AppConstants.enableWidgets) await registerBackgroundTask();
  });
}
