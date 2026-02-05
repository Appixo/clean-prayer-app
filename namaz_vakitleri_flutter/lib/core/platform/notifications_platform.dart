import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:namaz_vakitleri_flutter/core/platform/notification_action_handler.dart';
import 'package:namaz_vakitleri_flutter/core/utils/app_logger.dart';
import 'package:namaz_vakitleri_flutter/data/services/adhan_playback_service.dart';

const String _adhanChannelId = 'adhan';
const String _adhanChannelName = 'Ezan Bildirimleri';
const String _defaultChannelId = 'default';
const String _defaultChannelName = 'Varsayılan';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

/// Initializes [JustAudioBackground] for adhan playback in background and
/// [FlutterLocalNotificationsPlugin] with prayer notification channels and
/// action handlers (Stop, Mark as Prayed) that work when app is killed.
Future<void> initNotificationsAndAdhan() async {
  if (!Platform.isAndroid) return;

  await JustAudioBackground.init(
    androidNotificationChannelId: _adhanChannelId,
    androidNotificationChannelName: _adhanChannelName,
    androidNotificationOngoing: true,
  );

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

/// Android notification details for a prayer-time notification with Stop and Mark as Prayed actions.
/// Pass [sound] (raw resource name without extension) for adhan channel, e.g. 'adhan' if res/raw/adhan.mp3 exists.
AndroidNotificationDetails androidPrayerNotificationDetails({
  required String channelId,
}) {
  return AndroidNotificationDetails(
    channelId,
    channelId == _adhanChannelId ? _adhanChannelName : _defaultChannelName,
    channelDescription: 'Namaz vakti bildirimleri',
    importance: Importance.high,
    priority: Priority.high,
    actions: <AndroidNotificationAction>[
      const AndroidNotificationAction(
        kActionMarkPrayed,
        'Namaz Kılındı',
        showsUserInterface: false,
        cancelNotification: true,
      ),
      const AndroidNotificationAction(
        kActionStopAdhan,
        'Durdur',
        showsUserInterface: false,
        cancelNotification: true,
      ),
    ],
  );
}
