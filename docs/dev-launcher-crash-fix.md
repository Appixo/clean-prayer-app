# Fixing Dev Launcher Crash: "App react context shouldn't be created before"

## Problem

The Expo Dev Launcher crashes on launch with:
```
java.lang.IllegalArgumentException: App react context shouldn't be created before.
```

This indicates a race condition where the React context is initialized multiple times or out of order during app launch.

## Solution Steps

### Step 1: Update Native Dependencies

Update `expo-dev-client` and related packages to the latest compatible versions:

```bash
# Update to latest compatible versions for Expo SDK 54
npx expo install expo-dev-client expo-dev-launcher

# If the above fails due to version conflicts, try:
npm install expo-dev-client@latest expo-dev-launcher@latest

# Then verify compatibility
npx expo-doctor
```

**Note**: If you encounter version conflicts, you may need to:
1. Check Expo SDK compatibility: https://docs.expo.dev/versions/
2. Update Expo SDK first: `npx expo install expo@latest`
3. Then update dev client packages

### Step 2: Clean Build Artifacts

Before rebuilding, clean all build artifacts:

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Remove node_modules and reinstall (if dependency issues persist)
# rm -rf node_modules package-lock.json
# npm install
```

### Step 3: Rebuild Native Binary

Since `expo-dev-client` contains native code, you **must** rebuild:

#### Option A: Local Development Build (Recommended for Testing)

```bash
# Rebuild Android development build
npx expo run:android

# This will:
# - Compile native code with updated dependencies
# - Install the new APK on connected device/emulator
# - Start Metro bundler automatically
```

**Important**: Wait for Metro to fully start (you'll see "Metro waiting on...") before running Maestro tests.

#### Option B: EAS Development Build (For CI/CD or Production-like Testing)

```bash
# Build with EAS (requires EAS account)
eas build --profile development --platform android

# After build completes, install on device:
# Download APK from EAS dashboard or use:
adb install path/to/build.apk
```

### Step 4: Verify Fix

1. **Start Metro bundler** (if not already running):
   ```bash
   npx expo start
   ```

2. **Wait 10-15 seconds** after Metro shows "Metro waiting on..." to ensure it's fully ready

3. **Clear app data**:
   ```bash
   adb shell pm clear com.namazvakitleri.family
   ```

4. **Run Maestro test**:
   ```bash
   maestro test .maestro/smoke_test.yaml
   ```

## Prevention

To avoid this issue in the future:

1. **Always rebuild** after updating native dependencies (`expo-dev-client`, `expo-dev-launcher`, etc.)
2. **Wait for Metro** to be fully ready before launching the app
3. **Clear app data** before running tests to ensure clean state
4. **Keep dependencies updated** - check for Expo SDK updates regularly

## Troubleshooting

### If crash persists after rebuild:

1. **Check Metro logs** for other errors
2. **Try a production build** instead of development build:
   ```bash
   npx expo run:android --variant release
   ```
3. **Check Expo SDK version compatibility**:
   ```bash
   npx expo-doctor
   ```
4. **Review Expo GitHub issues**: Search for "App react context shouldn't be created before" in expo-dev-client issues

### If Maestro test still fails:

1. **Verify Metro is running**: Check terminal for "Metro waiting on..."
2. **Check device logs**: `adb logcat | grep -i "react\|expo\|crash"`
3. **Manually test app launch**: Open app manually and verify it loads
4. **Use dismiss-dev-menu.ps1**: If stuck on Developer Menu

## Related Files

- `.maestro/smoke_test.yaml` - Updated with better launch sequence
- `run-maestro-test.ps1` - Automated test runner with pre-checks
- `dismiss-dev-menu.ps1` - Manual Developer Menu dismissal
