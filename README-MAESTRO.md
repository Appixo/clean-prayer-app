# Maestro E2E Testing (Flutter)

This guide explains how to run Maestro UI tests for the **Flutter** Namaz Vakitleri app.

## Quick start

1. **Install and run the Flutter app** on an Android device or emulator:
   ```bash
   cd namaz_vakitleri_flutter
   flutter pub get
   flutter run
   ```
   Or install a release build: `flutter build apk` then install the APK.

2. **Run Maestro** from the Flutter app directory:
   ```bash
   cd namaz_vakitleri_flutter
   maestro test .maestro/smoke_test_flutter.yaml
   ```

## Prerequisites

- **Android device or emulator** – connected and visible to `adb devices`
- **App installed** – `com.namazvakitleri.family` (Flutter build)
- **Maestro CLI** – [Install Maestro](https://maestro.mobile.dev/getting-started/installation)

## Test flow

The smoke test (`.maestro/smoke_test_flutter.yaml`) covers:

- Launch app (clear state optional)
- Handle permission dialogs (e.g. Allow / İzin Ver)
- Assert "Namaz Vakitleri" visible
- Optional: assert prayer names (Fajr, Dhuhr, Maghrib) or Turkish labels
- Navigate to Settings → About

## Running from repo root

From the repository root:

```bash
cd namaz_vakitleri_flutter
maestro test .maestro/smoke_test_flutter.yaml
```

Maestro must be run from `namaz_vakitleri_flutter` so the YAML path and app context are correct.

## Troubleshooting

- **App not found:** Ensure the Flutter app is installed (`flutter run` or install the APK). App ID: `com.namazvakitleri.family`.
- **"device offline":** Restart ADB: `adb kill-server && adb start-server`. If all steps show passed, the run succeeded.
- **Permission / onboarding:** For a clean run, clear app data first: `adb shell pm clear com.namazvakitleri.family`, then run the test.
- **Logs:** Maestro saves results under `~/.maestro/tests/` (or your Maestro config path).
