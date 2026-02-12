# Release Checklist (Flutter)

## 0. Launcher icon (if changed)

- [ ] **Config:** `pubspec.yaml` → `flutter_launcher_icons` has `image_path: "assets/images/splash.png"` (or your square icon).
- [ ] **Generate:** From `namaz_vakitleri_flutter` run `dart run flutter_launcher_icons` (or `.\scripts\generate_launcher_icons.ps1` if Flutter is not on PATH).
- [ ] **Commit:** Commit generated files under `android/app/src/main/res/mipmap-*/` (and iOS if used).
- [ ] **Device:** Uninstall app on phone, then reinstall so the home screen and app drawer show your icon (not Flutter default).

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

## 4. Privacy Policy (required for Play Store)

- [ ] **URL:** Set `AppLinks.privacyPolicy` in `lib/core/constants/app_links.dart` to your live Privacy Policy URL (e.g. GitHub: replace `REPO_OWNER` with your username, or use GitHub Pages).
- [ ] **Content:** Policy is in `namaz_vakitleri_flutter/docs/PRIVACY_POLICY.md` and includes the required sentence: *"We use your location data solely to calculate prayer times and Qibla direction locally on your device. This data is not transmitted to external servers for tracking purposes."*
- [ ] **Store listing:** Add the same URL in Google Play Console under App content → Privacy policy.

## 5. Deployment

- [ ] **Android:** `flutter build apk` or `flutter build appbundle` from `namaz_vakitleri_flutter`; sign with your keystore.
- [ ] **Release run:** `flutter run --release` (or install built APK/AAB) and smoke-check.
