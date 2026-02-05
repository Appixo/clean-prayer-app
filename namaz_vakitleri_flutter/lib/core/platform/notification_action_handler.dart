import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:namaz_vakitleri_flutter/core/constants/storage_keys.dart';

/// Action IDs for prayer notification buttons (must match [AndroidNotificationAction] ids).
const String kActionMarkPrayed = 'MARK_PRAYED';
const String kActionStopAdhan = 'STOP_ADHAN';

/// Payload keys for prayer notification (stored as JSON string in notification payload).
const String kPayloadDate = 'date';
const String kPayloadPrayerName = 'prayerName';

/// Top-level handler for notification actions when app is in background or terminated.
/// Runs in a separate isolate; only SharedPreferences and cancel are safe.
/// Must be annotated so the Dart compiler does not strip it.
@pragma('vm:entry-point')
Future<void> onBackgroundNotificationResponse(NotificationResponse response) async {
  final actionId = response.actionId;
  if (actionId == null || actionId.isEmpty) return;

  final prefs = await SharedPreferences.getInstance();
  final plugin = FlutterLocalNotificationsPlugin();

  if (actionId == kActionMarkPrayed) {
    final payload = response.payload;
    if (payload != null && payload.isNotEmpty) {
      try {
        final map = jsonDecode(payload) as Map<String, dynamic>?;
        final dateKey = map?[kPayloadDate] as String?;
        final prayerName = map?[kPayloadPrayerName] as String?;
        if (dateKey != null && prayerName != null) {
          await prefs.setBool('${StorageKeys.prayerLogPrefix}${dateKey}_$prayerName', true);
        }
      } catch (_) {}
    }
  }

  if (response.id != null) {
    await plugin.cancel(response.id!);
  }
  // STOP_ADHAN: cancelling the notification above dismisses it; when app is running,
  // onDidReceiveNotificationResponse in the main isolate will call AdhanPlaybackService.stop()
}

/// Builds payload string for prayer notification (date + prayerName for MARK_PRAYED).
String prayerNotificationPayload({required String dateKey, required String prayerName}) {
  return jsonEncode({kPayloadDate: dateKey, kPayloadPrayerName: prayerName});
}
