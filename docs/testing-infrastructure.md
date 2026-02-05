# Testing Infrastructure (Flutter)

## Overview

This project uses:

- **Flutter test (unit / widget / logic):** Prayer calculation, BLoC state, widget behavior.
- **Maestro (E2E):** UI flows on Android (launch, permissions, home, Settings, About) with screenshots and recordings.
- **BDD feature files:** Gherkin specs in `test_driver/features/` document E2E scenarios; Maestro flows implement them.

## Quick start

### Run all tests (recommended)

From `namaz_vakitleri_flutter`:

```powershell
.\scripts\run_all_tests.ps1
```

Or via cmd: `.\scripts\run_all_tests.cmd`

Output is saved to `test_results/<timestamp>/` with:
- `logs/unit_test.log` – Flutter test output
- `logs/e2e_maestro.log` – Maestro output
- `screenshots/` – Maestro takeScreenshot outputs
- `recordings/` – Maestro startRecording/stopRecording outputs
- `run_summary.json` – Pass/fail, durations, paths

**Options:**
- `-TestType e2e` – E2E only (skip unit)
- `-TestType unit` – Unit only (skip E2E)
- `-OutputBase C:\temp\results` – Custom output base
- `-SkipE2EIfNoDevice $false` – Run E2E even without device (will fail)

### Unit / widget / logic tests

From `namaz_vakitleri_flutter`:

```bash
cd namaz_vakitleri_flutter
flutter test
```

### E2E tests (Maestro)

1. Install the Flutter app on an Android device or emulator (`flutter run` or install APK).
2. From `namaz_vakitleri_flutter`:

   ```bash
   maestro test .maestro/smoke_test_flutter.yaml
   maestro test .maestro/production_check.yaml
   ```

## Test layout

- **`namaz_vakitleri_flutter/test/`** – Dart unit/widget/logic tests (`flutter test`).
- **`namaz_vakitleri_flutter/test_driver/features/`** – BDD Gherkin feature files; Maestro flows implement them (see `test_driver/features/README.md`).
- **`namaz_vakitleri_flutter/.maestro/smoke_test_flutter.yaml`** – Maestro smoke flow (launch, home, About).
- **`namaz_vakitleri_flutter/.maestro/production_check.yaml`** – Maestro production flow (onboarding, Utrecht, Settings, Dini Günler).

## When to run what

- **Before commits / in CI:** `flutter test`
- **Before releases / after UI changes:** `flutter test` and Maestro E2E from `namaz_vakitleri_flutter`.
- **After changing prayer logic:** `flutter test` (and any prayer-specific tests).

## CI

Codemagic (see `namaz_vakitleri_flutter/codemagic.yaml`) runs `flutter pub get` and `flutter test`. Ensure the workflow’s working directory is `namaz_vakitleri_flutter`. Maestro can be added as an optional step for E2E on a device/emulator.

## Troubleshooting

- **Maestro "app not found":** Install the Flutter app; app ID is `com.namazvakitleri.family`.
- **Maestro "device offline" at end:** Often a cleanup issue; if all steps passed, the run succeeded.
- **Turkish characters in logs:** Use a UTF-8 terminal (e.g. Windows Terminal) for correct display.
