# Android sdkmanager not found – Fix

If **`flutter doctor --android-licenses`** says:

> Android sdkmanager not found. Update to the latest Android SDK and ensure that the cmdline-tools are installed.

Flutter needs the Android SDK **command-line tools** (which include `sdkmanager`). Do one of the following.

---

## Option A: Install via Android Studio (recommended)

1. **Install Android Studio** from https://developer.android.com/studio (if not already).
2. Open **Android Studio** → **Settings** (or **File** → **Settings** on Windows/Linux).
3. Go to **Languages & Frameworks** → **Android SDK**.
4. Open the **SDK Tools** tab.
5. Enable **Android SDK Command-line Tools (latest)** (and **Android SDK Build-Tools** if missing).
6. Click **Apply** / **OK** and wait for installation.
7. Tell Flutter where the SDK is (if needed):
   - **Settings** → **Android SDK** → note the path at the top (e.g. `C:\Users\<You>\AppData\Local\Android\Sdk`).
   - In a terminal:  
     `flutter config --android-sdk C:\Users\<You>\AppData\Local\Android\Sdk`  
     (use your actual path).
8. Run again:
   ```powershell
   flutter doctor --android-licenses
   ```
   Accept the licenses (type `y` where prompted).

---

## Option B: Install cmdline-tools only (no Android Studio)

1. **Download** the command-line tools for Windows:  
   https://developer.android.com/studio#command-tools  
   (under “Command line tools only” – e.g. `commandlinetools-win-*.zip`).

2. **Unzip** into your Android SDK folder. If you don’t have one yet, create a folder, e.g. `C:\Android\sdk`, then unzip so you have:
   ```
   C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat
   ```
   (If the zip contains a single folder like `cmdline-tools`, rename it to `latest` so the path above is correct.)

3. **Point Flutter at the SDK:**
   ```powershell
   flutter config --android-sdk C:\Android\sdk
   ```

4. **Accept licenses:**
   ```powershell
   flutter doctor --android-licenses
   ```

---

## Verify

```powershell
flutter doctor -v
```

You should see the Android toolchain and no “sdkmanager not found” error. Then you can run `flutter run` for Android.
