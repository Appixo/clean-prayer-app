import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/prayer_calculator.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/notifications_local_datasource.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/prayer_log_local_datasource.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/settings_local_datasource.dart';
import 'package:namaz_vakitleri_flutter/data/datasources/local/zikirmatik_local_datasource.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/prayer_times_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/settings_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/location_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/notifications_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/prayer_log_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/repositories/zikirmatik_repository_impl.dart';
import 'package:namaz_vakitleri_flutter/data/services/widget_service.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/settings_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/location_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/notifications_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_log_repository.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/zikirmatik_repository.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/notifications/notifications.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_log/prayer_log.dart';
import 'package:namaz_vakitleri_flutter/features/prayer_times/prayer_times.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';
import 'package:namaz_vakitleri_flutter/features/zikirmatik/zikirmatik.dart';

final GetIt getIt = GetIt.instance;

Future<void> initDependencies() async {
  final sharedPreferences = await SharedPreferences.getInstance();
  getIt.registerSingleton<SharedPreferences>(sharedPreferences);

  final settingsDs = SettingsLocalDatasource(sharedPreferences);
  final notificationsDs = NotificationsLocalDatasource(sharedPreferences);
  final prayerLogDs = PrayerLogLocalDatasource(sharedPreferences);
  final zikirmatikDs = ZikirmatikLocalDatasource(sharedPreferences);

  getIt.registerSingleton<WidgetService>(WidgetService(sharedPreferences));
  getIt.registerSingleton<SettingsRepository>(
    SettingsRepositoryImpl(settingsDs),
  );
  getIt.registerSingleton<PrayerTimesRepository>(
    PrayerTimesRepositoryImpl(PrayerCalculator()),
  );
  getIt.registerSingleton<LocationRepository>(LocationRepositoryImpl());
  getIt.registerSingleton<NotificationsRepository>(
    NotificationsRepositoryImpl(notificationsDs),
  );
  getIt.registerSingleton<PrayerLogRepository>(
    PrayerLogRepositoryImpl(prayerLogDs),
  );
  getIt.registerSingleton<ZikirmatikRepository>(
    ZikirmatikRepositoryImpl(zikirmatikDs),
  );

  getIt.registerLazySingleton<LocationBloc>(
    () => LocationBloc(
      getIt<LocationRepository>(),
      getIt<SettingsRepository>(),
    ),
  );
  getIt.registerLazySingleton<SettingsBloc>(
    () => SettingsBloc(getIt<SettingsRepository>())
      ..add(const SettingsLoadRequested()),
  );
  getIt.registerLazySingleton<PrayerTimesBloc>(
    () => PrayerTimesBloc(
      getIt<PrayerTimesRepository>(),
      getIt<LocationBloc>(),
      getIt<SettingsBloc>(),
      getIt<WidgetService>(),
    ),
  );
  getIt.registerLazySingleton<NotificationsBloc>(
    () => NotificationsBloc(getIt<NotificationsRepository>())
      ..add(const NotificationsLoadRequested()),
  );
  getIt.registerLazySingleton<PrayerLogBloc>(
    () => PrayerLogBloc(getIt<PrayerLogRepository>())
      ..add(const PrayerLogLoadRequested()),
  );
  getIt.registerLazySingleton<ZikirmatikBloc>(
    () => ZikirmatikBloc(getIt<ZikirmatikRepository>())
      ..add(const ZikirmatikLoadRequested()),
  );
}
