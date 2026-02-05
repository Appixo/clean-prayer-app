import 'package:flutter/foundation.dart';
import 'package:talker/talker.dart';

/// Global logger for QA and debugging. Use Talker so logs can be exported
/// and shared (e.g. from device S25) for diagnosis.
class AppLogger {
  AppLogger._();

  static final Talker _talker = Talker(
    settings: TalkerSettings(
      useConsoleLogs: kDebugMode,
      maxHistoryItems: 500,
    ),
  );

  static Talker get talker => _talker;

  static void navigation(String message) {
    _talker.log('[navigation] $message');
  }

  static void api(String message) {
    _talker.log('[api] $message');
  }

  static void notifications(String message) {
    _talker.log('[notifications] $message');
  }

  static void error(dynamic e, [StackTrace? st]) {
    _talker.handle(e, st);
  }
}
