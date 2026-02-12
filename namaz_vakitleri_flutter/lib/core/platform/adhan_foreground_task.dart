import 'package:flutter_foreground_task/flutter_foreground_task.dart';

/// Sent to main isolate when user taps "Stop" on the adhan foreground notification.
const String kAdhanTaskStopAction = 'stop_adhan';

/// Id for the Stop button on the adhan foreground notification.
const String kAdhanNotificationStopButtonId = 'stop';

/// Top-level callback required by [FlutterForegroundTask.startService].
/// Must be a top-level or static function; called from the task isolate.
@pragma('vm:entry-point')
void adhanForegroundTaskCallback() {
  FlutterForegroundTask.setTaskHandler(AdhanTaskHandler());
}

/// Task handler for the adhan foreground service. Runs in a separate isolate.
/// When the user taps "Durdur" on the notification, sends [kAdhanTaskStopAction]
/// to the main isolate and stops the service (no media controls / seek bar).
class AdhanTaskHandler extends TaskHandler {
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {}

  @override
  void onRepeatEvent(DateTime timestamp) {}

  @override
  Future<void> onDestroy(DateTime timestamp, bool isTimeout) async {}

  @override
  void onReceiveData(Object data) {}

  @override
  void onNotificationButtonPressed(String id) {
    if (id == kAdhanNotificationStopButtonId) {
      FlutterForegroundTask.sendDataToMain(kAdhanTaskStopAction);
      FlutterForegroundTask.stopService();
    }
  }

  @override
  void onNotificationPressed() {}

  @override
  void onNotificationDismissed() {}
}
