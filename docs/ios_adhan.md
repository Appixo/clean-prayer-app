# iOS Adhan Implementation Plan

## Problem Statement
iOS restricts background execution time to 30 seconds for standard notifications. Audio playback is killed when the app suspends. To support full Adhan playback (e.g., 3-5 minutes), we must use a **Notification Service Extension** or a **Background Audio Mode** workaround.

## Requirement: Notification Service Extension
A Notification Service Extension allows modifying the content of a remote (or local) notification before it is displayed. This is the standard way to attach rich media or handle decryption.
However, extending playback time is better handled by:
1.  **Notification Content Extension**: For custom UI.
2.  **App Group**: Sharing data (MMKV) between App and Extension.

**Alternatively (Recommended for Playback):**
Using `expo-av` with `UIBackgroundModes` -> `audio`.
- **Constraint**: Apple Store requires "Audio" apps to be primary audio apps. A prayer app *playing adhan* counts, but we must ensure we setup the Audio Session correctly (`AVAudioSessionCategoryPlayback`).

## Proposed Architecture (Mac Required)

### 1. Xcode Configuration
Must add a new Target: `NotificationServiceExtension`.
- File: `NotificationService.swift`
- Info.plist: `NSExtensionPointIdentifier` = `com.apple.usernotifications.service`

### 2. Audio Handling
In `NotificationService.swift`:
```swift
override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    // 1. Load sound file from App Group or Bundle
    // 2. Attach to notification or Play using AVAudioPlayer (if permission granted)
    
    contentHandler(bestAttemptContent!)
}
```

### 3. Implementation Steps
1.  **Eject** or use **Unimodules** locally on Mac.
2.  Open `ios/PrayerTime.xcworkspace`.
3.  Add Target -> Notification Service Extension.
4.  Configure App Groups (`group.com.yourname.prayertime`) to share settings (Adhan URL).

## Why Deferred?
This requires an OS X environment to build and sign the extension correctly. Developing this blindly on Windows via Config Plugins is high-risk.
