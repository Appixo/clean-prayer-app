# Run Flutter when it's not on PATH.
# 1. Set $FlutterBinPath below to your Flutter bin folder (e.g. C:\flutter\bin).
# 2. Run: .\scripts\run_flutter.ps1 <command> [args...]
#    Example: .\scripts\run_flutter.ps1 pub get
#             .\scripts\run_flutter.ps1 create . --org com.namazvakitleri.family --project-name namaz_vakitleri_flutter

$FlutterBinPath = "C:\flutter\bin"   # <-- Change this to your Flutter bin path

$flutterExe = Join-Path $FlutterBinPath "flutter.bat"
if (-not (Test-Path $flutterExe)) {
    Write-Host "Flutter not found at: $FlutterBinPath"
    Write-Host "Edit this script and set `$FlutterBinPath to your Flutter bin folder (e.g. C:\src\flutter\bin)."
    Write-Host "See docs\FLUTTER_PATH_SETUP.md for install and PATH instructions."
    exit 1
}

& $flutterExe @args
