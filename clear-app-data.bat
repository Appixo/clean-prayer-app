@echo off
REM Batch script to clear app data before running Maestro tests
REM Usage: clear-app-data.bat

set ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe

if not exist "%ADB_PATH%" (
    echo ADB not found at: %ADB_PATH%
    echo Please update the path in this script or add ADB to your PATH
    exit /b 1
)

echo Stopping app...
"%ADB_PATH%" shell am force-stop com.namazvakitleri.family

echo Clearing app data...
"%ADB_PATH%" shell pm clear com.namazvakitleri.family

echo App data cleared successfully!
echo You can now run the Maestro test.
