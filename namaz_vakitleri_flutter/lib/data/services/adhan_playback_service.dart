import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:just_audio/just_audio.dart';
import 'package:namaz_vakitleri_flutter/core/platform/adhan_foreground_task.dart';

/// Adhan playback using [just_audio]. On Android, a simple foreground-service
/// notification (no media controls / no "Phone speaker") keeps playback in background.
class AdhanPlaybackService {
  AdhanPlaybackService() {
    _player = AudioPlayer();
    _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        stop();
      }
    });
  }

  late final AudioPlayer _player;
  static AdhanPlaybackService? _instance;

  static AdhanPlaybackService get instance {
    _instance ??= AdhanPlaybackService();
    return _instance!;
  }

  /// Call from main isolate so notification action handler can stop playback
  /// when app is in foreground/background (not when app process is killed).
  static void setInstanceForStop(AdhanPlaybackService? service) {
    _instance = service;
  }

  /// Stops playback and releases the player. Safe to call when not playing.
  Future<void> stop() async {
    try {
      await _player.stop();
      await _player.seek(Duration.zero);
      if (Platform.isAndroid) {
        await FlutterForegroundTask.stopService();
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[AdhanPlayback] stop error: $e');
    }
  }

  /// Plays the adhan asset. On Android, starts a foreground service with a simple
  /// notification (title + "Durdur" only); no media-style controls (no seek/pause).
  /// [prayerName] is used for the notification title.
  Future<void> play({
    required String assetPath,
    String prayerName = 'Adhan',
  }) async {
    try {
      await stop();
      if (Platform.isAndroid) {
        await FlutterForegroundTask.startService(
          serviceTypes: const [ForegroundServiceTypes.dataSync],
          notificationTitle: '$prayerName Adhan',
          notificationText: 'Namaz Vakitleri',
          notificationButtons: const [
            NotificationButton(id: kAdhanNotificationStopButtonId, text: 'Durdur'),
          ],
          callback: adhanForegroundTaskCallback,
        );
      }
      await _player.setAudioSource(
        AudioSource.uri(Uri.parse('asset:///$assetPath')),
      );
      await _player.play();
    } catch (e) {
      if (kDebugMode) debugPrint('[AdhanPlayback] play error: $e');
    }
  }

  /// Disposes the player. Call when app is shutting down if needed.
  Future<void> dispose() async {
    await _player.dispose();
    _instance = null;
  }
}
