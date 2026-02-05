Feature: Prayer Times Display
  Logic and state integration (no emulator).
  flutter_gherkin drives Bloc/use-case assertions in Dart VM.

  Scenario: Next prayer state for known location
    Given the user location is Utrecht
    And the calculation method is Turkey
    When prayer times are loaded for today
    Then the next prayer state should be available
    And all six prayer times should be present

  Scenario: Prayer times order
    Given the user location is Istanbul
    When prayer times are loaded for date "2025-06-15"
    Then Fajr should be before Sunrise
    And Sunrise should be before Dhuhr
    And Dhuhr should be before Asr
    And Asr should be before Maghrib
    And Maghrib should be before Isha
