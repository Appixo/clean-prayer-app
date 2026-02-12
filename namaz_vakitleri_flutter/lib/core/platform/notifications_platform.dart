import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:namaz_vakitleri_flutter/core/platform/adhan_foreground_task.dart';
import 'package:namaz_vakitleri_flutter/core/platform/notification_action_handler.dart';
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/data/services/adhan_playback_service.dart';

const String _adhanChannelId = 'adhan';
const String _adhanChannelName = 'Ezan Bildirimleri';
const String _defaultChannelId = 'default';
const String _defaultChannelName = 'Varsayılan';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

/// Initializes [FlutterForegroundTask] for adhan (simple notification, no media controls)
/// and [FlutterLocalNotificationsPlugin] with prayer notification channels and
/// action handlers (Stop, Mark as Prayed) that work when app is killed.
/// The adhan foreground-service notification is ongoing (non-swipeable) so the user can
/// always tap Durdur; prayer-time-only notifications are swipeable (ongoing: false).
Future<void> initNotificationsAndAdhan() async {
  if (kIsWeb || !Platform.isAndroid) return;

  FlutterForegroundTask.init(
    androidNotificationOptions: AndroidNotificationOptions(
      channelId: _adhanChannelId,
      channelName: _adhanChannelName,
      channelDescription: 'Ezan ve namaz vakti bildirimleri',
      onlyAlertOnce: true,
    ),
    iosNotificationOptions: const IOSNotificationOptions(
      showNotification: false,
      playSound: false,
    ),
    foregroundTaskOptions: ForegroundTaskOptions(
      eventAction: ForegroundTaskEventAction.repeat(60000),
      autoRunOnBoot: false,
      allowWakeLock: true,
    ),
  );

  FlutterForegroundTask.addTaskDataCallback(_onAdhanTaskData);

  const androidInit = AndroidInitializationSettings('@drawable/notification_icon');
  const initSettings = InitializationSettings(android: androidInit);

  await flutterLocalNotificationsPlugin.initialize(
    initSettings,
    onDidReceiveNotificationResponse: _onNotificationResponse,
    onDidReceiveBackgroundNotificationResponse: onBackgroundNotificationResponse,
  );
  AppLogger.notifications('initNotificationsAndAdhan completed');

  final androidPlugin = flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
  if (androidPlugin != null) {
    await androidPlugin.createNotificationChannel(
      const AndroidNotificationChannel(
        _adhanChannelId,
        _adhanChannelName,
        description: 'Ezan ve namaz vakti bildirimleri',
        importance: Importance.high,
        playSound: true,
      ),
    );
    await androidPlugin.createNotificationChannel(
      const AndroidNotificationChannel(
        _defaultChannelId,
        _defaultChannelName,
        importance: Importance.defaultImportance,
      ),
    );
  }
}

void _onAdhanTaskData(Object data) {
  if (data == kAdhanTaskStopAction) {
    AdhanPlaybackService.instance.stop();
  }
}

void _onNotificationResponse(NotificationResponse response) {
  final actionId = response.actionId;
  AppLogger.notifications('notification action id=$actionId payload=${response.payload}');
  if (actionId == null) return;

  if (actionId == kActionStopAdhan) {
    AdhanPlaybackService.instance.stop();
  }

  if (response.id != null) {
    flutterLocalNotificationsPlugin.cancel(response.id!);
  }
}

/// Shows a prayer-time notification with Stop and Mark as Prayed actions.
/// Use when the countdown reaches zero or at scheduled prayer time (e.g. from app).
Future<void> showPrayerTimeNotification({
  required int id,
  required String title,
  required String body,
  required String dateKey,
  required String prayerName,
}) async {
  if (kIsWeb || !Platform.isAndroid) return;
  final payload = prayerNotificationPayload(dateKey: dateKey, prayerName: prayerName);
  final details = NotificationDetails(
    android: androidPrayerNotificationDetails(channelId: _adhanChannelId),
  );
  await flutterLocalNotificationsPlugin.show(id, title, body, details, payload: payload);
}

/// Android notification details for a prayer-time notification with Stop and Mark as Prayed actions.
/// Pass [sound] (raw resource name without extension) for adhan channel, e.g. 'adhan' if res/raw/adhan.mp3 exists.
/// [ongoing] is false so the user can swipe away when not playing adhan; the adhan foreground-service
/// notification is ongoing (non-swipeable) by the plugin so the user can always tap Durdur.
AndroidNotificationDetails androidPrayerNotificationDetails({
  required String channelId,
}) {
  return AndroidNotificationDetails(
    channelId,
    channelId == _adhanChannelId ? _adhanChannelName : _defaultChannelName,
    channelDescription: 'Namaz vakti bildirimleri',
    importance: Importance.high,
    priority: Priority.high,
    ongoing: false,
    actions: <AndroidNotificationAction>[
      const AndroidNotificationAction(
        kActionStopAdhan,
        'Durdur',
        showsUserInterface: true,
        cancelNotification: true,
      ),
    ],
  );
}
