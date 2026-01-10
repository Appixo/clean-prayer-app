# Hardened Release Checklist

## 1. Build Verification
- [ ] Run `npx expo prebuild --clean`
- [ ] Verify `android/app/src/main/res/raw/adhan.mp3` exists.
- [ ] Verify `AndroidManifest.xml` contains:
  - `FOREGROUND_SERVICE`
  - `WAKE_LOCK`
  - `SCHEDULE_EXACT_ALARM`
  - `POST_NOTIFICATIONS`

## 2. Testing Scenarios

### Audio Reliability
- [ ] **Verification**: App running -> Simulate Prayer. Audio matches `adhan.mp3`?
- [ ] **Auto-Dismiss**: Wait 5 minutes (timeoutAfter). Does notification vanish?
- [ ] **Background**: Kill App -> Schedule -> Wait. Does it fire?

### Deep Sleep (Doze Mode)
1. Schedule a prayer for +5 minutes.
2. Force Doze: `adb shell dumpsys deviceidle force-idle`
3. Screen off, wait.
4. **Result**: Notification *must* fire at exact time, sound *must* play fully.

### Battery Impact
- [ ] **Battery Saver**: Enable saver. Adhan should still play.
- [ ] **Wake Lock**: Should be managed by Notifee (Foreground Service).

## 3. Permissions
- [ ] **Exact Alarm**: On Android 13+, confirm `SCHEDULE_EXACT_ALARM` is granted or requested. (May need manual toggle in Settings).
- [ ] **Notifications**: `POST_NOTIFICATIONS` prompt.

## 4. Edge Cases
- [ ] **Reboot**: Device restart. (Notifee typically reschedules, but verify).
- [ ] **Update**: App update preserves scheduling.

## 5. Deployment
- [ ] `npx expo run:android --configuration Release`
