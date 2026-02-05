# Release Checklist (Flutter)

## 1. Build verification

- [ ] From `namaz_vakitleri_flutter`: `flutter pub get` and `flutter clean` then `flutter pub get`
- [ ] Verify `android/app/src/main/res/` and manifest contain required permissions (e.g. `FOREGROUND_SERVICE`, `WAKE_LOCK`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` if used).
- [ ] Verify adhan audio asset exists (e.g. under `assets/audio/` and referenced in pubspec).

## 2. Testing

- [ ] **Unit / widget:** `flutter test` (from `namaz_vakitleri_flutter`)
- [ ] **E2E (optional):** Install app on device/emulator, then `maestro test .maestro/smoke_test_flutter.yaml` from `namaz_vakitleri_flutter`

### Audio / notifications (manual)

- [ ] App running → trigger adhan (e.g. simulate prayer time). Audio plays?
- [ ] Background: kill app, wait for scheduled time. Notification and audio fire?
- [ ] Battery saver on: adhan still plays if supported.

## 3. Permissions

- [ ] **Notifications:** `POST_NOTIFICATIONS` requested on Android 13+.
- [ ] **Exact alarm (if used):** `SCHEDULE_EXACT_ALARM` or user-facing setting.

## 4. Deployment

- [ ] **Android:** `flutter build apk` or `flutter build appbundle` from `namaz_vakitleri_flutter`; sign with your keystore.
- [ ] **Release run:** `flutter run --release` (or install built APK/AAB) and smoke-check.
