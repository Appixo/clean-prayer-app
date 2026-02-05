# Smoke E2E: Launch, permissions, home, About.
# Implementation: .maestro/smoke_test_flutter.yaml

Feature: Home Smoke
  As a user I want the app to launch and show prayer times so I can verify basic functionality.

  Scenario: App launches and shows home screen
    Given the app is launched with clear state
    When permission prompts appear
    Then I tap Allow to grant permissions
    And the home screen shows "Namaz Vakitleri"
    And prayer times (Fajr, Dhuhr, Maghrib) are visible

  Scenario: User can open About from Settings
    Given the home screen is visible
    When I tap Settings (Ayarlar)
    And I tap About (Hakkında)
    Then the About screen shows app name or version
