# Namaz Vakitleri (Clean Prayer)

A privacy-focused, offline-first prayer times application built with **Flutter**. Designed to be lightweight, ad-free, and respectful of user data.

## Features

- **100% Offline Calculation:** Uses `adhan_dart` for astronomical precision without needing an internet connection for daily use.
- **Privacy First:** No tracking, no analytics, no ads. Location data stays on the device.
- **Smart Location Search:** Integrates with OpenStreetMap (Nominatim) to find cities, districts, and provinces.
- **Ramadan Ready:** Explicit "Imsak / Sabah" distinction for fasting.
- **Audio Engine:** Adhan playback with background support (`just_audio`, `just_audio_background`).
- **Turkish-first:** Full Turkish (Türkçe) UI; Diyanet calculation method.
- **Battery Optimized:** Efficient countdown timers and background notification scheduling.

## Tech Stack

- **Framework:** Flutter (Dart)
- **Architecture:** Clean Architecture, BLoC
- **Prayer times:** adhan_dart (Diyanet/Turkey)
- **Navigation:** go_router
- **Storage:** shared_preferences
- **Notifications:** flutter_local_notifications
- **Android widgets:** home_widget

## Installation

The app lives in the [namaz_vakitleri_flutter](namaz_vakitleri_flutter) directory.

1. **Clone the repo**
   ```bash
   git clone https://github.com/Appixo/namaz-vakitleri.git
   cd namaz-vakitleri/namaz_vakitleri_flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the app**
   ```bash
   flutter run
   ```

See [namaz_vakitleri_flutter/README.md](namaz_vakitleri_flutter/README.md) for platform-specific setup (permissions, native scaffolding).

## Testing

- **Unit / widget / logic:** From `namaz_vakitleri_flutter`:
  ```bash
  cd namaz_vakitleri_flutter
  flutter test
  ```

- **E2E (Maestro):** From `namaz_vakitleri_flutter` after installing the app:
  ```bash
  cd namaz_vakitleri_flutter
  maestro test .maestro/smoke_test_flutter.yaml
  ```
  See [README-MAESTRO.md](README-MAESTRO.md) for details.

## Project layout

- **[namaz_vakitleri_flutter/](namaz_vakitleri_flutter)** – Flutter app (lib, android, ios, assets, tests, Maestro flows).
- **docs/** – Documentation (testing, release checklist, Maestro results).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
