# Script to dismiss Expo Developer Menu using ADB
# This can be run manually if the test gets stuck on Developer Menu

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
    Write-Host "ERROR: ADB not found at: $adbPath" -ForegroundColor Red
    exit 1
}

Write-Host "Dismissing Developer Menu..." -ForegroundColor Cyan

# Send back button press multiple times to exit dev menu
& $adbPath shell input keyevent KEYCODE_BACK
Start-Sleep -Milliseconds 500
& $adbPath shell input keyevent KEYCODE_BACK
Start-Sleep -Milliseconds 500
& $adbPath shell input keyevent KEYCODE_BACK

Write-Host "Done. Try running the test again." -ForegroundColor Green
