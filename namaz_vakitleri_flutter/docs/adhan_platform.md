# Adhan playback – platform split

Per migration plan:

- **Android**: Use a **foreground service** for reliable Adhan playback so the full audio plays. Expose a "Stop" action (e.g. notification action). Implement in `lib/features/notifications/` using `flutter_local_notifications` and a foreground service (or equivalent).

- **iOS**: **Prioritize standard notifications with custom sounds.** Do not rely on background audio. Use a **notification with custom sound** (e.g. bundled Adhan clip) so when the prayer-time notification fires, the user hears Adhan via the notification sound. Optionally open the app on tap for "Stop" or "Dismiss". Design the iOS Adhan experience around "notification + custom sound" as the primary path.

## Current implementation (Android)

- **Adhan playback**: `lib/data/services/adhan_playback_service.dart` uses **just_audio** with **flutter_foreground_task** so playback continues in background. A simple notification (title + "Durdur" button only) is shown—no media-style "Phone speaker" notification, so users cannot seek/pause from the system media controls.
- **Notification actions**: `lib/core/platform/notifications_platform.dart` initializes **flutter_foreground_task** (adhan channel) and **flutter_local_notifications** with:
  - **Mark as Prayed** (`MARK_PRAYED`): writes to SharedPreferences (prayer log) so it works when the app is killed.
  - **Stop** (`STOP_ADHAN`): stops the adhan player when the app is running; when the app is killed, cancelling the notification dismisses it.
- **Background handler**: `lib/core/platform/notification_action_handler.dart` defines a top-level `@pragma('vm:entry-point')` handler for `onDidReceiveBackgroundNotificationResponse` so action taps are handled even when the app was terminated.
- When you schedule a prayer-time notification, use `androidPrayerNotificationDetails(channelId: …)` and pass `prayerNotificationPayload(dateKey: …, prayerName: …)` as the notification payload so "Mark as Prayed" can persist correctly.
