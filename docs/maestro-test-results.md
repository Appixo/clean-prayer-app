# Interpreting Maestro Test Results (Flutter)

Maestro E2E tests are run from **namaz_vakitleri_flutter** using `.maestro/smoke_test_flutter.yaml`. See [README-MAESTRO.md](../README-MAESTRO.md) for how to run them.

## Understanding test output

### Success indicators

- All steps marked with `+` (plus sign) = step passed.
- Assertions showing target text found (e.g. "Namaz Vakitleri") = test progressing correctly.
- Final assertions for home/Settings/About = test completed successfully.

### Expected warnings

Optional steps (e.g. tapping "Allow" or "Ayarlar") may show a warning if the element is not found. The test continues; this is normal.

### Cleanup exceptions (non-critical)

At the end of a successful run you may see:

```
java.io.IOException: device offline
java.util.concurrent.TimeoutException: Couldn't close Maestro Android driver ...
```

This is **not** a test failure. It happens when Maestro loses connection during cleanup. If all steps show `+`, the test passed.

## Quick result check

- **Passed:** All steps show `+`; assertions for "Namaz Vakitleri" (and any flow-specific text) passed.
- **Failed:** Any step shows `X`; critical assertions failed; test stopped before completion.

## Running and checking results

- **Run:** From `namaz_vakitleri_flutter`: `maestro test .maestro/smoke_test_flutter.yaml`
- **Logs:** Maestro saves runs under `~/.maestro/tests/` (or your Maestro config path).
- **Troubleshooting:** See [README-MAESTRO.md](../README-MAESTRO.md).
