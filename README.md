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

## 📸 Screenshots

| Home (Light) | Search (Dark) | Settings |
|:---:|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* | *(Add your screenshot here)* |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.