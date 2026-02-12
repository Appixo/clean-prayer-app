import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:intl/intl.dart';
import 'package:namaz_vakitleri_flutter/core/constants/app_constants.dart';
import 'package:namaz_vakitleri_flutter/core/utils/hijri_date.dart';
import 'package:namaz_vakitleri_flutter/data/services/widget_service.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/calculation_params.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/coordinates.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_name.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/prayer_times_entity.dart';
import 'package:namaz_vakitleri_flutter/domain/entities/app_settings.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';
import 'package:namaz_vakitleri_flutter/features/settings/settings.dart';

part 'prayer_times_event.dart';
part 'prayer_times_state.dart';

class PrayerTimesBloc extends Bloc<PrayerTimesEvent, PrayerTimesState> {
  PrayerTimesBloc(
    this._prayerRepo,
    this._locationBloc,
    this._settingsBloc,
    this._widgetService,
  ) : super(const PrayerTimesStateInitial()) {
    on<PrayerTimesRefreshRequested>(_onRefresh);
    on<PrayerTimesDateChanged>(_onDateChanged);
    _locationSubscription = _locationBloc.stream.listen((_) => add(const PrayerTimesRefreshRequested()));
    _settingsSubscription = _settingsBloc.stream.listen((_) => add(const PrayerTimesRefreshRequested()));
  }

  final PrayerTimesRepository _prayerRepo;
  final LocationBloc _locationBloc;
  final SettingsBloc _settingsBloc;
  final WidgetService _widgetService;
  late final StreamSubscription<LocationState> _locationSubscription;
  late final StreamSubscription<SettingsState> _settingsSubscription;

  @override
  Future<void> close() {
    _locationSubscription.cancel();
    _settingsSubscription.cancel();
    return super.close();
  }

  void _onRefresh(PrayerTimesRefreshRequested event, Emitter<PrayerTimesState> emit) {
    final locationState = _locationBloc.state;
    final coordinates = locationState.coordinates;
    final settingsState = _settingsBloc.state.settings;
    if (coordinates == null || settingsState == null) {
      emit(const PrayerTimesStateInitial());
      return;
    }
    final date = state is PrayerTimesStateLoaded ? (state as PrayerTimesStateLoaded).date : DateTime.now();
    final entity = _prayerRepo.getPrayerTimesForDate(
      coordinates: coordinates,
      params: settingsState.calculationParams,
      date: DateTime(date.year, date.month, date.day),
    );
    final city = locationState.city;
    final countdown = _todayNextPrayerInfo(coordinates, settingsState.calculationParams);
    emit(PrayerTimesStateLoaded(
      prayerTimes: entity,
      date: date,
      city: city,
      nextPrayerDate: countdown.nextPrayerDate,
      countdownTimeUntilMs: countdown.timeUntilMs,
      countdownNextPrayer: countdown.nextPrayer,
    ));
    _syncWidgetAndConfig(
      entity: entity,
      date: date,
      city: city,
      coordinates: coordinates,
      settingsState: settingsState,
      locationState: locationState,
    );
  }

  void _syncWidgetAndConfig({
    required PrayerTimesEntity entity,
    required DateTime date,
    required String city,
    required Coordinates coordinates,
    required AppSettings settingsState,
    required LocationState locationState,
  }) {
    if (!AppConstants.enableWidgets) return;
    _widgetService.persistWidgetConfigCache(
      coordinates: coordinates,
      city: city,
      country: locationState is LocationStateLoaded ? locationState.country : null,
      calculationParams: settingsState.calculationParams,
      timeFormat: settingsState.timeFormat,
      theme: settingsState.theme,
    );
    final dateStr = DateFormat.yMMMMd('tr').format(date);
    final hijriStr = formatHijriDate(date);
    final theme = WidgetService.resolveWidgetTheme(settingsState.theme);
    _widgetService.syncPrayerDataToWidget(
      city: city,
      date: dateStr,
      hijriDate: hijriStr,
      prayerTimes: entity,
      theme: theme,
    );
  }

  void _onDateChanged(PrayerTimesDateChanged event, Emitter<PrayerTimesState> emit) {
    final locationState = _locationBloc.state;
    final coordinates = locationState.coordinates;
    final settingsState = _settingsBloc.state.settings;
    if (coordinates == null || settingsState == null) return;
    final date = DateTime(event.date.year, event.date.month, event.date.day);
    final entity = _prayerRepo.getPrayerTimesForDate(
      coordinates: coordinates,
      params: settingsState.calculationParams,
      date: date,
    );
    final city = locationState.city;
    final countdown = _todayNextPrayerInfo(coordinates, settingsState.calculationParams);
    emit(PrayerTimesStateLoaded(
      prayerTimes: entity,
      date: date,
      city: city,
      nextPrayerDate: countdown.nextPrayerDate,
      countdownTimeUntilMs: countdown.timeUntilMs,
      countdownNextPrayer: countdown.nextPrayer,
    ));
    _syncWidgetAndConfig(
      entity: entity,
      date: date,
      city: city,
      coordinates: coordinates,
      settingsState: settingsState,
      locationState: locationState,
    );
  }

  /// Today's next-prayer info: date, time-until-ms, and name. Used for countdown and highlight.
  ({DateTime? nextPrayerDate, int? timeUntilMs, PrayerName? nextPrayer}) _todayNextPrayerInfo(
    Coordinates coordinates,
    CalculationParams params,
  ) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final entity = _prayerRepo.getPrayerTimesForDate(
      coordinates: coordinates,
      params: params,
      date: today,
    );
    final t = entity.nextPrayerTime;
    if (t == null) {
      return (nextPrayerDate: null, timeUntilMs: null, nextPrayer: null);
    }
    return (
      nextPrayerDate: DateTime(t.year, t.month, t.day),
      timeUntilMs: entity.timeUntilNextMs,
      nextPrayer: entity.nextPrayer,
    );
  }
}
