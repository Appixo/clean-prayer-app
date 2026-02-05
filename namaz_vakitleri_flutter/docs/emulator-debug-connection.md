# Android Emulator: "Error connecting to the service protocol"

## Problem

When running `flutter run` on an Android emulator you may see:

```
Error connecting to the service protocol: failed to connect to http://127.0.0.1:xxxxx/...
WebSocketChannelException: SocketException: The remote computer refused the network connection
```

The app builds and installs successfully, but the debugger (hot reload, DevTools) cannot connect to the VM service.

## What we do in code

Heavy plugin init (notifications, Adhan, workmanager) is deferred: it runs **5 seconds after the first frame** so the VM service has time to accept the debug connection before native plugins run. See `lib/main.dart` → `addPostFrameCallback` + `Future.delayed(5 seconds)`.

## If it still happens

1. **Use a physical device** – The most reliable fix. Run `flutter run` with the phone connected via USB (USB debugging enabled). The VM service connection is much more stable on real devices.
2. **Try without Impeller** – Run: `flutter run --no-enable-impeller`
3. **Cold boot the emulator** – In AVD Manager, use "Cold Boot Now" and run again.
4. **Retry** – Sometimes the connection succeeds on a second `flutter run`.
5. **Run without debugging** – To confirm the app works: `flutter run --release` or install the debug APK and open it manually (no hot reload, but no VM connection needed).
