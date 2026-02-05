# Run this script AFTER "flutter create . --org com.namazvakitleri.family --project-name namaz_vakitleri_flutter"
# It adds required permissions to AndroidManifest.xml and Info.plist.
# Usage: .\scripts\add_permissions_after_flutter_create.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# --- Android: ensure permissions exist before <application> ---
$manifestPath = Join-Path $root "android\app\src\main\AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $content = Get-Content $manifestPath -Raw
    if ($content -notmatch "ACCESS_FINE_LOCATION") {
        $permissions = @"

    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
"@
        $content = $content -replace '(<manifest[^>]*>)', "`$1$permissions"
        Set-Content -Path $manifestPath -Value $content.TrimEnd() -NoNewline:$false
        Write-Host "Added Android permissions to AndroidManifest.xml"
    } else {
        Write-Host "Android permissions already present in AndroidManifest.xml"
    }
} else {
    Write-Warning "AndroidManifest.xml not found at $manifestPath - run 'flutter create .' first."
}

# --- iOS: ensure NSLocationWhenInUseUsageDescription and UIBackgroundModes exist ---
$plistPath = Join-Path $root "ios\Runner\Info.plist"
if (Test-Path $plistPath) {
    $plist = Get-Content $plistPath -Raw
    $insert = ""
    if ($plist -notmatch "NSLocationWhenInUseUsageDescription") {
        $insert += "	<key>NSLocationWhenInUseUsageDescription</key>`n	<string>We need your location to calculate accurate prayer times and Qibla direction.</string>`n"
    }
    if ($plist -notmatch "UIBackgroundModes") {
        $insert += "	<key>UIBackgroundModes</key>`n	<array>`n		<string>fetch</string>`n		<string>remote-notification</string>`n	</array>`n"
    }
    if ($insert -ne "") {
        $plist = $plist -replace '(<dict>\s*)', "<dict>`n$insert"
        Set-Content -Path $plistPath -Value $plist -NoNewline:$false
        Write-Host "Added iOS keys to Info.plist"
    } else {
        Write-Host "iOS keys already present in Info.plist"
    }
} else {
    Write-Warning "Info.plist not found at $plistPath - run 'flutter create .' first."
}

Write-Host "Done. Run: flutter pub get && flutter test && flutter run"
