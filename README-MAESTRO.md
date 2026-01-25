# Maestro UI Testing Guide

This guide explains how to run automated UI tests using Maestro for the PrayerTime app.

## Quick Start

### Option 1: Use the Automated Script (Recommended)

Simply run:
```powershell
.\run-maestro-test.ps1
```

This script automatically:
1. Checks for connected Android device
2. Force stops the app
3. Clears app data
4. Checks if Metro bundler is running
5. Runs the Maestro test

### Option 2: Manual Steps

If you prefer to run steps manually:

1. **Ensure Metro bundler is running:**
   ```powershell
   npx expo start
   ```
   Wait until you see "Metro waiting on..."

2. **Clear app data:**
   ```powershell
   .\clear-app-data.ps1
   ```

3. **Run the test:**
   ```powershell
   C:\Users\abdul\maestro\bin\maestro.bat test .maestro\smoke_test.yaml
   ```

## Prerequisites

1. **Android Emulator or Physical Device**
   - Must be running and connected
   - Verify with: `adb devices`

2. **Metro Bundler**
   - Must be running before tests
   - Start with: `npx expo start`
   - Wait for "Metro waiting on..." message

3. **App Installed**
   - App must be installed on the device
   - Build with: `npx expo run:android`

## Common Issues

### App Doesn't Launch

**Symptoms:** Test fails immediately, app doesn't open

**Solutions:**
1. Ensure Metro bundler is running and ready
2. Clear app data: `.\clear-app-data.ps1`
3. Wait a few seconds after clearing before running test
4. If using development build, ensure it's up to date: `npx expo run:android`

### "App react context shouldn't be created before" Error

**Cause:** Expo Dev Launcher issue when launching app programmatically

**Solutions:**
1. Fully stop the app: `adb shell am force-stop com.namazvakitleri.family`
2. Clear app data: `adb shell pm clear com.namazvakitleri.family`
3. Wait 2-3 seconds
4. Ensure Metro is ready before launching
5. Try rebuilding the app: `npx expo run:android`

### Test Stuck on Developer Menu

**Solution:** The test now automatically dismisses the developer menu. If it still gets stuck, the dialog text might have changed.

### "Konumunuz" Not Found

**Cause:** App data wasn't cleared, so onboarding was skipped

**Solution:** Always clear app data before running tests:
```powershell
.\clear-app-data.ps1
```

### "device offline" Exception at End

**Symptoms:** Test completes successfully but shows `java.io.IOException: device offline` at the end

**Explanation:** This is a cleanup/connection issue, not a test failure. Maestro loses connection to the device while closing the session.

**Solution:** 
- If all test steps show `+` (passed), the test succeeded
- If this happens frequently, try:
  1. Restart the emulator/device
  2. Restart ADB: `adb kill-server && adb start-server`
  3. Check device connection: `adb devices`

## Test Flow

The smoke test (`smoke_test.yaml`) tests the complete onboarding flow:

1. **Launch App** - Starts the app fresh
2. **Handle Dev Screens** - Dismisses Expo dev client screens
3. **Location Setup** - Searches for "Utrecht" and selects it
4. **View Mode** - Selects "Basit" (Simple) view
5. **Notifications** - Proceeds through notification settings
6. **Adhan Settings** - Completes Adhan configuration
7. **Success Screen** - Verifies completion
8. **Home Screen** - Verifies prayer times are displayed

## Scripts

- **`run-maestro-test.ps1`** - Comprehensive script that handles all prerequisites and runs the test
- **`clear-app-data.ps1`** - Clears app data only
- **`clear-app-data.bat`** - Batch version of clear script

## Tips

1. **Always use the script:** `.\run-maestro-test.ps1` handles everything automatically
2. **Check Metro first:** Ensure Metro is running before tests
3. **Rebuild if needed:** If app keeps crashing, rebuild: `npx expo run:android`
4. **Check logs:** Maestro saves test results in `C:\Users\abdul\.maestro\tests\`

## Troubleshooting

If tests consistently fail:

1. Rebuild the app: `npx expo run:android`
2. Clear app data: `.\clear-app-data.ps1`
3. Restart Metro: Stop and restart `npx expo start`
4. Check device: Ensure emulator/device is responsive
5. Check Maestro logs: Look in `C:\Users\abdul\.maestro\tests\[timestamp]`
