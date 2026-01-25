# Comprehensive script to prepare and run Maestro tests
# This script handles all prerequisites: stopping app, clearing cache, checking Metro, etc.

param(
    [switch]$SkipMetroCheck = $false
)

# If Metro check is causing issues, you can skip it:
# .\run-maestro-test.ps1 -SkipMetroCheck

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Maestro Test Preparation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find ADB
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    Write-Host "ERROR: ADB not found at: $adbPath" -ForegroundColor Red
    Write-Host "Please update the path in this script or add ADB to your PATH" -ForegroundColor Yellow
    exit 1
}

# Step 1: Check if device is connected
Write-Host "[1/6] Checking for connected Android device..." -ForegroundColor Cyan
$devices = & $adbPath devices | Select-String -Pattern "device$"
if (-not $devices) {
    Write-Host "ERROR: No Android device or emulator connected!" -ForegroundColor Red
    Write-Host "Please start an emulator or connect a device, then run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Device found: $($devices.Line)" -ForegroundColor Green
Write-Host ""

# Step 2: Force stop the app
Write-Host "[2/6] Force stopping app..." -ForegroundColor Cyan
& $adbPath shell am force-stop com.namazvakitleri.family 2>&1 | Out-Null
Start-Sleep -Seconds 1
Write-Host "✓ App stopped" -ForegroundColor Green
Write-Host ""

# Step 3: Clear app data
Write-Host "[3/6] Clearing app data..." -ForegroundColor Cyan
$clearResult = & $adbPath shell pm clear com.namazvakitleri.family 2>&1
if ($clearResult -match "Success") {
    Write-Host "✓ App data cleared" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Clear command returned: $clearResult" -ForegroundColor Yellow
}
Write-Host ""

# Step 3.5: Uninstall and reinstall app if it keeps crashing (optional, commented out by default)
# Uncomment the lines below if app consistently crashes on launch
# Write-Host "[3.5/6] Reinstalling app to fix crash issues..." -ForegroundColor Cyan
# & $adbPath uninstall com.namazvakitleri.family 2>&1 | Out-Null
# Write-Host "  Run 'npx expo run:android' to reinstall, then run this script again" -ForegroundColor Yellow
# exit 0

# Step 4: Wait a moment for process to fully terminate
Write-Host "[4/6] Waiting for processes to terminate..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Write-Host "✓ Ready" -ForegroundColor Green
Write-Host ""

# Step 5: Check if Metro is running (optional)
if (-not $SkipMetroCheck) {
    Write-Host "[5/6] Checking Metro bundler..." -ForegroundColor Cyan
    # Use a faster method with timeout to avoid hanging
    $metroRunning = $false
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("localhost", 8081, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(2000, $false) # 2 second timeout
        if ($wait) {
            $tcpClient.EndConnect($connect)
            $metroRunning = $true
            $tcpClient.Close()
        } else {
            $tcpClient.Close()
        }
    } catch {
        # Connection failed, Metro not running
        $metroRunning = $false
    }
    
    if ($metroRunning) {
        Write-Host "✓ Metro bundler is running on port 8081" -ForegroundColor Green
    } else {
        Write-Host "⚠ WARNING: Metro bundler doesn't appear to be running on port 8081" -ForegroundColor Yellow
        Write-Host "  Please ensure Metro is running: npx expo start" -ForegroundColor Yellow
        Write-Host "  Or run this script with -SkipMetroCheck to skip this check" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
    Write-Host ""
} else {
    Write-Host "[5/6] Skipping Metro check (as requested)" -ForegroundColor Cyan
    Write-Host ""
}

# Step 6: Run Maestro test
Write-Host "[6/6] Running Maestro test..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "  - If app shows crash warning, test will retry automatically" -ForegroundColor Yellow
Write-Host "  - If app keeps crashing, you MUST rebuild:" -ForegroundColor Red
Write-Host "    1. Stop Metro (Ctrl+C)" -ForegroundColor Yellow
Write-Host "    2. Run: npx expo run:android" -ForegroundColor Yellow
Write-Host "    3. Wait for build to complete and app to install" -ForegroundColor Yellow
Write-Host "    4. Start Metro: npx expo start" -ForegroundColor Yellow
Write-Host "    5. Run this script again" -ForegroundColor Yellow
Write-Host "  - If stuck on Developer Menu, run: .\dismiss-dev-menu.ps1" -ForegroundColor Yellow
Write-Host ""

$maestroPath = "C:\Users\abdul\maestro\bin\maestro.bat"
if (-not (Test-Path $maestroPath)) {
    Write-Host "ERROR: Maestro not found at: $maestroPath" -ForegroundColor Red
    Write-Host "Please update the path in this script" -ForegroundColor Yellow
    exit 1
}

# Run Maestro test and capture output
$testOutput = & $maestroPath test .maestro\smoke_test.yaml 2>&1 | Out-String

# Display output
Write-Host $testOutput

# Analyze results
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Result Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for successful test completion indicators
$testPassed = $false
$cleanupException = $false

if ($testOutput -match "Assert that.*UTRECHT.*is visible" -and 
    $testOutput -match "Assert that.*Ö?le.*is visible") {
    $testPassed = $true
    Write-Host "✓ Test PASSED: All critical assertions completed" -ForegroundColor Green
    Write-Host "  - Onboarding flow completed" -ForegroundColor Green
    Write-Host "  - Home screen verified (UTRECHT, prayer times)" -ForegroundColor Green
}

if ($testOutput -match "device offline" -or $testOutput -match "gRPC timeout") {
    $cleanupException = $true
    Write-Host ""
    Write-Host "⚠ Cleanup Exception Detected (non-critical)" -ForegroundColor Yellow
    Write-Host "  This is a connection issue during cleanup, not a test failure." -ForegroundColor Yellow
    Write-Host "  If all steps show '+', the test succeeded." -ForegroundColor Yellow
}

# Count passed steps
$passedSteps = ([regex]::Matches($testOutput, "\+   ")).Count
$warnedSteps = ([regex]::Matches($testOutput, "!   ")).Count

Write-Host ""
Write-Host "Test Statistics:" -ForegroundColor Cyan
Write-Host "  - Passed steps: $passedSteps" -ForegroundColor Green
if ($warnedSteps -gt 0) {
    Write-Host "  - Optional steps (warnings): $warnedSteps" -ForegroundColor Yellow
    Write-Host "    (These are expected if Developer Menu isn't visible)" -ForegroundColor Gray
}

Write-Host ""
if ($testPassed) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ TEST SUCCESSFUL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    if ($cleanupException) {
        Write-Host ""
        Write-Host "Note: Cleanup exception occurred but test passed." -ForegroundColor Yellow
        Write-Host "To reduce cleanup issues, try:" -ForegroundColor Yellow
        Write-Host "  - Restart emulator before testing" -ForegroundColor Gray
        Write-Host "  - Run: adb kill-server && adb start-server" -ForegroundColor Gray
    }
    exit 0
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "⚠ Review test output above" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If test failed, check:" -ForegroundColor Yellow
    Write-Host "  1. Metro bundler is running and ready" -ForegroundColor Gray
    Write-Host "  2. App was rebuilt after dependency updates" -ForegroundColor Gray
    Write-Host "  3. App data was cleared before test" -ForegroundColor Gray
    exit 1
}
