# BDD Feature Files

These Gherkin feature files describe E2E scenarios as BDD specifications. They serve as living documentation and traceability; the actual implementation runs via **Maestro** YAML flows.

## Mapping

| Feature File          | Maestro Flow             | Description                         |
|-----------------------|--------------------------|-------------------------------------|
| `home_smoke.feature`  | `smoke_test_flutter.yaml`| Smoke: launch, permissions, home, About |
| `onboarding.feature`  | `production_check.yaml`  | Production: onboarding, Utrecht, Settings, Dini Günler |
| `prayer_times_display.feature` | (unit) `test/prayer_times_bdd_logic_test.dart` | Logic-only: prayer calculation (no emulator) |

## Running Tests

- **Unit + E2E:** `.\scripts\run_all_tests.ps1` (or `run_all_tests.cmd`)
- **E2E only:** `.\scripts\run_all_tests.ps1 -TestType e2e`
- **Unit only:** `flutter test`

Output: `test_results/<timestamp>/` with logs, screenshots, recordings, `run_summary.json`.
