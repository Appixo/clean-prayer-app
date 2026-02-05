# Flutter not in PATH – Fix

If you see **"The term 'flutter' is not recognized"** in PowerShell, Flutter is either not installed or not on your PATH.

## Option 1: Install Flutter (if not installed)

1. **Download:** https://docs.flutter.dev/get-started/install/windows  
   Or direct: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.5-stable.zip  

2. **Extract** to a folder without spaces, e.g. `C:\flutter` or `C:\src\flutter`.

3. **Add to PATH:**  
   - Win + R → `sysdm.cpl` → Enter  
   - **Advanced** tab → **Environment Variables**  
   - Under **User variables**, select **Path** → **Edit** → **New**  
   - Add: `C:\flutter\bin` (or the folder where you extracted Flutter + `\bin`)  
   - OK out, then **close and reopen** your terminal.

4. **Verify:**
   ```powershell
   flutter --version
   ```

## Option 2: Flutter already installed – add its `bin` to PATH

If Flutter is installed but not in PATH, find the `bin` folder and add it:

- Common locations: `C:\flutter\bin`, `C:\src\flutter\bin`, `%USERPROFILE%\flutter\bin`, or inside FVM: `%USERPROFILE%\fvm\default\bin`.

Then add that path to **Path** as in Option 1, step 3.

## Option 3: Use the helper script (no PATH change)

If you know where Flutter is, you can run it via the helper script:

1. Edit `scripts\run_flutter.ps1` and set `$FlutterBinPath` to your Flutter `bin` folder (e.g. `C:\flutter\bin`).
2. From the project root run:
   ```powershell
   .\scripts\run_flutter.ps1 create . --org com.namazvakitleri.family --project-name namaz_vakitleri_flutter
   .\scripts\run_flutter.ps1 pub get
   .\scripts\run_flutter.ps1 test
   .\scripts\run_flutter.ps1 run
   ```

After Flutter is on PATH (or you use the script), continue with [IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md).

---

**"Android sdkmanager not found"?** See [ANDROID_SDK_SETUP.md](ANDROID_SDK_SETUP.md) to install the Android SDK command-line tools and run `flutter doctor --android-licenses`.
