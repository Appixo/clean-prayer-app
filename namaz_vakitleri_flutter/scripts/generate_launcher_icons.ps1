# Generate launcher icons from pubspec.yaml (image_path: assets/images/splash.png).
# Uses same Flutter path as run_flutter.ps1. Run from repo root or namaz_vakitleri_flutter.
# After running: rebuild app and uninstall then reinstall on device so the new icon shows.

$FlutterBinPath = "C:\flutter\bin"   # <-- Change if your Flutter is elsewhere (same as run_flutter.ps1)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

$dartExe = Join-Path $FlutterBinPath "dart.bat"
if (-not (Test-Path $dartExe)) {
    Write-Host "Dart/Flutter not found at: $FlutterBinPath"
    Write-Host "Edit this script and set `$FlutterBinPath to your Flutter bin folder."
    exit 1
}

Write-Host "Generating launcher icons from pubspec.yaml (image_path: assets/images/splash.png)..."
& $dartExe run flutter_launcher_icons
if ($LASTEXITCODE -ne 0) {
    Write-Host "Icon generation failed. Run 'flutter pub get' first if needed."
    exit $LASTEXITCODE
}
Write-Host "Done. Rebuild the app and uninstall then reinstall on device to see the new icon."
exit 0
