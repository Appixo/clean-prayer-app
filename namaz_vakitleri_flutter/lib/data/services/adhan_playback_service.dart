import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';

/// Adhan playback using [just_audio] with [just_audio_background] so playback
/// continues when the app is in background (Android foreground service).
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
    } catch (e) {
      if (kDebugMode) debugPrint('[AdhanPlayback] stop error: $e');
    }
  }

  /// Plays the adhan asset. Uses [just_audio_background] so a media notification
  /// is shown and playback continues in background (Android).
  /// [prayerName] is used for the notification title.
  Future<void> play({
    required String assetPath,
    String prayerName = 'Adhan',
  }) async {
    try {
      await stop();
      await _player.setAudioSource(
        AudioSource.uri(
          Uri.parse('asset:///$assetPath'),
          tag: MediaItem(
            id: 'adhan',
            title: '$prayerName Adhan',
            artist: 'Namaz Vakitleri',
          ),
        ),
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
