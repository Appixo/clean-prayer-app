# Immediate Action Plan – Run This First

Because the project was created without the Flutter CLI, run these steps **in order** so the native Android/iOS wrappers and assets are correct.

**If you see "flutter is not recognized":** install Flutter or add it to PATH first – see [FLUTTER_PATH_SETUP.md](FLUTTER_PATH_SETUP.md). You can also use `scripts\run_flutter.ps1` (set the Flutter path inside the script) to run Flutter without changing PATH.

---

## Step 1: Repair the Native Foundation

Open a terminal in the `namaz_vakitleri_flutter` folder (with Flutter on your PATH) and run:

```bash
# 1. Regenerate the native platform folders safely (keeps your Dart code)
flutter create . --org com.namazvakitleri.family --project-name namaz_vakitleri_flutter

# 2. Install dependencies
flutter pub get
```

---

## Step 2: Asset Setup

The following folders and `pubspec.yaml` entries are already in place:

- `assets/images/` – add `qibla_compass.png` and `qibla_needle.png` (or leave empty until you implement the Qibla compass UI).
- `assets/audio/` – add `adhan_fajr.mp3` (and other Adhan clips) for notifications/playback.
- `assets/sounds/` – optional duplicate location for sounds.
- `assets/translations/` – optional ARB/JSON for i18n (tr, en, nl, ar).

**Action:** Add real image and audio files to these folders so the app does not crash when those features are used. Until then, avoid loading these paths in code if the files are missing.

---

## Step 3: Verify Permissions (The "Glue")

After Step 1, Flutter will have created `android/` and `ios/`. Either run the helper script (PowerShell) or add the snippets below manually.

**Option A – Script (recommended):**

```powershell
.\scripts\add_permissions_after_flutter_create.ps1
```

**Option B – Manual:** Add or confirm the following in the generated files.

### A. Android – `android/app/src/main/AndroidManifest.xml`

Ensure these permissions exist **before** the `<application>` tag:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### B. iOS – `ios/Runner/Info.plist`

Ensure these keys are present:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to calculate accurate prayer times and Qibla direction.</string>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

---

## Step 4: Smoke Test

Run unit tests to confirm logic and state:

```bash
flutter test
```

If this passes, calculations, BDD logic, and state management are in good shape.

---

## Step 5: Launch

Run on a device or emulator:

```bash
flutter run
```

---

## Summary

| Component   | Status   | Note |
|------------|----------|------|
| Logic      | Done     | adhan_dart, Blocs, Repos implemented. |
| UI         | Skeleton | Home, Qibla, Settings, About exist; may need styling. |
| Widgets    | Pending  | WidgetBridge is ready; native Android XML per `home_widget_setup.md`. |
| Audio      | Pending  | Add real `.mp3` files under `assets/audio/` (and/or `assets/sounds/`). |
| Permissions| After Step 1 | Add snippets above to the generated AndroidManifest and Info.plist. |

Run **Step 1** first so Flutter generates the correct native scaffolding.
