# Testing Infrastructure Guide

## Overview

This project uses a **hybrid testing stack** to ensure both mathematical accuracy and user experience quality:

- **Jest (Unit Tests)**: Verifies prayer time calculation accuracy
- **Maestro (E2E Tests)**: Verifies complete user flows from onboarding to home screen

## Quick Start

### Run All Tests
```bash
npm run test:unit      # Run Jest unit tests
npm run test:e2e       # Run Maestro E2E tests
```

### Watch Mode (Development)
```bash
npm run test:watch     # Jest in watch mode
```

### Coverage Report
```bash
npm run test:coverage  # Generate coverage report
```

## Phase 1: Unit Tests (Jest)

### Purpose
**Mathematical Accuracy Verification** - Ensures prayer time calculations are 100% correct.

### Test File
`__tests__/prayerCalculation.test.ts`

### Test Cases

#### 1. Standard Day Calculation
- **Location**: Istanbul, Turkey
- **Date**: June 15, 2025
- **Method**: Turkey (Diyanet)
- **Verifies**:
  - All 6 prayer times are calculated
  - Times are in correct chronological order
  - Times are within expected ranges
  - Calculation is deterministic (same input = same output)

#### 2. Edge Case: Midnight Transition
- **Scenario**: After Isha, before Fajr next day
- **Verifies**:
  - Next prayer correctly switches from Isha to Fajr
  - Time until next prayer is calculated correctly
  - Tomorrow's Fajr time is properly calculated

#### 3. Configuration: Asr Method
- **Tests**: Standard vs Hanafi Asr calculation
- **Verifies**:
  - Hanafi Asr is later than Standard Asr
  - Other prayer times remain unchanged
  - Difference is within expected range (30-150 minutes)

#### 4. Different Calculation Methods
- **Tests**: Turkey vs MWL (Muslim World League)
- **Verifies**: Different methods produce different results

#### 5. High Latitude Handling
- **Location**: Oslo, Norway (high latitude)
- **Verifies**: High latitude rules prevent invalid times

### Running Unit Tests

```bash
# Run all tests
npm run test:unit

# Run specific test file
npm test __tests__/prayerCalculation.test.ts

# Run with coverage
npm run test:coverage
```

### Expected Output

```
PASS  __tests__/prayerCalculation.test.ts
  Prayer Time Calculations
    Standard Day Calculation - Istanbul, Turkey (June 15, 2025)
      ✓ should calculate correct prayer times using Turkey method
      ✓ should match expected reference values from Diyanet
    Edge Case: Midnight Transition (Isha -> Fajr)
      ✓ should correctly identify Fajr as next prayer after Isha
      ✓ should correctly switch to Fajr after midnight
    Configuration: Asr Method (Standard vs Hanafi)
      ✓ should produce different Asr times for Standard vs Hanafi methods
    ...
```

## Phase 2: E2E Tests (Maestro)

### Purpose
**User Experience Verification** - Ensures onboarding and core flows never break.

### Test File
`.maestro/smoke_test.yaml`

### Test Flow

1. **Launch**: Clear state and launch app
2. **Onboarding - Location**:
   - Assert "Konumunuz" is visible
   - Tap "Şehir Ara"
   - Input "Utrecht"
   - Tap first search result
3. **Onboarding - View Mode**:
   - Assert "Deneyim Seviyesi" is visible
   - Select "Basit"
   - Tap "Devam Et"
4. **Onboarding - Notifications**:
   - Assert "Bildirimler" is visible
   - Tap "Devam Et"
5. **Onboarding - Adhan**:
   - Assert "Ezan Sesi" is visible
   - Tap "Kurulumu Tamamla"
6. **Completion**:
   - Assert "Hazırsınız!" is visible
   - Tap "Uygulamaya Git"
7. **Home Screen Verification**:
   - Assert "UTRECHT" is visible in header
   - Assert all 5 prayer times are visible:
     - İmsak (Fajr)
     - Öğle (Dhuhr)
     - İkindi (Asr)
     - Akşam (Maghrib)
     - Yatsı (Isha)

### Running E2E Tests

```bash
# Using npm script
npm run test:e2e

# Or directly with Maestro
maestro test .maestro/smoke_test.yaml

# Using helper script (Windows)
.\run-maestro-test.ps1
```

### Prerequisites

1. **Android Emulator or Device** running and connected
2. **Metro Bundler** running (`npx expo start`)
3. **App installed** on device (`npx expo run:android`)
4. **App data cleared** before test (script handles this)

## Test Strategy

### When to Run Unit Tests
- ✅ Before every commit
- ✅ In CI/CD pipeline
- ✅ When modifying calculation logic
- ✅ When adding new calculation methods

### When to Run E2E Tests
- ✅ Before releases
- ✅ After UI changes
- ✅ When onboarding flow changes
- ✅ Weekly regression testing

### Test Coverage Goals

- **Unit Tests**: 100% coverage of `lib/prayer.ts`
- **E2E Tests**: Cover critical user paths (onboarding → home screen)

## Troubleshooting

### Unit Tests Fail

**Issue**: Prayer times don't match expected values
- **Solution**: Verify reference values against official sources (Diyanet for Turkey method)
- **Note**: Times may vary slightly due to timezone handling

**Issue**: Tests fail on different machines
- **Solution**: Ensure consistent timezone settings
- **Check**: `TZ` environment variable

### E2E Tests Fail

**Issue**: "Konumunuz" not found
- **Solution**: Clear app data: `adb shell pm clear com.namazvakitleri.family`

**Issue**: App crashes on launch
- **Solution**: Rebuild app: `npx expo run:android`

**Issue**: Test hangs
- **Solution**: Check Metro bundler is running and ready
- **Solution**: Restart emulator/device

## Continuous Integration

### Recommended CI Setup

```yaml
# Example GitHub Actions
- name: Run Unit Tests
  run: npm run test:unit

- name: Run E2E Tests
  run: |
    # Start emulator
    # Install app
    npm run test:e2e
```

## Reference Values

### Istanbul, Turkey - June 15, 2025 (Turkey Method)

These values should be verified against [Diyanet İşleri Başkanlığı](https://www.diyanet.gov.tr):

- **Fajr**: ~03:30-04:00 (UTC+3)
- **Sunrise**: ~05:30-06:00
- **Dhuhr**: ~13:00-13:30
- **Asr**: ~16:30-17:00
- **Maghrib**: ~20:30-21:00
- **Isha**: ~22:00-22:30

**Note**: Update test file with exact values from Diyanet for production accuracy.

## Maintenance

### Updating Reference Values

1. Get official prayer times from Diyanet website
2. Update expected values in `__tests__/prayerCalculation.test.ts`
3. Run tests to verify

### Adding New Test Cases

1. Add test case to `__tests__/prayerCalculation.test.ts`
2. Use real calculation (no mocking)
3. Verify against official sources
4. Document reference source in test comments

## Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and mocks
- `__tests__/prayerCalculation.test.ts` - Unit tests
- `.maestro/smoke_test.yaml` - E2E test flow
- `package.json` - Test scripts
