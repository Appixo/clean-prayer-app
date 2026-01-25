# Namaz Vakitleri (Clean Prayer) 🕌

A privacy-focused, offline-first prayer times application built with **React Native** and **Expo**. Designed to be lightweight, ad-free, and respectful of user data.

## 🚀 Features

*   **100% Offline Calculation:** Uses `adhan-js` for astronomical precision without needing an internet connection for daily use.
*   **Privacy First:** No tracking, no analytics, no ads. Location data stays on the device.
*   **Smart Location Search:** Integrates with OpenStreetMap (Nominatim) to find cities, districts, and provinces with "Type-Ahead" precision.
*   **Ramadan Ready:** Explicit "Imsak / Sabah" distinction for fasting.
*   **Audio Engine:** Custom Notification Channels with high-priority Adhan audio playback.
*   **Localized:** Full support for English and Turkish (Türkçe), including grammar-aware date formatting.
*   **Battery Optimized:** Efficient countdown timers and background notification scheduling.

## 🛠 Tech Stack

*   **Framework:** React Native (Expo SDK 54)
*   **Language:** TypeScript
*   **Styling:** NativeWind (Tailwind CSS)
*   **Navigation:** Expo Router
*   **Storage:** MMKV (High-performance synchronous storage)
*   **Audio:** Expo AV
*   **Notifications:** Expo Notifications

## 📱 Installation

This project is built with Expo. To run it locally:

1.  Clone the repo
    ```bash
    git clone https://github.com/Appixo/namaz-vakitleri.git
    ```
2.  Install dependencies
    ```bash
    npm install
    ```
3.  Start the server
    ```bash
    npx expo start
    ```

## 🧪 Testing

The project uses a **Test Pyramid**: ~80% unit/integration (Jest + React Native Testing Library) and ~20% E2E (Maestro).

### Unit & integration tests (Jest + RNTL)

- **Run all unit tests**
  ```bash
  npm test
  ```
  or
  ```bash
  npm run test:unit
  ```

- **Watch mode** (re-run on file changes)
  ```bash
  npm run test:watch
  ```

- **Coverage report**
  ```bash
  npm run test:coverage
  ```

Tests live in `__tests__/`. The setup is in `jest.setup.ts` (mocks for NativeWind, Expo Router, native modules). There are no console warnings from NativeWind or Reanimated when tests pass.

### E2E tests (Maestro)

Maestro is used for flow tests on Android (New Architecture–friendly). The flow covers: **app launch**, **system location/permission dialogs**, **home screen**, and **navigation to Settings → About**.

**Prerequisites**

1. Android emulator or physical device connected
2. Metro running: `npx expo start` (wait until it’s ready)
3. App installed: `npx expo run:android`
4. App data cleared (for a “fresh install” run):  
   `adb shell pm clear com.namazvakitleri.family`

**Run Maestro locally**

- With Maestro CLI installed:
  ```bash
  maestro test .maestro/smoke-test.yaml
  ```
  or the full flow:
  ```bash
  maestro test .maestro/smoke_test.yaml
  ```

- Via npm script (if configured):
  ```bash
  npm run test:e2e
  ```

Flow files:

- `.maestro/smoke-test.yaml` — Launch, permission, home, Settings, About
- `.maestro/smoke_test.yaml` — Full onboarding + home + Settings + About

## 📸 Screenshots

| Home (Light) | Search (Dark) | Settings |
|:---:|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* | *(Add your screenshot here)* |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.