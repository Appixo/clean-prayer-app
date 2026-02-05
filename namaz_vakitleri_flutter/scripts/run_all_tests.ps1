# BDD and E2E test runner. Runs unit tests and Maestro E2E, saves logs, screenshots, recordings.
# Usage: .\scripts\run_all_tests.ps1
#        .\scripts\run_all_tests.ps1 -TestType e2e
#        .\scripts\run_all_tests.ps1 -OutputBase C:\temp\prayer_test_results

param(
    [ValidateSet("all", "unit", "e2e")]
    [string]$TestType = "all",
    [string]$OutputBase = "test_results",
    [bool]$SkipE2EIfNoDevice = $true
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutputDir = Join-Path $OutputBase $Timestamp
$LogsDir = Join-Path $OutputDir "logs"
$ScreenshotsDir = Join-Path $OutputDir "screenshots"
$RecordingsDir = Join-Path $OutputDir "recordings"

# Ensure output structure
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ScreenshotsDir | Out-Null
New-Item -ItemType Directory -Force -Path $RecordingsDir | Out-Null

$UnitLogPath = Join-Path $LogsDir "unit_test.log"
$E2ELogPath = Join-Path $LogsDir "e2e_maestro.log"

$UnitPassed = $null
$E2EPassed = $null
$UnitDurationMs = 0
$E2EDurationMs = 0

Write-Host "Test output: $OutputDir" -ForegroundColor Cyan
Write-Host ""

# --- Unit tests ---
if ($TestType -eq "all" -or $TestType -eq "unit") {
    Write-Host "[1/2] Running unit tests (flutter test)..." -ForegroundColor Yellow
    $UnitStart = Get-Date
    try {
        Push-Location $ProjectRoot
        $unitOutput = & flutter test 2>&1
        $UnitPassed = $LASTEXITCODE -eq 0
        $unitOutput | Tee-Object -FilePath $UnitLogPath
        if (-not $UnitPassed) {
            Write-Host "Unit tests FAILED" -ForegroundColor Red
        } else {
            Write-Host "Unit tests PASSED" -ForegroundColor Green
        }
    } catch {
        $UnitPassed = $false
        "Error: $_" | Out-File -FilePath $UnitLogPath
        Write-Host "Unit tests FAILED: $_" -ForegroundColor Red
    } finally {
        Pop-Location
        $UnitDurationMs = [int]((Get-Date) - $UnitStart).TotalMilliseconds
    }
    Write-Host ""
}

# --- E2E tests (Maestro) ---
if ($TestType -eq "all" -or $TestType -eq "e2e") {
    Write-Host "[2/2] Running E2E tests (Maestro)..." -ForegroundColor Yellow
    $E2EStart = $null

    # Resolve adb path (try PATH, then Android SDK locations)
    $adbExe = $null
    if (Get-Command adb -ErrorAction SilentlyContinue) {
        $adbExe = "adb"
    } else {
        $sdkPaths = @(
            $env:ANDROID_HOME,
            $env:ANDROID_SDK_ROOT,
            (Join-Path $env:LOCALAPPDATA "Android\Sdk")
        ) | Where-Object { $_ }
        foreach ($sdk in $sdkPaths) {
            $candidate = Join-Path $sdk "platform-tools\adb.exe"
            if (Test-Path $candidate) {
                $adbExe = $candidate
                break
            }
        }
    }

    # Check for device
    $hasDevice = $false
    $adbOutput = ""
    if ($adbExe) {
        try {
            $adbOutput = & $adbExe devices 2>&1 | Out-String
            $deviceLines = $adbOutput -split "`n" | Where-Object { $_ -match "^\S+\s+device\s*$" }
            $hasDevice = $deviceLines.Count -gt 0
        } catch {
            $adbOutput = "adb failed: $_"
            $hasDevice = $false
        }
    } else {
        $adbOutput = "adb not found in PATH or Android SDK. Add platform-tools to PATH or set ANDROID_HOME."
        $hasDevice = $false
    }

    if (-not $hasDevice -and $SkipE2EIfNoDevice) {
        Write-Host "No Android device/emulator detected. Skipping E2E (use -SkipE2EIfNoDevice `$false to run anyway)." -ForegroundColor Yellow
        if ($adbOutput) {
            Write-Host "adb devices output:" -ForegroundColor Gray
            Write-Host $adbOutput.Trim() -ForegroundColor Gray
            if ($adbOutput -match "unauthorized") {
                Write-Host "Tip: Accept 'Allow USB debugging?' on your phone." -ForegroundColor Cyan
            } elseif ($adbOutput -match "offline") {
                Write-Host "Tip: Unplug and replug the USB cable, or run 'adb kill-server' then 'adb start-server'." -ForegroundColor Cyan
            } elseif ($adbOutput -match "not found|not recognized") {
                Write-Host "Tip: Add Android SDK platform-tools to PATH (e.g. C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools)." -ForegroundColor Cyan
            }
        }
        $E2EPassed = $null  # Skipped
        "E2E skipped: no device`n`nadb output:`n$adbOutput" | Out-File -FilePath $E2ELogPath
    } else {
        # Resolve Maestro (try PATH, then common install locations)
        $maestroExe = $null
        try {
            $null = & maestro --version 2>&1
            $maestroExe = "maestro"
        } catch {
            $maestroExe = $null
        }
        if (-not $maestroExe) {
            $maestroPaths = @(
                (Join-Path $env:USERPROFILE "maestro\bin\maestro.bat"),
                (Join-Path $env:LOCALAPPDATA "maestro\bin\maestro.bat"),
                "C:\maestro\bin\maestro.bat"
            )
            foreach ($p in $maestroPaths) {
                if (Test-Path $p) {
                    $maestroExe = $p
                    break
                }
            }
        }

        if (-not $maestroExe) {
            Write-Host "Maestro not found on PATH." -ForegroundColor Red
            Write-Host "Install (Windows):" -ForegroundColor Gray
            Write-Host "  1. Download https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip" -ForegroundColor Gray
            Write-Host "  2. Extract to e.g. C:\Users\$env:USERNAME\maestro" -ForegroundColor Gray
            Write-Host "  3. Add maestro\bin to PATH: setx PATH `"%PATH%;C:\Users\$env:USERNAME\maestro\bin`"" -ForegroundColor Gray
            Write-Host "  4. Restart terminal, then run this script again." -ForegroundColor Gray
            $E2EPassed = $false
            "Maestro not found" | Out-File -FilePath $E2ELogPath
        } else {
            $E2EStart = Get-Date
            try {
                Push-Location $ProjectRoot
                $e2eArgs = @(
                    "test",
                    ".maestro/smoke_test_flutter.yaml",
                    ".maestro/production_check.yaml",
                    "--test-output-dir=$OutputDir"
                )
                $e2eOutput = & $maestroExe @e2eArgs 2>&1
                $E2EPassed = $LASTEXITCODE -eq 0
                $e2eOutput | Tee-Object -FilePath $E2ELogPath
                if (-not $E2EPassed) {
                    Write-Host "E2E tests FAILED" -ForegroundColor Red
                    $artifactsDir = Get-ChildItem $OutputDir -Directory -Filter "20*" -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($artifactsDir) {
                        $artPath = $artifactsDir.FullName
                        Write-Host "Detailed artifacts: $artPath" -ForegroundColor Gray
                        Write-Host "  - Failure screenshots: screenshot-*.png" -ForegroundColor Gray
                        Write-Host "  - Step-by-step: commands-*.json" -ForegroundColor Gray
                        Write-Host "  - Logs: logs\e2e_maestro.log" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "E2E tests PASSED" -ForegroundColor Green
                }
            } catch {
                $E2EPassed = $false
                "Error: $_" | Out-File -FilePath $E2ELogPath -Append
                Write-Host "E2E tests FAILED: $_" -ForegroundColor Red
            } finally {
                Pop-Location
                if ($null -ne $E2EStart) {
                    $E2EDurationMs = [int]((Get-Date) - $E2EStart).TotalMilliseconds
                }
            }
        }
    }
    Write-Host ""
}

# --- Run summary ---
$OverallPassed = $true
if ($UnitPassed -eq $false) { $OverallPassed = $false }
if ($E2EPassed -eq $false) { $OverallPassed = $false }

$Summary = @{
    timestamp = $Timestamp
    testType = $TestType
    unitPassed = $UnitPassed
    e2ePassed = $E2EPassed
    unitDurationMs = $UnitDurationMs
    e2eDurationMs = $E2EDurationMs
    outputDir = $OutputDir
    logs = @{
        unit = $UnitLogPath
        e2e = $E2ELogPath
    }
    overallPassed = $OverallPassed
} | ConvertTo-Json -Depth 4

$SummaryPath = Join-Path $OutputDir "run_summary.json"
$Summary | Out-File -FilePath $SummaryPath -Encoding utf8

Write-Host "Summary: $SummaryPath" -ForegroundColor Cyan
if ($OverallPassed) {
    Write-Host "All tests PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests FAILED" -ForegroundColor Red
    exit 1
}
