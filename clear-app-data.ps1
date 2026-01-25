# PowerShell script to clear app data before running Maestro tests
# Usage: .\clear-app-data.ps1

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
    Write-Host "ADB not found at: $adbPath" -ForegroundColor Red
    Write-Host "Please update the path in this script or add ADB to your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "Stopping app..." -ForegroundColor Cyan
& $adbPath shell am force-stop com.namazvakitleri.family

Write-Host "Clearing app data..." -ForegroundColor Cyan
& $adbPath shell pm clear com.namazvakitleri.family

Write-Host "App data cleared successfully!" -ForegroundColor Green
Write-Host "You can now run the Maestro test." -ForegroundColor Green
